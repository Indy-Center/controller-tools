import { db } from '$lib/server/db';
import { areaMetadata, splits, splitGroups, splitGroupAreas } from '$lib/db/schema';
import { message, superValidate } from 'sveltekit-superforms';
import { superstruct } from 'sveltekit-superforms/adapters';
import { fail, error, redirect } from '@sveltejs/kit';
import { object, string, array, nonempty } from 'superstruct';
import { eq, or, inArray } from 'drizzle-orm';

const splitGroupSchema = object({
	name: nonempty(string()),
	color: nonempty(string()),
	areas: array(string())
});

const splitSchema = object({
	name: nonempty(string()),
	groups: array(splitGroupSchema)
});

const defaults = {
	name: '',
	groups: []
};

export async function load({ params }) {
	// Get the split and its groups
	const [split] = await db.select().from(splits).where(eq(splits.id, params.id));

	if (!split) {
		throw error(404, 'Split not found');
	}

	// Get the groups for this split
	const groups = await db.select().from(splitGroups).where(eq(splitGroups.splitId, split.id));

	// Get the areas for each group
	const groupAreas = await db
		.select()
		.from(splitGroupAreas)
		.where(
			inArray(
				splitGroupAreas.groupId,
				groups.map((g) => g.id)
			)
		);

	// Get all available areas
	const areas = await db
		.select()
		.from(areaMetadata)
		.where(or(eq(areaMetadata.category, 'Center'), eq(areaMetadata.category, 'Terminal')));

	// Transform the data to match our form schema
	const formData = {
		name: split.name,
		groups: groups.map((group) => ({
			name: group.name,
			color: group.color,
			areas: groupAreas.filter((ga) => ga.groupId === group.id).map((ga) => ga.areaId)
		}))
	};

	const form = await superValidate(formData, superstruct(splitSchema, { defaults }));

	return { split, areas, form };
}

export const actions = {
	update: async ({ request, params }) => {
		const form = await superValidate(request, superstruct(splitSchema, { defaults }));

		if (!form.valid) {
			return fail(400, { form });
		}

		// Additional validation
		if (form.data.groups.length === 0) {
			return fail(400, {
				form,
				error: 'At least one group is required'
			});
		}

		// Validate all areas are assigned
		const allAreas = await db
			.select()
			.from(areaMetadata)
			.where(or(eq(areaMetadata.category, 'Center'), eq(areaMetadata.category, 'Terminal')));

		const assignedAreaIds = new Set(form.data.groups.flatMap((g) => g.areas));
		const unassignedAreas = allAreas.filter((area) => !assignedAreaIds.has(area.id));

		if (unassignedAreas.length > 0) {
			return fail(400, {
				form,
				error: `All areas must be assigned. Unassigned: ${unassignedAreas.map((a) => a.short).join(', ')}`
			});
		}

		try {
			// Start a transaction to ensure data consistency
			await db.transaction(async (tx) => {
				// Update the split name
				await tx.update(splits).set({ name: form.data.name }).where(eq(splits.id, params.id));

				// Delete existing groups (this will cascade delete splitGroupAreas)
				await tx.delete(splitGroups).where(eq(splitGroups.splitId, params.id));

				// Create new groups and their area relationships
				for (const group of form.data.groups) {
					const [newGroup] = await tx
						.insert(splitGroups)
						.values({
							splitId: params.id,
							name: group.name,
							color: group.color
						})
						.returning();

					// Create area relationships
					if (group.areas.length > 0) {
						await tx.insert(splitGroupAreas).values(
							group.areas.map((areaId) => ({
								groupId: newGroup.id,
								areaId
							}))
						);
					}
				}
			});
		} catch (e) {
			console.error('Error updating split:', e);
			return fail(500, { form, error: 'Failed to update split' });
		}

		return redirect(303, '/admin/splits');
	}
};
