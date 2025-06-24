import { fetchAirports, type AirportsResponse } from './airports';

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

export async function fetchPendingFlightPlans(): Promise<FlightPlan[]> {
	const airports = await fetchAirports();
	const airportIcaos = airports.map((a) => a.icao_id);

	const vatsimData = await fetchVatsimData();

	const departures = vatsimData.pilots.filter((p: any) => {
		if (!p.flight_plan || !airportIcaos.includes(p.flight_plan.departure)) {
			return false;
		}

		const departureAirport = airports.find((a) => a.icao_id === p.flight_plan.departure);
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

	const prefiles = vatsimData.prefiles.filter((p: any) => {
		return p.flight_plan && airportIcaos.includes(p.flight_plan.departure);
	});

	// Flight plans can either be from connected pilots or prefiles. For connected pilots, we remove any with
	// a ground speed greater than 50.
	// TODO: Could improve this logic in the future.
	return [...departures, ...prefiles];
}

function fetchVatsimData() {
	return fetch('https://data.vatsim.net/v3/vatsim-data.json').then((r) => r.json());
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
