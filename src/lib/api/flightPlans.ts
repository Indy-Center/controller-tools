import { fetchAirports } from './airports';

export async function fetchPendingFlightPlans(): Promise<FlightPlan[]> {
	const airports = await fetchAirports();
	const airportIcaos = airports.map((a) => a.icao_id);

	const vatsimData = await fetchVatsimData();

	const departures = vatsimData.pilots.filter((p: any) => {
		return p.flight_plan && airportIcaos.includes(p.flight_plan.departure) && p.groundspeed < 50;
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
