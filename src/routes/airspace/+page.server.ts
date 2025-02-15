import { db } from '$lib/server/db';
import {
	airspaceOverlayComponentsTable,
	airspaceOverlayGroupsTable,
	airspaceStaticElementComponentsTable,
	airspaceStaticElementGroupsTable,
	splitsTable
} from '$lib/db/schema';
import { eq, or } from 'drizzle-orm';

// Cache structure for different data types
interface CacheEntry<T> {
	data: T | null;
	timestamp: number;
	updating: boolean;
}

interface AirspaceCache {
	splits: CacheEntry<any[]>;
	staticElements: CacheEntry<StaticElementGroup[]>;
	overlays: CacheEntry<OverlayGroups[]>;
}

const cache: AirspaceCache = {
	splits: { data: null, timestamp: 0, updating: false },
	staticElements: { data: null, timestamp: 0, updating: false },
	overlays: { data: null, timestamp: 0, updating: false }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

type StaticElementGroup = {
	id: string;
	name: string;
	components: {
		name: string;
		color: string;
		geojson: string;
	}[];
};

type OverlayGroups = {
	id: string;
	name: string;
	components: {
		name: string;
		color: string;
		geojson: string;
	};
};

async function getCachedData<T>(
	cacheEntry: CacheEntry<T>,
	fetchFn: () => Promise<T>,
	isAdmin: boolean
): Promise<T> {
	const now = Date.now();

	// Return cached data if valid and user is not admin
	if (!isAdmin && cacheEntry.data && now - cacheEntry.timestamp < CACHE_DURATION) {
		return cacheEntry.data;
	}

	// If another request is already updating the cache, wait for it
	if (cacheEntry.updating) {
		while (cacheEntry.updating) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		return cacheEntry.data!;
	}

	cacheEntry.updating = true;

	try {
		const data = await fetchFn();

		// Only cache if user is not admin
		if (!isAdmin) {
			cacheEntry.data = data;
			cacheEntry.timestamp = now;
		}

		return data;
	} finally {
		cacheEntry.updating = false;
	}
}

export async function load({ locals }) {
	const isAdmin = locals.user?.isAdmin === true;

	const [splits, staticElementGroups, overlayGroups] = await Promise.all([
		getCachedData(
			cache.splits,
			() =>
				db
					.select()
					.from(splitsTable)
					.where(isAdmin ? undefined : eq(splitsTable.isPublished, true)),
			isAdmin
		),
		getCachedData(cache.staticElements, () => loadStaticElementGroups(locals), isAdmin),
		getCachedData(cache.overlays, () => loadOverlayGroups(locals), isAdmin)
	]);

	return {
		splits,
		staticElementGroups,
		overlayGroups,
		// Add cache control headers through page options
		headers: {
			'Cache-Control': isAdmin ? 'no-cache' : 'public, max-age=300',
			ETag: `"${Math.max(
				cache.splits.timestamp,
				cache.staticElements.timestamp,
				cache.overlays.timestamp
			)}"`
		}
	};
}

async function loadStaticElementGroups(locals: App.Locals): Promise<StaticElementGroup[]> {
	const staticElementsResults = await db
		.select()
		.from(airspaceStaticElementGroupsTable)
		.leftJoin(
			airspaceStaticElementComponentsTable,
			eq(airspaceStaticElementGroupsTable.id, airspaceStaticElementComponentsTable.groupId)
		)
		.where(
			or(
				eq(airspaceStaticElementGroupsTable.isPublished, true),
				locals.user && locals.user?.isAdmin === true
			)
		);

	// Group results by static element groups and their components
	return Object.values(
		staticElementsResults.reduce((acc: Record<string, any>, row) => {
			const group = row.airspace_static_element_groups;

			if (!acc[group.id]) {
				acc[group.id] = {
					...group,
					components: []
				};
			}

			if (row.airspace_static_element_components) {
				acc[group.id].components.push(row.airspace_static_element_components);
			}

			return acc;
		}, {})
	);
}

async function loadOverlayGroups(locals: App.Locals): Promise<OverlayGroups[]> {
	const overlayGroupsResult = await db
		.select()
		.from(airspaceOverlayGroupsTable)
		.leftJoin(
			airspaceOverlayComponentsTable,
			eq(airspaceOverlayGroupsTable.id, airspaceOverlayComponentsTable.groupId)
		)
		.where(
			or(
				eq(airspaceOverlayGroupsTable.isPublished, true),
				locals.user && locals.user?.isAdmin === true
			)
		);

	// Group results by overlay groups and their components
	return Object.values(
		overlayGroupsResult.reduce((acc: Record<string, any>, row) => {
			const group = row.airspace_overlay_groups;

			if (!acc[group.id]) {
				acc[group.id] = {
					...group,
					components: []
				};
			}

			if (row.airspace_overlay_components) {
				acc[group.id].components.push(row.airspace_overlay_components);
			}

			return acc;
		}, {})
	);
}
