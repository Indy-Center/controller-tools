import { splits, areaMetadata, splitGroupAreas, splitGroups } from '$lib/db/schema';
import { db } from '$lib/server/db/index.js';
import { eq, or } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

type Split = {
	id: string;
	name: string;
	groups: {
		id: string;
		name: string;
		color: string;
		areas: { id: string }[];
	}[];
};

export async function load({ locals }) {
	const allSplits = await db
		.select()
		.from(splits)
		.leftJoin(splitGroups, eq(splitGroups.splitId, splits.id))
		.leftJoin(splitGroupAreas, eq(splitGroupAreas.groupId, splitGroups.id));

	const areas = await db
		.select()
		.from(areaMetadata)
		.where(or(eq(areaMetadata.category, 'Center'), eq(areaMetadata.category, 'Terminal')));

	return {
		splits: transformSplits(allSplits),
		areas
	};
}

function transformSplits(rows: any[]): Split[] {
	const splitMap = new Map<string, Split>();

	rows.forEach((row) => {
		const split = row.splits;
		const group = row.split_groups;
		const area = row.split_group_areas;

		if (!splitMap.has(split.id)) {
			splitMap.set(split.id, {
				id: split.id,
				name: split.name,
				groups: []
			});
		}

		const currentSplit = splitMap.get(split.id)!;

		let currentGroup = currentSplit.groups.find((g) => g.id === group.id);
		if (!currentGroup) {
			currentGroup = {
				id: group.id,
				name: group.name,
				color: group.color,
				areas: []
			};
			currentSplit.groups.push(currentGroup);
		}

		if (area && !currentGroup.areas.some((a) => a.id === area.id)) {
			currentGroup.areas.push({ id: area.id });
		}
	});

	return Array.from(splitMap.values());
}

export const actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'Split ID is required' });
		}

		try {
			// Delete all area relationships first
			await db.delete(splitGroupAreas).where(eq(splitGroupAreas.groupId, id));

			// Delete all groups
			await db.delete(splitGroups).where(eq(splitGroups.splitId, id));

			// Delete the split
			await db.delete(splits).where(eq(splits.id, id));

			return { success: true };
		} catch (e) {
			console.error('Error deleting split:', e);
			return fail(500, { error: 'Failed to delete split' });
		}
	}
};
