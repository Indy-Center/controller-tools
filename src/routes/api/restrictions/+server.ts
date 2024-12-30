import { db } from '$lib/server/db';
import { restriction } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';

export async function GET() {
	const restrictions = await db.select().from(restriction).orderBy(restriction.airport, 'asc');

	return json(restrictions);
}
