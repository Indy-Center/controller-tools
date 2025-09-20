import { aircraftTable, airlinesTable } from '$lib/db/schema';
import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { ilike } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Cache structure
const cache = new Map<
	string,
	{
		data: {
			airports: AirportResponse;
			navaids: NavaidResponse;
		};
		timestamp: number;
	}
>();

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache duration

type NavaidResponse = {
	ind: number;
	id: string;
	type: string;
	name: string;
	state: string;
	country: string;
	lat: number;
	lon: number;
	elev: number;
	freq: number;
	mag_dec: string;
}[];

type AirportResponse = {
	id: string;
	icaoId: string;
	iataId: string;
	faaId: string;
	name: string;
	state: string;
	country: string;
	lat: number;
	lon: number;
	elev: number;
	magdec: string;
	type: string;
	runways: {
		id: string;
		dimension: string;
		surface: string;
		alignment: number;
	}[];
	services: string;
	tower: string;
	beacon: string;
	passengers: string;
	freqs: string;
}[];

function getCacheKey(search: string): string {
	return `search:${search.toUpperCase()}`;
}

function getFromCache(key: string) {
	const cached = cache.get(key);
	if (!cached) return null;

	// Check if cache is expired
	if (Date.now() - cached.timestamp > CACHE_DURATION) {
		cache.delete(key);
		return null;
	}

	return cached.data;
}

export const GET: RequestHandler = async ({ url }) => {
	const search = url.searchParams.get('search')?.toUpperCase();

	if (!search || search.length < 3) {
		return json({ airports: [], navaids: [] });
	}

	// Check cache first
	const cacheKey = getCacheKey(search);
	const cachedData = getFromCache(cacheKey);
	if (cachedData) {
		return json(cachedData);
	}

	try {
		// Create search terms for both with and without 'K' prefix
		const searchWithK = search.startsWith('K') ? search : `K${search}`;
		const searchWithoutK = search.startsWith('K') ? search.slice(1) : search;

		const [airportsResponse1, airportsResponse2, navaidsExactResponse] =
			await searchAirportsAndNavaids(search);

		// Combine and deduplicate airport results
		const allAirports = [
			...(Array.isArray(airportsResponse1) ? airportsResponse1 : []),
			...(Array.isArray(airportsResponse2) ? airportsResponse2 : [])
		];

		// Filter airports and remove duplicates based on icaoId
		const filteredAirports = Array.from(
			new Map(
				allAirports
					.filter(
						(airport) =>
							airport.icaoId?.includes(searchWithK) ||
							airport.icaoId?.includes(searchWithoutK) ||
							airport.iataId?.includes(searchWithoutK) ||
							airport.faaId?.includes(searchWithoutK)
					)
					.map((airport) => [airport.icaoId, airport])
			).values()
		).slice(0, 10);

		// Combine and deduplicate navaid results
		const allNavaids = [...(Array.isArray(navaidsExactResponse) ? navaidsExactResponse : [])];

		const uniqueNavaids = Array.from(
			new Map(allNavaids.map((item) => [item.id, item])).values()
		).slice(0, 10);

		const airlines = await db
			.select()
			.from(airlinesTable)
			.where(ilike(airlinesTable.code, `${search}%`));

		const aircraft = await db
			.select()
			.from(aircraftTable)
			.where(ilike(aircraftTable.code, `${search}%`));

		const result = {
			airports: filteredAirports,
			navaids: uniqueNavaids,
			airlines,
			aircraft
		};

		// Store in cache
		cache.set(cacheKey, {
			data: result,
			timestamp: Date.now()
		});

		return json(result);
	} catch (error) {
		console.error('Search API error:', error);
		console.log(JSON.stringify(error, null, 2));
		return json(
			{
				airports: [],
				navaids: [],
				error: 'Failed to fetch aviation data'
			},
			{ status: 500 }
		);
	}
};

async function searchAirportsAndNavaids(search: string) {
	const searchWithK = search.startsWith('K') ? search : `K${search}`;
	const searchWithoutK = search.startsWith('K') ? search.slice(1) : search;

	return await Promise.all([
		await searchAirports(searchWithK),
		await searchAirports(searchWithoutK),
		await searchNavaids(search)
	]);
}

async function searchNavaids(search: string) {
	try {
		return await fetch(
			`https://aviationweather.gov/api/data/navaid?ids=${search}&format=json`
		).then((res) => res.json() || []);
	} catch (error) {
		return [];
	}
}

async function searchAirports(search: string) {
	try {
		const response = await fetch(
			`https://aviationweather.gov/api/data/airport?ids=${search}&format=json`
		).then((res) => res.json() || []);
		return response;
	} catch (error) {
		return [];
	}
}
