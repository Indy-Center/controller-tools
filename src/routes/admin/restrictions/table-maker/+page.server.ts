import { restriction } from '$lib/db/schema';
import { db } from '$lib/server/db';
import { eq, or } from 'drizzle-orm';

export async function load() {
	const restrictions = await db.select().from(restriction);
	return { restrictions };
}
