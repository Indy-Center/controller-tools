import { db } from '$lib/server/db';
import { areaMetadata, splits, splitGroups, splitGroupAreas } from '$lib/db/schema';
import { message, superValidate } from 'sveltekit-superforms';
import { superstruct } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { object, string, array, nonempty } from 'superstruct';
import { or, eq } from 'drizzle-orm';

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

export async function load() {
	const form = await superValidate(superstruct(splitSchema, { defaults }));
	const areas = await db
		.select()
		.from(areaMetadata)
		.where(or(eq(areaMetadata.category, 'Center'), eq(areaMetadata.category, 'Terminal')));

	return { areas, form };
}

export const actions = {
	create: async ({ request }) => {
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
			// Create the split
			const [split] = await db
				.insert(splits)
				.values({
					name: form.data.name
				})
				.returning();

			// Create each split group
			const groups = await db
				.insert(splitGroups)
				.values(
					form.data.groups.map((g) => ({
						splitId: split.id,
						name: g.name,
						color: g.color
					}))
				)
				.returning();

			// Create each split group area record
			for (const group of form.data.groups) {
				const createdGroup = groups.find((g) => g.name === group.name);
				if (createdGroup) {
					await db.insert(splitGroupAreas).values(
						group.areas.map((a) => ({
							groupId: createdGroup.id,
							areaId: a
						}))
					);
				}
			}
		} catch (e) {
			console.error('Error creating split:', e);
			return fail(500, { form, error: 'Failed to create split' });
		}

		return redirect(303, '/admin/splits');
	}
};
