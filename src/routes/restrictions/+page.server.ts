import { db } from '$lib/server/db';
import {
	splitsTable,
	splitGroupsTable,
	splitGroupAreasTable,
	restrictionsTable,
	areaMetadataTable
} from '$lib/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

// Cache for combined data
const dataCache = {
	data: null as any | null,
	timestamp: 0,
	updating: false
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function load({ locals }) {
	const now = Date.now();

	// Return cached data if valid
	if (dataCache.data && now - dataCache.timestamp < CACHE_DURATION) {
		return dataCache.data;
	}

	// If another request is already updating the cache, wait for it
	if (dataCache.updating) {
		while (dataCache.updating) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		return dataCache.data;
	}

	dataCache.updating = true;

	try {
		// Fetch restrictions directly from the database
		const fromAreaMetadata = alias(areaMetadataTable, 'from');
		const toAreaMetadata = alias(areaMetadataTable, 'to');

		const [restrictionsData, splitsData] = await Promise.all([
			db
				.select({
					airport: restrictionsTable.airport,
					route: restrictionsTable.route,
					from: fromAreaMetadata,
					to: toAreaMetadata,
					restriction: restrictionsTable.restriction,
					notes: restrictionsTable.notes,
					priority: restrictionsTable.priority,
					validAt: restrictionsTable.validAt,
					createdAt: restrictionsTable.createdAt
				})
				.from(restrictionsTable)
				.innerJoin(fromAreaMetadata, eq(restrictionsTable.from, fromAreaMetadata.id))
				.innerJoin(toAreaMetadata, eq(restrictionsTable.to, toAreaMetadata.id))
				.orderBy(asc(restrictionsTable.airport), desc(restrictionsTable.priority)),
			db
				.select({
					id: splitsTable.id,
					name: splitsTable.name,
					isDefault: splitsTable.isDefault,
					isPublished: splitsTable.isPublished,
					groupId: splitGroupsTable.id,
					groupName: splitGroupsTable.name,
					groupColor: splitGroupsTable.color,
					areaId: splitGroupAreasTable.areaId
				})
				.from(splitsTable)
				.where(locals.user?.isAdmin ? undefined : eq(splitsTable.isPublished, true))
				.leftJoin(splitGroupsTable, eq(splitGroupsTable.splitId, splitsTable.id))
				.leftJoin(splitGroupAreasTable, eq(splitGroupAreasTable.groupId, splitGroupsTable.id))
		]);

		// Transform the splits data into a simpler structure
		const splits = splitsData.reduce(
			(acc, row) => {
				if (!row.id || !row.name) return acc;

				let split = acc.find((s) => s.split.id === row.id);
				if (!split) {
					split = {
						split: {
							id: row.id,
							name: row.name,
							isDefault: row.isDefault ?? false,
							isPublished: row.isPublished ?? false
						},
						groups: []
					};
					acc.push(split);
				}

				if (
					row.groupId &&
					row.groupColor &&
					row.groupName &&
					!split.groups.some((g) => g.group.id === row.groupId)
				) {
					split.groups.push({
						group: {
							id: row.groupId,
							name: row.groupName,
							color: row.groupColor
						},
						areas: []
					});
				}

				if (row.areaId) {
					const group = split.groups.find((g) => g.group.id === row.groupId);
					if (group && !group.areas.includes(row.areaId)) {
						group.areas.push(row.areaId);
					}
				}

				return acc;
			},
			[] as {
				split: {
					id: string;
					name: string;
					isDefault: boolean;
					isPublished: boolean;
				};
				groups: {
					group: {
						id: string;
						name: string;
						color: string;
					};
					areas: string[];
				}[];
			}[]
		);

		const result = {
			restrictions: restrictionsData,
			splits
		};

		// Update cache
		dataCache.data = result;
		dataCache.timestamp = now;

		return result;
	} finally {
		dataCache.updating = false;
	}
}
