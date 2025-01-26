import { db } from '$lib/server/db';
import {
	splitsTable,
	splitGroupsTable,
	splitGroupAreasTable,
	areaMetadataTable
} from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
	const split = await db
		.select()
		.from(splitsTable)
		.where(eq(splitsTable.id, params.id))
		.leftJoin(splitGroupsTable, eq(splitGroupsTable.splitId, splitsTable.id))
		.leftJoin(splitGroupAreasTable, eq(splitGroupAreasTable.groupId, splitGroupsTable.id))
		.leftJoin(areaMetadataTable, eq(areaMetadataTable.id, splitGroupAreasTable.areaId))
		.then((rows) => {
			if (rows.length === 0) {
				return null;
			}

			// Initialize the split with the first row
			const result = {
				...rows[0].splits,
				groups: []
			};

			// Process all rows to build groups and areas
			for (const row of rows) {
				if (row.split_groups) {
					// Find or create group
					let group = result.groups.find((g) => g.id === row.split_groups.id);
					if (!group) {
						group = {
							...row.split_groups,
							areas: []
						};
						result.groups.push(group);
					}

					// Add area if it exists
					if (row.area_metadata) {
						if (!group.areas.some((a) => a.id === row.area_metadata.id)) {
							group.areas.push(row.area_metadata);
						}
					}
				}
			}

			return result;
		});

	if (!split) {
		return new Response('Split not found', { status: 404 });
	}

	return new Response(JSON.stringify(split));
}
