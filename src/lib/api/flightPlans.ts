type Coordinates = { latitude: number; longitude: number };

// Airports don't move, so coordinates are cached for the life of the process.
const airportCoordinates = new Map<string, Coordinates>();

async function fetchAirportCoordinates(icaos: string[]): Promise<Map<string, Coordinates>> {
	const missing = icaos.filter((icao) => !airportCoordinates.has(icao));

	if (missing.length) {
		try {
			const res = await fetch(
				`https://aviationweather.gov/api/data/airport?ids=${missing.join(',')}&format=json`
			);
			if (!res.ok) throw new Error(`aviationweather.gov answered ${res.status}`);

			const airports: { icaoId: string; lat: number; lon: number }[] = await res.json();
			for (const airport of airports) {
				airportCoordinates.set(airport.icaoId, { latitude: airport.lat, longitude: airport.lon });
			}
		} catch (e) {
			// Connected pilots at these airports are skipped until a later call succeeds; prefiles still show.
			console.error(`Could not fetch coordinates for ${missing.join(',')}:`, e);
		}
	}

	return airportCoordinates;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 3959; // Earth's radius in miles
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

// Flight plans departing from any of the given airports that haven't left yet.
export async function fetchPendingFlightPlans(departureIcaos: string[]): Promise<FlightPlan[]> {
	if (!departureIcaos.length) {
		return [];
	}

	const [coordinates, vatsimData] = await Promise.all([
		fetchAirportCoordinates(departureIcaos),
		fetchVatsimData()
	]);

	const departures = vatsimData.pilots.filter((p): p is VatsimPilot & FlightPlan => {
		if (!p.flight_plan || !departureIcaos.includes(p.flight_plan.departure)) {
			return false;
		}

		const departureAirport = coordinates.get(p.flight_plan.departure);
		if (!departureAirport) {
			return false;
		}

		const distanceFromDeparture = calculateDistance(
			p.latitude,
			p.longitude,
			departureAirport.latitude,
			departureAirport.longitude
		);

		return distanceFromDeparture <= 3 && p.groundspeed < 50;
	});

	const prefiles = vatsimData.prefiles.filter((p) => {
		return p.flight_plan && departureIcaos.includes(p.flight_plan.departure);
	});

	// Flight plans can either be from connected pilots or prefiles. For connected pilots, we remove any with
	// a ground speed greater than 50.
	// TODO: Could improve this logic in the future.
	return [...departures, ...prefiles];
}

async function fetchVatsimData(): Promise<VatsimData> {
	const res = await fetch('https://data.vatsim.net/v3/vatsim-data.json');
	if (!res.ok) throw new Error(`data.vatsim.net answered ${res.status}`);
	return res.json();
}

export type VatsimData = {
	pilots: VatsimPilot[];
	prefiles: VatsimPrefile[];
};

export type VatsimPilot = {
	cid: number;
	name: string;
	callsign: string;
	groundspeed: number;
	latitude: number;
	longitude: number;
	flight_plan?: VatsimFlightPlan;
};

export type VatsimPrefile = {
	cid: number;
	name: string;
	callsign: string;
	flight_plan: VatsimFlightPlan;
};

export type VatsimFlightPlan = {
	aircraft_faa: string;
	arrival: string;
	departure: string;
	remarks: string;
	route: string;
	altitude: string;
};

export type FlightPlan = VatsimPrefile;
