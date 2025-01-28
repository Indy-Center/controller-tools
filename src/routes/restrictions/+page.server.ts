import { db } from '$lib/server/db';
import { splitsTable, splitGroupsTable, splitGroupAreasTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export async function load({ locals, fetch }) {
	const [restrictionsData, splitsData] = await Promise.all([
		fetch('/api/restrictions').then((r) => r.json()),
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

	return {
		restrictions: restrictionsData,
		splits
	};
}
