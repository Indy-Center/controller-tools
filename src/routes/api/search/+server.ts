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

		const [airportsResponse1, airportsResponse2, navaidsExactResponse] = await Promise.all([
			fetch(`https://aviationweather.gov/api/data/airport?ids=${searchWithK}&format=json`),
			fetch(`https://aviationweather.gov/api/data/airport?ids=${searchWithoutK}&format=json`),
			fetch(`https://aviationweather.gov/api/data/navaid?ids=${search}&format=json`)
		]);

		if (!airportsResponse1.ok && !airportsResponse2.ok) {
			throw new Error('Failed to fetch airport data');
		}

		const [airports1, airports2, navaidsExact] = await Promise.all([
			airportsResponse1.ok
				? (airportsResponse1.json() as Promise<AirportResponse>)
				: Promise.resolve([]),
			airportsResponse2.ok
				? (airportsResponse2.json() as Promise<AirportResponse>)
				: Promise.resolve([]),
			navaidsExactResponse.ok
				? (navaidsExactResponse.json() as Promise<NavaidResponse>)
				: Promise.resolve([])
		]);

		// Combine and deduplicate airport results
		const allAirports = [
			...(Array.isArray(airports1) ? airports1 : []),
			...(Array.isArray(airports2) ? airports2 : [])
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
		const allNavaids = [...(Array.isArray(navaidsExact) ? navaidsExact : [])];

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
