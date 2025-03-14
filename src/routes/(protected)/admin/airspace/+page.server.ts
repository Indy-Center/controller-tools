import {
	airspaceStaticElementGroupsTable,
	airspaceStaticElementComponentsTable,
	airspaceOverlayGroupsTable,
	airspaceOverlayComponentsTable
} from '$lib/db/schema';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { object, optional, string, nonempty, any, array, number, boolean } from 'superstruct';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { superstruct } from 'sveltekit-superforms/adapters';

const staticElementComponentSchema = object({
	id: optional(string()),
	groupId: optional(string()),
	name: nonempty(string()),
	color: nonempty(string()),
	geojson: any(),
	settings: object({
		weight: optional(number()),
		opacity: optional(number()),
		lineCap: optional(string()),
		lineJoin: optional(string()),
		radius: optional(number()),
		fillOpacity: optional(number())
	})
});

const staticElementGroupSchema = object({
	id: optional(string()),
	name: nonempty(string()),
	icon: nonempty(string()),
	components: array(staticElementComponentSchema),
	isPublished: optional(boolean())
});

const overlayComponentSchema = object({
	id: optional(string()),
	groupId: optional(string()),
	name: nonempty(string()),
	color: nonempty(string()),
	geojson: any(),
	settings: object({
		weight: optional(number()),
		opacity: optional(number()),
		lineCap: optional(string()),
		lineJoin: optional(string()),
		radius: optional(number()),
		fillOpacity: optional(number())
	})
});

const overlayGroupSchema = object({
	id: optional(string()),
	name: nonempty(string()),
	components: array(overlayComponentSchema),
	isPublished: optional(boolean())
});

const staticDefaults = {
	id: '',
	name: '',
	icon: '',
	components: [],
	isPublished: false
};

const overlayDefaults = {
	id: '',
	name: '',
	components: [],
	isPublished: false
};

const defaultSettings = {
	weight: 1,
	opacity: 0.8,
	lineCap: 'round',
	lineJoin: 'round',
	radius: 2,
	fillOpacity: 0.8
};

export async function load() {
	const staticForm = await superValidate(
		superstruct(staticElementGroupSchema, { defaults: staticDefaults }),
		{
			id: 'static'
		}
	);
	const overlayForm = await superValidate(
		superstruct(overlayGroupSchema, { defaults: overlayDefaults }),
		{
			id: 'overlay'
		}
	);

	const staticResults = await db
		.select()
		.from(airspaceStaticElementGroupsTable)
		.leftJoin(
			airspaceStaticElementComponentsTable,
			eq(airspaceStaticElementGroupsTable.id, airspaceStaticElementComponentsTable.groupId)
		)
		.orderBy(airspaceStaticElementGroupsTable.createdAt);

	const overlayResults = await db
		.select()
		.from(airspaceOverlayGroupsTable)
		.leftJoin(
			airspaceOverlayComponentsTable,
			eq(airspaceOverlayGroupsTable.id, airspaceOverlayComponentsTable.groupId)
		)
		.orderBy(airspaceOverlayGroupsTable.createdAt);

	// Group results by static element groups and their components
	const staticElements = Object.values(
		staticResults.reduce((acc: Record<string, any>, row) => {
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

	// Group results by overlay groups and their components
	const overlayGroups = Object.values(
		overlayResults.reduce((acc: Record<string, any>, row) => {
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

	return { staticElements, overlayGroups, staticForm, overlayForm };
}

export const actions = {
	deleteStatic: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return { success: false, error: 'No ID provided for deletion.' };
		}

		await db
			.delete(airspaceStaticElementGroupsTable)
			.where(eq(airspaceStaticElementGroupsTable.id, id));
		return { success: true };
	},

	deleteOverlay: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return { success: false, error: 'No ID provided for deletion.' };
		}

		await db.delete(airspaceOverlayGroupsTable).where(eq(airspaceOverlayGroupsTable.id, id));
		return { success: true };
	},

	togglePublishStatic: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const publish = formData.get('publish') === 'true';

		if (!id) {
			return fail(400, { error: 'Static Element Group ID is required' });
		}

		try {
			await db
				.update(airspaceStaticElementGroupsTable)
				.set({ isPublished: publish })
				.where(eq(airspaceStaticElementGroupsTable.id, id));

			return { success: true };
		} catch (e) {
			console.error('Error updating static element group publish status:', e);
			return fail(500, { error: 'Failed to update static element group publish status' });
		}
	},

	togglePublishOverlay: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const publish = formData.get('publish') === 'true';

		if (!id) {
			return fail(400, { error: 'Overlay Group ID is required' });
		}

		try {
			await db
				.update(airspaceOverlayGroupsTable)
				.set({ isPublished: publish })
				.where(eq(airspaceOverlayGroupsTable.id, id));

			return { success: true };
		} catch (e) {
			console.error('Error updating overlay group publish status:', e);
			return fail(500, { error: 'Failed to update overlay group publish status' });
		}
	},

	addUpdateStaticElements: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(
			formData,
			superstruct(staticElementGroupSchema, { defaults: staticDefaults })
		);

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			if (form.data.id) {
				// Update
				await db.transaction(async (tx) => {
					// Update Group Information
					await tx
						.update(airspaceStaticElementGroupsTable)
						.set({
							name: form.data.name,
							icon: form.data.icon,
							isPublished: form.data.isPublished
						})
						.where(eq(airspaceStaticElementGroupsTable.id, form.data.id!));
					// Delete all components and re-add them instead of trying to merge
					await tx
						.delete(airspaceStaticElementComponentsTable)
						.where(eq(airspaceStaticElementComponentsTable.groupId, form.data.id!));

					for (const component of form.data.components) {
						await tx.insert(airspaceStaticElementComponentsTable).values({
							...component,
							groupId: form.data.id!
						});
					}
				});
				return message(form, 'Static Element updated successfully!');
			} else {
				// Insert
				await db.transaction(async (tx) => {
					// Update Group Information
					const [group] = await tx
						.insert(airspaceStaticElementGroupsTable)
						.values({
							name: form.data.name,
							icon: form.data.icon,
							isPublished: form.data.isPublished
						})
						.returning();

					for (const component of form.data.components) {
						await tx.insert(airspaceStaticElementComponentsTable).values({
							...component,
							groupId: group.id
						});
					}
				});
				return message(form, 'Static Element added successfully!');
			}
		} catch (err) {
			console.error(err);
			return fail(500, { form, error: 'Failed to add Static Element Group.' });
		}
	},

	addUpdateOverlays: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(
			formData,
			superstruct(overlayGroupSchema, { defaults: overlayDefaults })
		);

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			if (form.data.id) {
				// Update
				await db.transaction(async (tx) => {
					// Update Group Information
					await tx
						.update(airspaceOverlayGroupsTable)
						.set({
							name: form.data.name,
							isPublished: form.data.isPublished
						})
						.where(eq(airspaceOverlayGroupsTable.id, form.data.id!));
					// Delete all components and re-add them instead of trying to merge
					await tx
						.delete(airspaceOverlayComponentsTable)
						.where(eq(airspaceOverlayComponentsTable.groupId, form.data.id!));

					for (const component of form.data.components) {
						await tx.insert(airspaceOverlayComponentsTable).values({
							...component,
							groupId: form.data.id!
						});
					}
				});
				return message(form, 'Overlay updated successfully!');
			} else {
				// Insert
				await db.transaction(async (tx) => {
					// Update Group Information
					const [group] = await tx
						.insert(airspaceOverlayGroupsTable)
						.values({
							name: form.data.name,
							isPublished: form.data.isPublished
						})
						.returning();

					for (const component of form.data.components) {
						await tx.insert(airspaceOverlayComponentsTable).values({
							...component,
							groupId: group.id
						});
					}
				});
				return message(form, 'Overlay added successfully!');
			}
		} catch (err) {
			console.error(err);
			return fail(500, { form, error: 'Failed to add Overlay Group.' });
		}
	}
};
