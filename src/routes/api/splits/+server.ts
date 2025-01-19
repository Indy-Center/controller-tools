import { db } from '$lib/server/db';
import { splits } from '$lib/db/schema';
import { json } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';

export async function GET() {
	const allSplits = await db.select().from(splits).orderBy(desc(splits.createdAt));

	// Transform the results to add a special flag for Combined
	const transformedSplits = allSplits.map((split) => ({
		...split,
		isSpecial: split.name === 'Combined'
	}));

	// Sort to ensure Combined is first, then by creation date
	const sortedSplits = transformedSplits.sort((a, b) => {
		if (a.isSpecial) return -1;
		if (b.isSpecial) return 1;
		return b.createdAt.getTime() - a.createdAt.getTime();
	});

	return json(sortedSplits);
}
