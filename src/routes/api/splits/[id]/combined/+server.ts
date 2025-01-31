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

export async function GET({ params }): Promise<Response> {
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

			// If not, check with increasingly large buffers
			const bufferSizes = [0.01, 0.05, 0.1]; // degrees
			for (const size of bufferSizes) {
				const buffered1 = turf.buffer(poly1, size, { units: 'degrees' });
				const buffered2 = turf.buffer(poly2, size, { units: 'degrees' });
				if (!buffered1 || !buffered2) continue;

				if (turf.booleanIntersects(buffered1, buffered2)) {
					return true;
				}
			}

			// Also check if they're within a certain distance of each other
			const distance = turf.distance(turf.center(poly1), turf.center(poly2), {
				units: 'kilometers'
			});
			return distance < 50; // 50km threshold
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
			// Convert all features to individual Polygons
			const individualPolygons = polygons.flatMap(explodeToPolygons);

			// Group connected polygons
			const groups: GeoJSONFeature[][] = [];
			const remaining = [...individualPolygons];

			while (remaining.length > 0) {
				const current = remaining.pop()!;
				const group = [current];
				let changed = true;

				// Keep checking for polygons to merge until no more are found
				while (changed) {
					changed = false;
					for (let i = remaining.length - 1; i >= 0; i--) {
						if (group.some((poly) => shouldMerge(poly, remaining[i]))) {
							group.push(remaining[i]);
							remaining.splice(i, 1);
							changed = true;
						}
					}
				}

				groups.push(group);
			}

			// Merge each group of connected polygons
			return groups.map((group) => {
				if (group.length === 1) {
					return removeHoles(group[0]);
				}

				// Create a feature collection and merge
				const collection = turf.featureCollection(group);
				const dissolved = turf.dissolve(collection);

				if (!dissolved || dissolved.features.length === 0) {
					return removeHoles(group[0]);
				}

				const result = removeHoles(dissolved.features[0]);
				return turf.simplify(result, { tolerance: 0.01, highQuality: true });
			});
		} catch (error) {
			console.error('Error merging group polygons:', error);
			return [];
		}
	};

	// Create feature collections for high and low
	const createFeatureCollection = (
		polygonsByGroup: Map<string, GeoJSONFeature[]>
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

	// Create the response object with a feature collection for each tag
	const response: Record<string, GeoJSONFeatureCollection> = {};
	for (const [tag, polygonsByGroup] of polygonsByTag) {
		response[tag] = createFeatureCollection(polygonsByGroup);
	}

	return new Response(JSON.stringify(response));
}
