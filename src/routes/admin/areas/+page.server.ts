import { db } from '$lib/server/db';
import { areaMetadata } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { nonempty, object, string } from 'superstruct';
import { message, superValidate } from 'sveltekit-superforms';
import { superstruct } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';

const areaSchema = object({
	id: nonempty(string()),
	short: nonempty(string()),
	long: nonempty(string()),
	category: nonempty(string()),
	color: nonempty(string())
});

const defaults = {
	id: '',
	short: '',
	long: '',
	category: '',
	color: '#000000'
};

export async function load() {
	const areas = await db.select().from(areaMetadata);
	const form = await superValidate(superstruct(areaSchema, { defaults }));

	return { areas, form };
}

export const actions = {
	add: async ({ request }) => {
		const form = await superValidate(request, superstruct(areaSchema, { defaults }));
		if (!form.valid) {
			// Again, return { form } and things will just work.
			return fail(400, { form });
		}

		try {
			await db.insert(areaMetadata).values(form.data);
		} catch (e) {
			return fail(400, { form });
		}

		// Display a success status message
		return message(form, 'Form posted successfully!');
	},
	update: async ({ request }) => {
		const form = await superValidate(request, superstruct(areaSchema, { defaults }));
		if (!form.valid) {
			// Again, return { form } and things will just work.
			return fail(400, { form });
		}

		try {
			await db.update(areaMetadata).set(form.data).where(eq(areaMetadata.id, form.data.id));
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

		await db.delete(areaMetadata).where(eq(areaMetadata.id, id));
		return { success: true };
	}
};
