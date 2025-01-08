import { db } from '$lib/server/db';
import { restriction, areaMetadata } from '$lib/db/schema';
import { json } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export async function GET() {
	const fromAreaMetadata = alias(areaMetadata, 'from');
	const toAreaMetadata = alias(areaMetadata, 'to');

	const restrictions = await db
		.select({
			airport: restriction.airport,
			route: restriction.route,
			from: fromAreaMetadata,
			to: toAreaMetadata,
			restriction: restriction.restriction,
			notes: restriction.notes,
			priority: restriction.priority,
			validAt: restriction.validAt,
			validUntil: restriction.validUntil,
			createdAt: restriction.createdAt
		})
		.from(restriction)
		.innerJoin(fromAreaMetadata, eq(restriction.from, fromAreaMetadata.id))
		.innerJoin(toAreaMetadata, eq(restriction.to, toAreaMetadata.id))
		.orderBy(asc(restriction.airport), desc(restriction.priority));
	return json(restrictions);
}
