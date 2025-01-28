import { db } from '$lib/server/db';
import {
	splitsTable,
	splitGroupsTable,
	splitGroupAreasTable,
	areaMetadataTable,
	type Split,
	type SplitGroup,
	type AreaMetadata
} from '$lib/db/schema';
import { eq, isNotNull } from 'drizzle-orm';

type SplitResponse = Split & {
	groups: (SplitGroup & {
		areas: AreaMetadata[];
		frequency?: string;
	})[];
};

export async function GET({ params }): Promise<Response> {
	// First, get all frequencies mapped by area short name
	const frequencies = await db
		.select({
			short: areaMetadataTable.short,
			frequency: areaMetadataTable.frequency
		})
		.from(areaMetadataTable)
		.where(isNotNull(areaMetadataTable.frequency));

	const frequencyMap = new Map(
		frequencies
			.filter((f): f is { short: string; frequency: string } => f.frequency !== null)
			.map((f) => [f.short, f.frequency])
	);

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
			const result: SplitResponse = {
				...rows[0].splits,
				groups: []
			};

			// Process all rows to build groups and areas
			for (const row of rows) {
				if (row.split_groups) {
					// Find or create group
					let group = result.groups.find((g) => g.id === row.split_groups!.id);
					if (!group) {
						const newGroup = {
							...row.split_groups,
							areas: [] as AreaMetadata[],
							frequency: frequencyMap.get(row.split_groups.name)
						};
						result.groups.push(newGroup);
						group = newGroup;
					}

					// Add area if it exists
					if (row.area_metadata) {
						const area = row.area_metadata;
						if (!group.areas.some((a) => a.id === area.id)) {
							group.areas.push(area);
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
