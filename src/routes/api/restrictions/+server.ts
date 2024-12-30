import { db } from '$lib/server/db';
import { restriction } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';

export async function GET() {
	const restrictions = await db
		.select()
		.from(restriction)
		// .where(eq(restriction.airport, 'AGC'))
		.orderBy(asc(restriction.airport), desc(restriction.priority));

	return json(restrictions);
}
