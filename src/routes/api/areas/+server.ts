import { db } from '$lib/server/db';
import { areaMetadataTable } from '$lib/db/schema';
import { json } from '@sveltejs/kit';

export async function GET() {
	const areas = await db.select().from(areaMetadataTable);
	return json(areas);
}
