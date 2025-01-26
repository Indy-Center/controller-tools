import { db } from '$lib/server/db';
import { restrictionsTable, areaMetadataTable } from '$lib/db/schema';
import { json } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export async function GET() {
	const fromAreaMetadata = alias(areaMetadataTable, 'from');
	const toAreaMetadata = alias(areaMetadataTable, 'to');

	const restrictions = await db
		.select({
			airport: restrictionsTable.airport,
			route: restrictionsTable.route,
			from: fromAreaMetadata,
			to: toAreaMetadata,
			restriction: restrictionsTable.restriction,
			notes: restrictionsTable.notes,
			priority: restrictionsTable.priority,
			validAt: restrictionsTable.validAt,
			validUntil: restrictionsTable.validUntil,
			createdAt: restrictionsTable.createdAt
		})
		.from(restrictionsTable)
		.innerJoin(fromAreaMetadata, eq(restrictionsTable.from, fromAreaMetadata.id))
		.innerJoin(toAreaMetadata, eq(restrictionsTable.to, toAreaMetadata.id))
		.orderBy(asc(restrictionsTable.airport), desc(restrictionsTable.priority));
	return json(restrictions);
}
