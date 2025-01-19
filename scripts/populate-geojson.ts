import pkg from 'pg';
const { Client } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { areaMetadata } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

const highSectors = [
	'APE 87',
	'BKW 86',
	'CRW 85',
	'DAY 88',
	'FLM 83',
	'LOU 82',
	'MAD 66',
	'PXV 81',
	'RBL 84',
	'RSH 75',
	'UNI 77'
];

const lowSectors = [
	'ABB 18',
	'AZQ 25',
	'CMH 30',
	'CVG 22',
	'EVV 17',
	'EWO 19',
	'HUF 35',
	'LEX 20',
	'LOZ 21',
	'LTL 31',
	'MIE 33',
	'PIK 69',
	'PKB 24',
	'RIV 26',
	'ROD 32',
	'SHB 34'
];

async function main() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL
	});

	await client.connect();
	const db = drizzle(client);

	// Get all areas
	const areas = await db.select().from(areaMetadata);

	for (const area of areas) {
		try {
			// Determine if high or low
			const tag = highSectors.includes(area.id)
				? 'high'
				: lowSectors.includes(area.id)
					? 'low'
					: null;

			// Read GeoJSON file
			const filePath = join(
				process.cwd(),
				'static',
				'data',
				'sectors',
				tag || '',
				`${area.id}.geojson`
			);
			const geojsonData = JSON.parse(readFileSync(filePath, 'utf-8'));

			// Update database
			await db
				.update(areaMetadata)
				.set({
					tag,
					geojson: geojsonData
				})
				.where(eq(areaMetadata.id, area.id));

			console.log(`Updated ${area.id} successfully`);
		} catch (error) {
			console.error(`Failed to update ${area.id}:`, error);
		}
	}

	await client.end();
}

main().catch(console.error);
