import { db } from '$lib/server/db';
import { areaMetadataTable, type RestrictionInsertModel, restrictionsTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { superstruct } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { object, string, nonempty, optional } from 'superstruct';

const restrictionSchema = object({
	id: optional(string()),
	airport: nonempty(string()),
	route: optional(string()),
	to: nonempty(string()),
	from: nonempty(string()),
	restriction: optional(string()),
	notes: optional(string()),
	priority: optional(string()),
	validAt: optional(string())
});

const defaults = {
	id: undefined,
	airport: '',
	to: '',
	from: '',
	route: undefined,
	restriction: undefined,
	notes: undefined,
	priority: undefined,
	validAt: undefined
};

export async function load() {
	const form = await superValidate(superstruct(restrictionSchema, { defaults }));
	const restrictions = await db.select().from(restrictionsTable);
	const areas = await db.select().from(areaMetadataTable);

	return { restrictions, areas, form };
}

export const actions = {
	upsert: async ({ request }) => {
		const form = await superValidate(request, superstruct(restrictionSchema, { defaults }));

		if (!form.valid) {
			// Again, return { form } and things will just work.
			return fail(400, { form });
		}

		const data: RestrictionInsertModel = {
			airport: form.data.airport,
			route: form.data.route,
			from: form.data.from,
			to: form.data.to,
			restriction: form.data.restriction,
			notes: form.data.notes,
			priority: form.data.priority?.toString(),
			validAt: form.data.validAt ? new Date(form.data.validAt) : null
		};

		try {
			if (form.data.id) {
				await db.update(restrictionsTable).set(data).where(eq(restrictionsTable.id, form.data.id!));
			} else {
				await db.insert(restrictionsTable).values(data);
			}
		} catch (e) {
			return fail(400, { form });
		}

		// Display a success status message
		return message(form, 'Form posted successfully!');
	},
	// Delete an area
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return { success: false, error: 'No ID provided for deletion.' };
		}

		await db.delete(restrictionsTable).where(eq(restrictionsTable.id, id));
		return { success: true };
	}
};
