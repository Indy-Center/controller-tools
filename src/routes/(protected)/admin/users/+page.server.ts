import { db } from '$lib/server/db';
import { authUserTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const config = {
	cache: 'no-store'
};

export async function load() {
	const users = await db.select().from(authUserTable);
	return { users };
}

export const actions = {
	promote: async ({ request }) => {
		const formData = await request.formData();
		const cid = formData.get('cid') as string;

		if (!cid) {
			return { success: false, error: 'No CID provided' };
		}

		await db.update(authUserTable).set({ isAdmin: true }).where(eq(authUserTable.cid, cid));
		return { success: true };
	},
	demote: async ({ request }) => {
		const formData = await request.formData();
		const cid = formData.get('cid') as string;

		if (!cid) {
			return { success: false, error: 'No CID provided' };
		}

		await db.update(authUserTable).set({ isAdmin: false }).where(eq(authUserTable.cid, cid));
		return { success: true };
	}
};
