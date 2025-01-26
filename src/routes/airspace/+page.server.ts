import { db } from '$lib/server/db';
import { splitsTable } from '$lib/db/schema';
import { eq, or } from 'drizzle-orm';

export async function load({ locals }) {
	const splits = await db
		.select()
		.from(splitsTable)
		.where(or(eq(splitsTable.isPublished, true), locals.user && locals.user.isAdmin));

	return { splits };
}
