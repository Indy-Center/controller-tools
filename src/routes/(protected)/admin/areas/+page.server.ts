import { db } from '$lib/server/db';
import { areaMetadataTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { any, nonempty, object, string } from 'superstruct';
import { message, superValidate } from 'sveltekit-superforms';
import { superstruct } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';

const areaSchema = object({
	id: nonempty(string()),
	short: nonempty(string()),
	long: nonempty(string()),
	category: nonempty(string()),
	color: nonempty(string()),
	tag: nonempty(string()),
	geojsonFile: any() // This will be the file input
});

const defaults = {
	id: '',
	short: '',
	long: '',
	category: '',
	color: '#000000',
	tag: '',
	geojsonFile: ''
};

export async function load() {
	const areas = await db.select().from(areaMetadataTable);
	const form = await superValidate(superstruct(areaSchema, { defaults }));

	return { areas, form };
}

export const actions = {
	add: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, superstruct(areaSchema, { defaults }));

		if (!form.valid) {
			return fail(400, { form });
		}

		const geojsonFile = form.data.geojsonFile;
		let geojson = null;

		if (geojsonFile && geojsonFile.size > 0) {
			try {
				const text = await geojsonFile.text();
				geojson = JSON.parse(text);
			} catch (e) {
				form.errors.geojsonFile = ['Invalid GeoJSON file'];
				return fail(400, { form });
			}
		} else {
			form.errors.geojsonFile = ['GeoJSON file is required'];
			return fail(400, { form });
		}

		try {
			const insertData = {
				...form.data,
				geojson
			};
			await db.insert(areaMetadataTable).values(insertData);
		} catch (e) {
			return fail(400, { form });
		}

		return message(form, 'Area added successfully!');
	},
	update: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, superstruct(areaSchema, { defaults }));

		if (!form.valid) {
			return fail(400, { form });
		}

		// Handle the GeoJSON file
		const geojsonFile = form.data.geojsonFile;
		let geojson = null;

		if (geojsonFile && geojsonFile.size > 0) {
			try {
				const text = await geojsonFile.text();
				geojson = JSON.parse(text);
			} catch (e) {
				form.errors.geojsonFile = ['Invalid GeoJSON file'];
				return fail(400, { form });
			}
		}

		try {
			const updateData = {
				...form.data,
				geojson: geojson || undefined // Only update if we have new geojson
			};
			delete updateData.geojsonFile; // Remove the file field before update

			await db
				.update(areaMetadataTable)
				.set(updateData)
				.where(eq(areaMetadataTable.id, form.data.id));
		} catch (e) {
			return fail(400, { form });
		}

		return message(form, 'Area updated successfully!');
	},
	// Delete an area
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return { success: false, error: 'No ID provided for deletion.' };
		}

		await db.delete(areaMetadataTable).where(eq(areaMetadataTable.id, id));
		return { success: true };
	}
};
