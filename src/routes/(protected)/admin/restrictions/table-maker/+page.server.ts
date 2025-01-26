import { restrictionsTable } from '$lib/db/schema';
import { db } from '$lib/server/db';
import { eq, or } from 'drizzle-orm';

export async function load() {
	const restrictions = await db.select().from(restrictionsTable);
	return { restrictions };
}
