import { db } from '$lib/server/db';
import { authUser } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export async function load() {
	const users = await db.select().from(authUser);
	return { users };
}

export const actions = {
	promote: async ({ request }) => {
		const formData = await request.formData();
		const cid = formData.get('cid') as string;

		if (!cid) {
			return { success: false, error: 'No CID provided' };
		}

		await db.update(authUser).set({ isAdmin: true }).where(eq(authUser.cid, cid));
		return { success: true };
	},
	demote: async ({ request }) => {
		const formData = await request.formData();
		const cid = formData.get('cid') as string;

		if (!cid) {
			return { success: false, error: 'No CID provided' };
		}

		await db.update(authUser).set({ isAdmin: false }).where(eq(authUser.cid, cid));
		return { success: true };
	}
};
