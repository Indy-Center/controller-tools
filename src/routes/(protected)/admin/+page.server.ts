import { db } from '$lib/server/db';
import { areaMetadataTable, authUserTable, restrictionsTable } from '$lib/db/schema';
import { count } from 'drizzle-orm';

export async function load() {
	const [[authUserCount], [areaMetadataCount], [restrictionsCount]] = await Promise.all([
		db.select({ count: count(authUserTable.cid) }).from(authUserTable),
		db.select({ count: count(areaMetadataTable.id) }).from(areaMetadataTable),
		db.select({ count: count(restrictionsTable.id) }).from(restrictionsTable)
	]);

	return {
		counts: {
			users: authUserCount.count,
			areas: areaMetadataCount.count,
			restrictions: restrictionsCount.count
		}
	};
}
