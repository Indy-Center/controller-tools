import { db } from '$lib/server/db';
import {
	splitsTable,
	splitGroupsTable,
	splitGroupAreasTable,
	areaMetadataTable
} from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import * as turf from '@turf/turf';

type GeoJSONFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
type GeoJSONPolygon = GeoJSON.Feature<GeoJSON.Polygon>;
type GeoJSONFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
type GeoJSONMultiLineString = GeoJSON.Feature<GeoJSON.MultiLineString>;
type GeoJSONLineString = GeoJSON.Feature<GeoJSON.LineString>;
type Position = GeoJSON.Position;

export async function GET({ params, url }): Promise<Response> {
	const exportFormat = url.searchParams.get('export');
	const tags = url.searchParams.get('tags')?.split(',') || [];
	const isExport = exportFormat === 'crc';

	const split = await db
		.select()
		.from(splitsTable)
		.where(eq(splitsTable.id, params.id))
		.leftJoin(splitGroupsTable, eq(splitGroupsTable.splitId, splitsTable.id))
		.leftJoin(splitGroupAreasTable, eq(splitGroupAreasTable.groupId, splitGroupsTable.id))
		.leftJoin(areaMetadataTable, eq(areaMetadataTable.id, splitGroupAreasTable.areaId));

	if (split.length === 0) {
		return new Response('Split not found', { status: 404 });
	}

	// Group polygons by tag and group ID
	const polygonsByTag = new Map<string, Map<string, GeoJSONFeature[]>>();

	split.forEach((row) => {
		if (!row.area_metadata?.geojson || !row.split_groups || !row.area_metadata.tag) return;

		const groupId = row.split_groups.id;
		const tag = row.area_metadata.tag;
		const geojsonCollection = row.area_metadata.geojson as GeoJSON.FeatureCollection;
		const features = geojsonCollection.features as GeoJSONFeature[];

		// Initialize map for this tag if it doesn't exist
		if (!polygonsByTag.has(tag)) {
			polygonsByTag.set(tag, new Map<string, GeoJSONFeature[]>());
		}

		// Initialize array for this group if it doesn't exist
		const tagMap = polygonsByTag.get(tag)!;
		if (!tagMap.has(groupId)) {
			tagMap.set(groupId, []);
		}

		// Add features to the group
		tagMap.get(groupId)?.push(...features);
	});

	// Convert a feature to individual Polygons
	const explodeToPolygons = (feature: GeoJSONFeature): GeoJSONPolygon[] => {
		if (feature.geometry.type === 'Polygon') {
			return [feature as GeoJSONPolygon];
		}
		// Convert MultiPolygon to array of Polygons
		return feature.geometry.coordinates.map((coords) => turf.polygon(coords) as GeoJSONPolygon);
	};

	// Remove holes from a polygon by keeping only the outer ring
	const removeHoles = (feature: GeoJSONFeature): GeoJSONFeature => {
		if (feature.geometry.type === 'Polygon') {
			// Keep only the first ring (outer boundary) and remove any holes
			feature.geometry.coordinates = [feature.geometry.coordinates[0]];
		} else if (feature.geometry.type === 'MultiPolygon') {
			// For each polygon in the MultiPolygon, keep only the outer ring
			feature.geometry.coordinates = feature.geometry.coordinates.map((poly) => [poly[0]]);
		}
		return feature;
	};

	// Check if two polygons should be merged (they intersect or touch)
	const shouldMerge = (poly1: GeoJSONFeature, poly2: GeoJSONFeature): boolean => {
		try {
			// First check if they intersect without buffering
			if (turf.booleanIntersects(poly1, poly2)) {
				return true;
			}

			// Use even larger buffers to catch polygons that should be merged
			const bufferSizes = [0.1, 0.2, 0.3]; // degrees - increased buffer sizes
			for (const size of bufferSizes) {
				const buffered1 = turf.buffer(poly1, size, { units: 'degrees' });
				const buffered2 = turf.buffer(poly2, size, { units: 'degrees' });
				if (!buffered1 || !buffered2) continue;

				if (turf.booleanIntersects(buffered1, buffered2)) {
					return true;
				}

				// Also check if one contains the other after buffering
				if (turf.booleanContains(buffered1, poly2) || turf.booleanContains(buffered2, poly1)) {
					return true;
				}
			}

			// Also check if they're within a certain distance of each other
			const distance = turf.distance(turf.center(poly1), turf.center(poly2), {
				units: 'kilometers'
			});
			return distance < 150; // Increased distance threshold
		} catch (error) {
			console.error('Error checking intersection:', error);
			return false;
		}
	};

	// Merge polygons for each group
	const mergeGroupPolygons = (polygons: GeoJSONFeature[]): GeoJSONFeature[] => {
		if (polygons.length === 0) return [];
		if (polygons.length === 1) return [removeHoles(polygons[0])];

		try {
			// Convert all features to individual Polygons and remove holes
			const cleanedPolygons = polygons.flatMap(explodeToPolygons).map(removeHoles);

			// Add a tiny buffer to each polygon to ensure they connect
			const bufferedPolygons = cleanedPolygons.map((poly) => {
				const buffered = turf.buffer(poly, 0.001, { units: 'degrees' });
				return buffered || poly;
			});

			// Create a feature collection with all polygons
			const collection = turf.featureCollection(bufferedPolygons);

			// Merge all polygons at once using dissolve
			const dissolved = turf.dissolve(collection as GeoJSON.FeatureCollection<GeoJSON.Polygon>);

			if (!dissolved || dissolved.features.length === 0) {
				return [removeHoles(cleanedPolygons[0])];
			}

			// Clean up and simplify the result
			const result = dissolved.features.map((feature) => {
				// Remove any remaining holes
				const noHoles = removeHoles(feature);

				// Simplify with slightly higher tolerance
				return turf.simplify(noHoles, { tolerance: 0.02, highQuality: true });
			});

			return result;
		} catch (error) {
			console.error('Error merging group polygons:', error);
			return [];
		}
	};

	// Create feature collections for high and low
	const createFeatureCollection = (
		polygonsByGroup: Map<string, GeoJSONFeature[]>,
		tag: string
	): GeoJSONFeatureCollection => {
		const mergedFeatures: GeoJSONFeature[] = [];

		for (const [groupId, polygons] of polygonsByGroup) {
			const merged = mergeGroupPolygons(polygons);
			for (const feature of merged) {
				// Add group information to properties
				const group = split.find((row) => row.split_groups?.id === groupId)?.split_groups;
				if (group) {
					feature.properties = {
						groupId: group.id,
						groupName: group.name,
						groupColor: group.color
					};
				}
				mergedFeatures.push(feature);
			}
		}

		return turf.featureCollection(mergedFeatures) as GeoJSONFeatureCollection;
	};

	// Convert polygon to MultiLineString and remove duplicates
	const convertToUniqueMultiLineString = (feature: GeoJSONFeature): GeoJSONMultiLineString => {
		// Convert polygon coordinates to lines
		const lines: Position[][] = [];
		if (feature.geometry.type === 'Polygon') {
			lines.push(...feature.geometry.coordinates.map((ring) => ring));
		} else if (feature.geometry.type === 'MultiPolygon') {
			feature.geometry.coordinates.forEach((poly) => {
				lines.push(...poly.map((ring) => ring));
			});
		}

		// Helper to check if two points are very close
		const arePointsClose = (p1: Position, p2: Position): boolean => {
			const tolerance = 0.101; // About 7 miles at the equator
			return Math.abs(p1[0] - p2[0]) < tolerance && Math.abs(p1[1] - p2[1]) < tolerance;
		};

		// Helper to average two points
		const averagePoints = (p1: Position, p2: Position): Position => {
			return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
		};

		// Group similar line segments and average them
		const lineGroups: { lines: Position[][] }[] = [];

		lines.forEach((line) => {
			for (let i = 0; i < line.length - 1; i++) {
				const start = line[i];
				const end = line[i + 1];

				// Skip very short lines
				if (arePointsClose(start, end)) continue;

				// Try to find a group this line belongs to
				let foundGroup = false;
				for (const group of lineGroups) {
					const firstLine = group.lines[0];
					// Check if this line is similar to the first line in the group
					if (
						(arePointsClose(start, firstLine[0]) && arePointsClose(end, firstLine[1])) ||
						(arePointsClose(start, firstLine[1]) && arePointsClose(end, firstLine[0]))
					) {
						group.lines.push([start, end]);
						foundGroup = true;
						break;
					}
				}

				// If no matching group found, create a new one
				if (!foundGroup) {
					lineGroups.push({
						lines: [[start, end]]
					});
				}
			}
		});

		// Average each group into a single line
		const averagedLines = lineGroups.map((group) => {
			if (group.lines.length === 1) {
				return group.lines[0];
			}

			// Average all start points and all end points
			const starts = group.lines.map((line) => line[0]);
			const ends = group.lines.map((line) => line[1]);

			// Calculate average start and end points
			const avgStart: Position = starts
				.reduce((acc, curr) => [acc[0] + curr[0], acc[1] + curr[1]], [0, 0])
				.map((v) => v / starts.length) as Position;
			const avgEnd: Position = ends
				.reduce((acc, curr) => [acc[0] + curr[0], acc[1] + curr[1]], [0, 0])
				.map((v) => v / ends.length) as Position;

			return [avgStart, avgEnd];
		});

		return {
			type: 'Feature',
			properties: feature.properties,
			geometry: {
				type: 'MultiLineString',
				coordinates: averagedLines
			} as GeoJSON.MultiLineString
		};
	};

	// Helper to split a line into smaller segments
	const splitLineIntoSegments = (line: Position[]): Position[][] => {
		const segments: Position[][] = [];
		const numPoints = Math.ceil(
			turf.distance(turf.point(line[0]), turf.point(line[1]), { units: 'kilometers' }) / 0.5
		);

		if (numPoints <= 1) {
			return [line];
		}

		for (let i = 0; i < numPoints; i++) {
			const t = i / numPoints;
			const t2 = (i + 1) / numPoints;
			const start: Position = [
				line[0][0] + (line[1][0] - line[0][0]) * t,
				line[0][1] + (line[1][1] - line[0][1]) * t
			];
			const end: Position = [
				line[0][0] + (line[1][0] - line[0][0]) * t2,
				line[0][1] + (line[1][1] - line[0][1]) * t2
			];
			segments.push([start, end]);
		}
		return segments;
	};

	// Helper to check if two line segments are similar
	const areLinesSimilar = (line1: Position[], line2: Position[]): boolean => {
		// Calculate line directions
		const dir1 = Math.atan2(line1[1][1] - line1[0][1], line1[1][0] - line1[0][0]);
		const dir2 = Math.atan2(line2[1][1] - line2[0][1], line2[1][0] - line2[0][0]);
		const dirDiff = Math.abs(dir1 - dir2) % Math.PI;

		// Check if lines are nearly horizontal (within 5 degrees of horizontal)
		const isHorizontal1 =
			Math.abs(dir1 % Math.PI) < 0.09 || Math.abs((dir1 % Math.PI) - Math.PI) < 0.09;
		const isHorizontal2 =
			Math.abs(dir2 % Math.PI) < 0.09 || Math.abs((dir2 % Math.PI) - Math.PI) < 0.09;

		// Get midpoints and line lengths
		const mid1: Position = [(line1[0][0] + line1[1][0]) / 2, (line1[0][1] + line1[1][1]) / 2];
		const mid2: Position = [(line2[0][0] + line2[1][0]) / 2, (line2[0][1] + line2[1][1]) / 2];
		const midDist = turf.distance(turf.point(mid1), turf.point(mid2), { units: 'kilometers' });

		const len1 = turf.distance(turf.point(line1[0]), turf.point(line1[1]), { units: 'kilometers' });
		const len2 = turf.distance(turf.point(line2[0]), turf.point(line2[1]), { units: 'kilometers' });

		// Check endpoints
		const d1 = Math.max(
			turf.distance(turf.point(line1[0]), turf.point(line2[0]), { units: 'kilometers' }),
			turf.distance(turf.point(line1[1]), turf.point(line2[1]), { units: 'kilometers' })
		);
		const d2 = Math.max(
			turf.distance(turf.point(line1[0]), turf.point(line2[1]), { units: 'kilometers' }),
			turf.distance(turf.point(line1[1]), turf.point(line2[0]), { units: 'kilometers' })
		);

		// Special case for horizontal lines - be much more aggressive
		if (isHorizontal1 && isHorizontal2) {
			// For horizontal lines, mainly care about vertical distance and similar length
			const verticalDist = Math.abs(mid1[1] - mid2[1]) * 111; // Convert degrees to km (roughly)
			return (
				verticalDist < 10.0 && // More lenient vertical distance for horizontal lines
				Math.abs(len1 - len2) < Math.max(len1, len2) * 0.4 && // 40% length difference allowed
				Math.abs(mid1[0] - mid2[0]) < 0.5 // Ensure they're roughly in the same longitude
			);
		}

		// Check for parallel or nearly parallel lines (within 20 degrees)
		const areParallel = dirDiff < 0.35 || Math.abs(dirDiff - Math.PI) < 0.35;

		// Lines are similar if any of these conditions are met:
		// 1. They are parallel/nearly parallel AND their midpoints are close
		// 2. Their endpoints are very close
		// 3. They are parallel, similar in length, and their midpoints aren't too far
		return (
			(areParallel && midDist < 5.0) || // Increased distance for parallel lines
			Math.min(d1, d2) < 3.0 || // Increased endpoint distance threshold
			(areParallel &&
				Math.abs(len1 - len2) < Math.max(len1, len2) * 0.3 && // Length difference within 30%
				midDist < 8.0) // Even more lenient for similar parallel lines
		);
	};

	// Helper to average two line segments
	const averageLines = (line1: Position[], line2: Position[]): Position[] => {
		// Check which orientation has the minimum distance
		const d1 = Math.max(
			turf.distance(turf.point(line1[0]), turf.point(line2[0]), { units: 'kilometers' }),
			turf.distance(turf.point(line1[1]), turf.point(line2[1]), { units: 'kilometers' })
		);
		const d2 = Math.max(
			turf.distance(turf.point(line1[0]), turf.point(line2[1]), { units: 'kilometers' }),
			turf.distance(turf.point(line1[1]), turf.point(line2[0]), { units: 'kilometers' })
		);

		// Average the points based on the best orientation
		if (d1 < d2) {
			return [
				[(line1[0][0] + line2[0][0]) / 2, (line1[0][1] + line2[0][1]) / 2],
				[(line1[1][0] + line2[1][0]) / 2, (line1[1][1] + line2[1][1]) / 2]
			];
		} else {
			return [
				[(line1[0][0] + line2[1][0]) / 2, (line1[0][1] + line2[1][1]) / 2],
				[(line1[1][0] + line2[0][0]) / 2, (line1[1][1] + line2[0][1]) / 2]
			];
		}
	};

	// Create the response based on export format
	if (isExport && tags.length > 0) {
		// First merge all areas within each group
		const groupPolygons: GeoJSONFeature[] = [];

		for (const tag of tags) {
			const polygonsByGroup = polygonsByTag.get(tag);
			if (polygonsByGroup) {
				for (const [groupId, polygons] of polygonsByGroup) {
					// Merge all polygons in this group into one
					const merged = mergeGroupPolygons(polygons);
					if (merged.length > 0) {
						const groupPolygon = merged[0];
						// Add group information to properties
						const group = split.find((row) => row.split_groups?.id === groupId)?.split_groups;
						if (group) {
							groupPolygon.properties = {
								groupId: group.id,
								groupName: group.name,
								groupColor: group.color
							};
						}
						groupPolygons.push(groupPolygon);
					}
				}
			}
		}

		// Convert any MultiPolygons to Polygons first
		const singlePolygons = groupPolygons.flatMap((feature) => {
			if (feature.geometry.type === 'MultiPolygon') {
				return feature.geometry.coordinates.map(
					(coords) =>
						({
							type: 'Feature',
							properties: feature.properties,
							geometry: {
								type: 'Polygon',
								coordinates: coords
							}
						}) as GeoJSON.Feature<GeoJSON.Polygon>
				);
			}
			return [feature as GeoJSON.Feature<GeoJSON.Polygon>];
		});

		// Convert each polygon to lines and deduplicate similar segments
		const allLines: GeoJSON.Feature<GeoJSON.LineString>[] = [];
		const tolerance = 0.01; // About 1km at the equator

		// Process each polygon
		for (const poly of singlePolygons) {
			const polyLine = turf.polygonToLine(poly) as GeoJSON.Feature<
				GeoJSON.LineString | GeoJSON.MultiLineString
			>;
			if (!polyLine) continue;

			// Split into individual line segments
			const coords =
				polyLine.geometry.type === 'MultiLineString'
					? polyLine.geometry.coordinates.flat()
					: polyLine.geometry.coordinates;

			// Process each line segment
			for (let i = 0; i < coords.length - 1; i++) {
				const segment = coords.slice(i, i + 2) as Position[];

				// Skip very short segments
				const segmentLength = turf.distance(turf.point(segment[0]), turf.point(segment[1]), {
					units: 'kilometers'
				});
				if (segmentLength < 0.3) continue; // Reduced minimum length to catch more segments

				// Check if we have a similar line already
				let foundSimilar = false;
				for (let j = 0; j < allLines.length; j++) {
					const existingLine = allLines[j].geometry.coordinates as Position[];
					if (areLinesSimilar(segment, existingLine)) {
						// Replace the existing line with the average
						allLines[j] = turf.lineString(averageLines(segment, existingLine));
						foundSimilar = true;
						break;
					}
				}

				// If no similar line found, add this one
				if (!foundSimilar) {
					allLines.push(turf.lineString(segment));
				}
			}
		}

		// Post-process to remove any remaining duplicate or unnecessary lines
		const finalLines: GeoJSON.Feature<GeoJSON.LineString>[] = [];
		for (const line of allLines) {
			const coords = line.geometry.coordinates;
			// Skip if this line is too similar to any line we've already kept
			let shouldKeep = true;
			for (const kept of finalLines) {
				if (areLinesSimilar(coords, kept.geometry.coordinates)) {
					shouldKeep = false;
					break;
				}
			}
			if (shouldKeep) {
				finalLines.push(line);
			}
		}

		// Create a MultiLineString feature from all unique lines
		const multiLineFeature = {
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiLineString',
				coordinates: finalLines.map((line) => line.geometry.coordinates)
			} as GeoJSON.MultiLineString
		};

		const stylePoint = {
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [-88.0, 40.0] },
			properties: {
				isLineDefaults: true,
				bcg: 12,
				filters: [12],
				style: 'ShortDashed',
				thickness: 1
			}
		};

		const exportResponse = {
			type: 'FeatureCollection',
			name: `${split[0].splits.name} Export`,
			crs: {
				type: 'name',
				properties: {
					name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
				}
			},
			features: [stylePoint, multiLineFeature]
		};

		return new Response(JSON.stringify(exportResponse));
	}

	// Create the standard response object with a feature collection for each tag
	const response: Record<string, GeoJSONFeatureCollection> = {};
	for (const [tag, polygonsByGroup] of polygonsByTag) {
		response[tag] = createFeatureCollection(polygonsByGroup, tag);
	}

	return new Response(JSON.stringify(response));
}
