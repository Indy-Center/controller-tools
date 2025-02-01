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
type PolygonFeature = GeoJSON.Feature<GeoJSON.Polygon>;
type MultiPolygonFeature = GeoJSON.Feature<GeoJSON.MultiPolygon>;
type AnyPolygonFeature = PolygonFeature | MultiPolygonFeature;

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
		// Convert each polygon in the MultiPolygon to a separate feature
		return feature.geometry.coordinates.map((coords) => ({
			type: 'Feature',
			properties: feature.properties,
			geometry: {
				type: 'Polygon',
				coordinates: coords
			}
		}));
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

	// Helper to snap coordinates to a grid
	const snapToGrid = (coords: Position[], precision: number = 0.0005): Position[] => {
		// First snap all points to the grid
		const snapped = coords.map((coord) => [
			Math.round(coord[0] / precision) * precision,
			Math.round(coord[1] / precision) * precision
		]);

		// Ensure the polygon is closed by making the last point match the first
		if (snapped.length > 0) {
			snapped[snapped.length - 1] = [...snapped[0]];
		}

		return snapped;
	};

	// Helper to ensure vertices are properly connected
	const connectVertices = (coords: Position[]): Position[] => {
		const connected: Position[] = [];
		const threshold = 0.001; // About 100m at the equator

		for (let i = 0; i < coords.length; i++) {
			const current = coords[i];
			connected.push(current);

			// If this isn't the last point, check if we need to add intermediate points
			if (i < coords.length - 1) {
				const next = coords[i + 1];
				const dist = turf.distance(turf.point(current), turf.point(next), { units: 'kilometers' });

				// If the gap is too large, add intermediate points
				if (dist > 1) {
					// If points are more than 1km apart
					const steps = Math.ceil(dist);
					for (let j = 1; j < steps; j++) {
						const t = j / steps;
						connected.push([
							current[0] + (next[0] - current[0]) * t,
							current[1] + (next[1] - current[1]) * t
						]);
					}
				}
			}
		}

		return connected;
	};

	// Helper to snap a feature's coordinates to a grid
	const snapFeatureToGrid = (feature: GeoJSONFeature): GeoJSONFeature => {
		const precision = 0.0005; // About 50m at the equator - finer precision for better alignment
		if (feature.geometry.type === 'Polygon') {
			feature.geometry.coordinates = feature.geometry.coordinates.map((ring) =>
				connectVertices(snapToGrid(ring, precision))
			);
		} else if (feature.geometry.type === 'MultiPolygon') {
			feature.geometry.coordinates = feature.geometry.coordinates.map((poly) =>
				poly.map((ring) => connectVertices(snapToGrid(ring, precision)))
			);
		}
		return feature;
	};

	// Type guard to check if a feature is a Polygon
	const isPolygon = (
		feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
	): feature is GeoJSON.Feature<GeoJSON.Polygon> => {
		return feature.geometry.type === 'Polygon';
	};

	// Type guard to check if a feature is a MultiPolygon
	const isMultiPolygon = (
		feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
	): feature is GeoJSON.Feature<GeoJSON.MultiPolygon> => {
		return feature.geometry.type === 'MultiPolygon';
	};

	// Helper to convert coordinates to a polygon feature
	const coordsToPolygon = (coords: Position[][]): GeoJSON.Feature<GeoJSON.Polygon> => {
		return {
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'Polygon',
				coordinates: coords
			}
		};
	};

	// Helper to convert a feature to a single polygon if possible
	const ensureSinglePolygon = (
		feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
	): GeoJSON.Feature<GeoJSON.Polygon> | null => {
		try {
			if (feature.geometry.type === 'Polygon') {
				return feature as GeoJSON.Feature<GeoJSON.Polygon>;
			} else if (feature.geometry.type === 'MultiPolygon') {
				// Take the largest polygon from the MultiPolygon
				const areas = feature.geometry.coordinates.map((poly) => {
					const geom: GeoJSON.Polygon = {
						type: 'Polygon',
						coordinates: poly
					};
					return turf.area(turf.feature(geom));
				});
				const largestIndex = areas.indexOf(Math.max(...areas));
				const coords = feature.geometry.coordinates[largestIndex];

				// Create a new polygon feature
				const geom: GeoJSON.Polygon = {
					type: 'Polygon',
					coordinates: coords
				};
				return turf.feature(geom, feature.properties);
			}
			return null;
		} catch (error) {
			console.error('Error converting to single polygon:', error);
			return null;
		}
	};

	// Helper to convert a polygon to a line string
	const polygonToLineString = (
		poly: GeoJSON.Feature<GeoJSON.Polygon>
	): GeoJSON.Feature<GeoJSON.LineString> => {
		const line = turf.polygonToLine(poly);
		if (!line) {
			throw new Error('Could not convert polygon to line');
		}

		if (line.type === 'FeatureCollection') {
			const firstFeature = line.features[0];
			if (firstFeature.geometry.type === 'LineString') {
				return firstFeature as GeoJSON.Feature<GeoJSON.LineString>;
			}
			if (firstFeature.geometry.type === 'MultiLineString') {
				return turf.lineString(firstFeature.geometry.coordinates[0]);
			}
		} else if (line.geometry.type === 'LineString') {
			return line as GeoJSON.Feature<GeoJSON.LineString>;
		} else if (line.geometry.type === 'MultiLineString') {
			return turf.lineString(line.geometry.coordinates[0]);
		}

		throw new Error('Could not convert polygon to LineString');
	};

	// Helper to find shared boundary between two polygons
	const findSharedBoundary = (
		poly1: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
		poly2: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
	): Position[][] | null => {
		try {
			// Convert to single polygons first
			const singlePoly1 = ensureSinglePolygon(poly1);
			const singlePoly2 = ensureSinglePolygon(poly2);
			if (!singlePoly1 || !singlePoly2) return null;

			try {
				// Convert polygons to lines
				const line1 = polygonToLineString(singlePoly1);
				const line2 = polygonToLineString(singlePoly2);

				// Buffer the lines slightly to find near matches
				const buffer1 = turf.buffer(line1, 0.001, { units: 'degrees' });
				const buffer2 = turf.buffer(line2, 0.001, { units: 'degrees' });
				if (!buffer1 || !buffer2) return null;

				// Get coordinates from the single polygons
				const coords1 = singlePoly1.geometry.coordinates[0];
				const coords2 = singlePoly2.geometry.coordinates[0];

				// Find sequences of points that form shared boundaries
				const segments: Position[][] = [];
				let currentSegment: Position[] = [];

				// Helper to check if a point is near a line
				const isPointNearLine = (
					point: Position,
					buffer: GeoJSON.Feature<GeoJSON.Polygon>
				): boolean => {
					return turf.booleanPointInPolygon(turf.point(point), buffer);
				};

				// Process points from both polygons to find shared segments
				for (let i = 0; i < coords1.length - 1; i++) {
					const p1 = coords1[i];
					const p2 = coords1[i + 1];

					// Check if both points are near the other polygon's line
					if (isPointNearLine(p1, buffer2) && isPointNearLine(p2, buffer2)) {
						// Find the closest points on poly2
						let bestMatch: Position[] | null = null;
						let minDist = Infinity;

						for (let j = 0; j < coords2.length - 1; j++) {
							const q1 = coords2[j];
							const q2 = coords2[j + 1];

							if (isPointNearLine(q1, buffer1) && isPointNearLine(q2, buffer1)) {
								const dist1 = turf.distance(turf.point(p1), turf.point(q1), {
									units: 'kilometers'
								});
								const dist2 = turf.distance(turf.point(p2), turf.point(q2), {
									units: 'kilometers'
								});
								const totalDist = dist1 + dist2;

								if (totalDist < minDist) {
									minDist = totalDist;
									bestMatch = [q1, q2];
								}
							}
						}

						if (bestMatch) {
							// Average the points to get the shared boundary
							segments.push([
								[(p1[0] + bestMatch[0][0]) / 2, (p1[1] + bestMatch[0][1]) / 2] as Position,
								[(p2[0] + bestMatch[1][0]) / 2, (p2[1] + bestMatch[1][1]) / 2] as Position
							]);
						}
					}
				}

				return segments;
			} catch (error) {
				console.error('Error processing lines:', error);
				return null;
			}
		} catch (error) {
			console.error('Error finding shared boundary:', error);
			return null;
		}
	};

	// Helper to align shared boundaries between polygons
	const alignSharedBoundaries = (polygons: GeoJSONFeature[]): GeoJSONFeature[] => {
		const aligned = [...polygons];
		const sharedBoundaries = new Map<string, Position[]>();

		// First pass: identify all shared boundaries
		for (let i = 0; i < aligned.length; i++) {
			for (let j = i + 1; j < aligned.length; j++) {
				const shared = findSharedBoundary(aligned[i], aligned[j]);
				if (!shared || shared.length === 0) continue;

				// Store each shared segment with a unique key based on its endpoints
				shared.forEach((segment) => {
					const key = segment
						.map((p) => `${p[0]},${p[1]}`)
						.sort()
						.join('|');
					sharedBoundaries.set(key, segment);
				});
			}
		}

		// Second pass: update all polygons to use the shared boundaries
		aligned.forEach((poly) => {
			const coords =
				poly.geometry.type === 'Polygon'
					? poly.geometry.coordinates[0]
					: poly.geometry.coordinates[0][0];

			const newCoords: Position[] = [];
			for (let i = 0; i < coords.length - 1; i++) {
				const p1 = coords[i];
				const p2 = coords[i + 1];

				// Check if this segment matches any shared boundary
				let foundShared = false;
				for (const [key, shared] of sharedBoundaries) {
					const dist1 = Math.min(
						turf.distance(turf.point(p1), turf.point(shared[0]), { units: 'kilometers' }),
						turf.distance(turf.point(p1), turf.point(shared[1]), { units: 'kilometers' })
					);
					const dist2 = Math.min(
						turf.distance(turf.point(p2), turf.point(shared[0]), { units: 'kilometers' }),
						turf.distance(turf.point(p2), turf.point(shared[1]), { units: 'kilometers' })
					);

					if (dist1 < 0.1 && dist2 < 0.1) {
						// Use the exact shared boundary points
						newCoords.push(shared[0]);
						if (i === coords.length - 2) {
							newCoords.push(shared[1]);
						}
						foundShared = true;
						break;
					}
				}

				if (!foundShared) {
					newCoords.push(p1);
					if (i === coords.length - 2) {
						newCoords.push(p2);
					}
				}
			}

			// Ensure the polygon is closed
			if (
				newCoords[0][0] !== newCoords[newCoords.length - 1][0] ||
				newCoords[0][1] !== newCoords[newCoords.length - 1][1]
			) {
				newCoords.push([...newCoords[0]]);
			}

			// Update the polygon coordinates
			if (poly.geometry.type === 'Polygon') {
				poly.geometry.coordinates[0] = newCoords;
			} else {
				poly.geometry.coordinates[0][0] = newCoords;
			}
		});

		return aligned;
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

	// Original mergeGroupPolygons for the non-export case
	const mergeGroupPolygons = (polygons: GeoJSONFeature[]): GeoJSONFeature[] => {
		if (polygons.length === 0) return [];
		if (polygons.length === 1) return [polygons[0]];

		try {
			// Convert all features to individual Polygons and remove holes
			const cleanedPolygons = polygons.flatMap(explodeToPolygons);

			// Add a tiny buffer to each polygon to ensure they connect
			const bufferedPolygons = cleanedPolygons.map((poly) => {
				const buffered = turf.buffer(poly, 0.001, { units: 'degrees' });
				return buffered || poly;
			});

			// Create a feature collection with all polygons
			const collection = turf.featureCollection(bufferedPolygons);

			// Merge all polygons at once using dissolve
			const dissolved = turf.dissolve(collection as GeoJSON.FeatureCollection);
			if (!dissolved || dissolved.features.length === 0) {
				return [cleanedPolygons[0]];
			}

			// Clean up and simplify the result
			const result = dissolved.features.map((feature) => {
				// Simplify with slightly higher tolerance
				return turf.simplify(feature, { tolerance: 0.02, highQuality: true });
			});

			return result;
		} catch (error) {
			console.error('Error merging group polygons:', error);
			return [];
		}
	};

	// Special version for export that removes holes and only keeps outer rings
	const mergeGroupPolygonsForExport = (polygons: GeoJSONFeature[]): GeoJSONFeature[] => {
		if (polygons.length === 0) return [];
		if (polygons.length === 1) return [removeHoles(polygons[0])];

		try {
			// First explode any MultiPolygons into individual Polygons
			const individualPolygons = polygons.flatMap(explodeToPolygons);

			// Remove holes from all polygons
			const cleanedPolygons = individualPolygons.map(removeHoles);

			// Create a feature collection
			const collection = turf.featureCollection(cleanedPolygons);

			// Use union to merge everything into one
			let result = cleanedPolygons[0];
			for (let i = 1; i < cleanedPolygons.length; i++) {
				const unionCollection = turf.featureCollection([result, cleanedPolygons[i]]);
				try {
					const union = turf.union(unionCollection as any);
					if (union) {
						result = union;
					}
				} catch (error) {
					console.error('Error in union operation:', error);
					// If union fails, try to keep the polygons separate
					if (result.geometry.type === 'MultiPolygon') {
						result.geometry.coordinates.push(...cleanedPolygons[i].geometry.coordinates);
					} else {
						result = {
							type: 'Feature',
							properties: result.properties,
							geometry: {
								type: 'MultiPolygon',
								coordinates: [
									[result.geometry.coordinates[0]],
									[cleanedPolygons[i].geometry.coordinates[0]]
								]
							}
						};
					}
				}
			}

			return [result];
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
		const groupPolygons: GeoJSONFeature[] = [];

		// Phase 1: Create one polygon per group by dissolving all polygons in each group
		for (const [groupId, polygons] of polygonsByGroup) {
			// Get group information
			const group = split.find((row) => row.split_groups?.id === groupId)?.split_groups;
			if (!group) continue;

			// Merge all polygons in this group into one
			const mergedPolygons = mergeGroupPolygons(polygons);
			if (mergedPolygons.length > 0) {
				// Add group information
				mergedPolygons[0].properties = {
					groupId: group.id,
					groupName: group.name,
					groupColor: group.color
				};
				groupPolygons.push(mergedPolygons[0]);
			}
		}

		// Phase 2: Align borders between groups
		const alignedPolygons = alignSharedBoundaries(groupPolygons);

		return turf.featureCollection(alignedPolygons) as GeoJSONFeatureCollection;
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

		// Get midpoints
		const mid1: Position = [(line1[0][0] + line1[1][0]) / 2, (line1[0][1] + line1[1][1]) / 2];
		const mid2: Position = [(line2[0][0] + line2[1][0]) / 2, (line2[0][1] + line2[1][1]) / 2];

		// Check if lines are nearly parallel (within 5 degrees)
		const areParallel = dirDiff < 0.087 || Math.abs(dirDiff - Math.PI) < 0.087;

		// Calculate distances between endpoints
		const d1 = Math.min(
			turf.distance(turf.point(line1[0]), turf.point(line2[0]), { units: 'kilometers' }) +
				turf.distance(turf.point(line1[1]), turf.point(line2[1]), { units: 'kilometers' }),
			turf.distance(turf.point(line1[0]), turf.point(line2[1]), { units: 'kilometers' }) +
				turf.distance(turf.point(line1[1]), turf.point(line2[0]), { units: 'kilometers' })
		);

		// Calculate midpoint distance
		const midDist = turf.distance(turf.point(mid1), turf.point(mid2), { units: 'kilometers' });

		// Lines are similar if they are parallel and either:
		// 1. Their endpoints are very close
		// 2. Their midpoints are close and they have similar lengths
		return areParallel && (d1 < 1.0 || midDist < 0.5);
	};

	// Helper to remove self-intersecting segments
	const removeSelfIntersections = (lines: Position[][]): Position[][] => {
		const result: Position[][] = [];
		const used = new Set<string>();

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const key = `${line[0][0]},${line[0][1]}-${line[1][0]},${line[1][1]}`;
			const reverseKey = `${line[1][0]},${line[1][1]}-${line[0][0]},${line[0][1]}`;

			if (!used.has(key) && !used.has(reverseKey)) {
				let shouldAdd = true;

				// Check if this line creates a self-intersection
				for (const existing of result) {
					if (turf.booleanIntersects(turf.lineString(line), turf.lineString(existing))) {
						shouldAdd = false;
						break;
					}
				}

				if (shouldAdd) {
					result.push(line);
					used.add(key);
				}
			}
		}

		return result;
	};

	// Create the response based on export format
	if (isExport && tags.length > 0) {
		// First merge all areas within each group
		const groupPolygons: GeoJSONFeature[] = [];
		const groupInfo = new Map<string, { id: string; name: string; color: string }>();

		for (const tag of tags) {
			const polygonsByGroup = polygonsByTag.get(tag);
			if (polygonsByGroup) {
				for (const [groupId, polygons] of polygonsByGroup) {
					// Merge all polygons in this group into one
					const merged = mergeGroupPolygonsForExport(polygons);
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
							groupInfo.set(group.id, {
								id: group.id,
								name: group.name,
								color: group.color
							});
						}
						groupPolygons.push(groupPolygon);
					}
				}
			}
		}

		// Extract lines by group
		const linesByGroup = new Map<string, GeoJSON.Feature<GeoJSON.LineString>[]>();

		for (const poly of groupPolygons) {
			const groupId = poly.properties?.groupId;
			if (!groupId) continue;

			if (!linesByGroup.has(groupId)) {
				linesByGroup.set(groupId, []);
			}

			// Get just the outer ring(s)
			const rings =
				poly.geometry.type === 'Polygon'
					? [poly.geometry.coordinates[0]] // First ring is outer
					: poly.geometry.coordinates.map((p) => p[0]); // For each polygon in MultiPolygon, get outer ring

			// Convert each ring to line segments
			for (const ring of rings) {
				for (let i = 0; i < ring.length - 1; i++) {
					const segment = [ring[i], ring[i + 1]];

					// Skip very short segments
					const segmentLength = turf.distance(turf.point(segment[0]), turf.point(segment[1]), {
						units: 'kilometers'
					});
					if (segmentLength < 0.3) continue;

					// Check if we have a similar line already in this group
					const groupLines = linesByGroup.get(groupId)!;
					let foundSimilar = false;
					for (let j = 0; j < groupLines.length; j++) {
						const existingLine = groupLines[j].geometry.coordinates as Position[];
						if (areLinesSimilar(segment, existingLine)) {
							// Replace the existing line with the average
							groupLines[j] = turf.lineString(averageLines(segment, existingLine));
							foundSimilar = true;
							break;
						}
					}

					// If no similar line found, add this one
					if (!foundSimilar) {
						linesByGroup.get(groupId)!.push(turf.lineString(segment));
					}
				}
			}
		}

		// Create a MultiLineString feature for each group
		const features: GeoJSON.Feature[] = [];

		// Add the style point first
		features.push({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [-88.0, 40.0] },
			properties: {
				isLineDefaults: true,
				bcg: 12,
				filters: [12],
				style: 'ShortDashed',
				thickness: 1
			}
		});

		// Add each group's lines as a separate feature
		for (const [groupId, lines] of linesByGroup) {
			const group = groupInfo.get(groupId);
			if (!group) continue;

			features.push({
				type: 'Feature',
				properties: {
					groupId: group.id,
					groupName: group.name,
					groupColor: group.color
				},
				geometry: {
					type: 'MultiLineString',
					coordinates: lines.map((line) => line.geometry.coordinates)
				}
			});
		}

		const exportResponse = {
			type: 'FeatureCollection',
			name: `${split[0].splits.name} Export`,
			crs: {
				type: 'name',
				properties: {
					name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
				}
			},
			features
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
