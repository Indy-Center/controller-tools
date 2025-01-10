import { db } from '$lib/server/db';
import { areaMetadata, authUser, restriction } from '$lib/db/schema';
import { count } from 'drizzle-orm';

export async function load() {
	const [[authUserCount], [areaMetadataCount], [restrictionsCount]] = await Promise.all([
		db.select({ count: count(authUser.cid) }).from(authUser),
		db.select({ count: count(areaMetadata.id) }).from(areaMetadata),
		db.select({ count: count(restriction.id) }).from(restriction)
	]);

	return {
		counts: {
			users: authUserCount.count,
			areas: areaMetadataCount.count,
			restrictions: restrictionsCount.count
		}
	};
}
