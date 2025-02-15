import { db } from '$lib/server/db';
import { restrictionsTable, areaMetadataTable } from '$lib/db/schema';
import { json } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

// Cache for restrictions - key is timestamp, value is {data, timestamp}
const restrictionsCache = {
	data: null as any[] | null,
	timestamp: 0,
	updating: false
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
	const now = Date.now();

	// Return cached data if valid
	if (restrictionsCache.data && now - restrictionsCache.timestamp < CACHE_DURATION) {
		return json(restrictionsCache.data, {
			headers: {
				'Cache-Control': 'public, max-age=300',
				ETag: `"${restrictionsCache.timestamp}"`
			}
		});
	}

	// If another request is already updating the cache, wait for it
	if (restrictionsCache.updating) {
		while (restrictionsCache.updating) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		return json(restrictionsCache.data, {
			headers: {
				'Cache-Control': 'public, max-age=300',
				ETag: `"${restrictionsCache.timestamp}"`
			}
		});
	}

	restrictionsCache.updating = true;

	try {
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

		// Update cache
		restrictionsCache.data = restrictions;
		restrictionsCache.timestamp = now;

		return json(restrictions, {
			headers: {
				'Cache-Control': 'public, max-age=300',
				ETag: `"${now}"`
			}
		});
	} finally {
		restrictionsCache.updating = false;
	}
}
