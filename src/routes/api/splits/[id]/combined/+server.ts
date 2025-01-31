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
	const highPolygonsByGroup = new Map<string, GeoJSONFeature[]>();
	const lowPolygonsByGroup = new Map<string, GeoJSONFeature[]>();

	split.forEach((row) => {
		if (!row.area_metadata?.geojson || !row.split_groups) return;

		const groupId = row.split_groups.id;
		const geojsonCollection = row.area_metadata.geojson as GeoJSON.FeatureCollection;
		// Include all features from the collection
		const features = geojsonCollection.features as GeoJSONFeature[];

		if (row.area_metadata.tag === 'high') {
			if (!highPolygonsByGroup.has(groupId)) {
				highPolygonsByGroup.set(groupId, []);
			}
			highPolygonsByGroup.get(groupId)?.push(...features);
		} else if (row.area_metadata.tag === 'low') {
			if (!lowPolygonsByGroup.has(groupId)) {
				lowPolygonsByGroup.set(groupId, []);
			}
			lowPolygonsByGroup.get(groupId)?.push(...features);
		}
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

	// Merge polygons for each group
	const mergeGroupPolygons = (polygons: GeoJSONFeature[]): GeoJSONFeature | null => {
		if (polygons.length === 0) return null;
		if (polygons.length === 1) return removeHoles(polygons[0]);

		try {
			// Convert all features to individual Polygons
			const individualPolygons = polygons.flatMap(explodeToPolygons);

			// Create a feature collection from all polygons
			const collection = turf.featureCollection(individualPolygons);

			// Use dissolve to merge all polygons
			const dissolved = turf.dissolve(collection);

			if (!dissolved || dissolved.features.length === 0) {
				return null;
			}

			// Get the first feature, remove holes, and simplify it
			const result = removeHoles(dissolved.features[0]);

			// Simplify the result
			return turf.simplify(result, { tolerance: 0.01, highQuality: true });
		} catch (error) {
			console.error('Error merging group polygons:', error);
			return null;
		}
	};

	// Create feature collections for high and low
	const createFeatureCollection = (
		polygonsByGroup: Map<string, GeoJSONFeature[]>
	): GeoJSONFeatureCollection => {
		const mergedFeatures: GeoJSONFeature[] = [];

		for (const [groupId, polygons] of polygonsByGroup) {
			const merged = mergeGroupPolygons(polygons);
			if (merged) {
				// Add group information to properties
				const group = split.find((row) => row.split_groups?.id === groupId)?.split_groups;
				if (group) {
					merged.properties = {
						groupId: group.id,
						groupName: group.name,
						groupColor: group.color
					};
				}
				mergedFeatures.push(merged);
			}
		}

		return turf.featureCollection(mergedFeatures) as GeoJSONFeatureCollection;
	};

	return new Response(
		JSON.stringify({
			high: createFeatureCollection(highPolygonsByGroup),
			low: createFeatureCollection(lowPolygonsByGroup)
		})
	);
}
