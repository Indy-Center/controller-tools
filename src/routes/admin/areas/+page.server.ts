import { db } from '$lib/server/db';
import { areaMetadata } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export async function load() {
	const areas = await db.select().from(areaMetadata);
	return { areas };
}

export const actions = {
	// Update an area
	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const short = formData.get('short') as string;
		const long = formData.get('long') as string;
		const category = formData.get('category') as string;
		const color = formData.get('color') as string;

		if (!id) {
			return { success: false, error: 'No ID provided' };
		}

		await db
			.update(areaMetadata)
			.set({ short, long, color, category })
			.where(eq(areaMetadata.id, id));
		return { success: true };
	},

	// Add a new area
	add: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const short = formData.get('short') as string;
		const long = formData.get('long') as string;
		const category = formData.get('category') as string;
		const color = formData.get('color') as string;

		if (!short || !long || !category || !color) {
			return { success: false, error: 'All fields are required to add an area.' };
		}

		await db.insert(areaMetadata).values({ id, short, long, category, color });
		return { success: true };
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
