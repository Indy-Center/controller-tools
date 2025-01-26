import {
	splitsTable,
	areaMetadataTable,
	splitGroupAreasTable,
	splitGroupsTable
} from '$lib/db/schema';
import { db } from '$lib/server/db/index.js';
import { eq, or } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

type Split = {
	id: string;
	name: string;
	isPublished: boolean;
	isDefault: boolean;
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
		.from(splitsTable)
		.leftJoin(splitGroupsTable, eq(splitGroupsTable.splitId, splitsTable.id))
		.leftJoin(splitGroupAreasTable, eq(splitGroupAreasTable.groupId, splitGroupsTable.id));

	const areas = await db
		.select()
		.from(areaMetadataTable)
		.where(
			or(eq(areaMetadataTable.category, 'Center'), eq(areaMetadataTable.category, 'Terminal'))
		);

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
				isDefault: split.isDefault,
				isPublished: split.isPublished,
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
			await db.delete(splitGroupAreasTable).where(eq(splitGroupAreasTable.groupId, id));

			// Delete all groups
			await db.delete(splitGroupsTable).where(eq(splitGroupsTable.splitId, id));

			// Delete the split
			await db.delete(splitsTable).where(eq(splitsTable.id, id));

			return { success: true };
		} catch (e) {
			console.error('Error deleting split:', e);
			return fail(500, { error: 'Failed to delete split' });
		}
	},

	togglePublish: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const publish = formData.get('publish') === 'true';

		if (!id) {
			return fail(400, { error: 'Split ID is required' });
		}

		try {
			await db.update(splitsTable).set({ isPublished: publish }).where(eq(splitsTable.id, id));

			return { success: true };
		} catch (e) {
			console.error('Error updating split publish status:', e);
			return fail(500, { error: 'Failed to update split publish status' });
		}
	},

	makeDefault: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'Split ID is required' });
		}

		try {
			// Start a transaction to ensure atomicity
			await db.transaction(async (tx) => {
				// First, set all splits to non-default
				await tx
					.update(splitsTable)
					.set({ isDefault: false })
					.where(eq(splitsTable.isDefault, true));

				// Then set the selected split as default
				await tx.update(splitsTable).set({ isDefault: true }).where(eq(splitsTable.id, id));
			});

			return { success: true };
		} catch (e) {
			console.error('Error updating default split:', e);
			return fail(500, { error: 'Failed to update default split' });
		}
	}
};
