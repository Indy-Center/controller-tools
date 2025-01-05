const BASE_URL = 'https://api.zidartcc.org';
const ARTCC = 'ZID';

export async function fetchAirports() {
	const response: AirportsResponse = await fetch(`${BASE_URL}/v1/airports/${ARTCC}`).then((res) =>
		res.json()
	);

	return response;
}

export async function fetchAirport(id: string) {
	const response: AirportResponse = await fetch(`${BASE_URL}/v1/airports/${ARTCC}/${id}`).then(
		(res) => res.json()
	);

	return response;
}

export async function fetchOnlineControllers() {
	const response: ControllersResponse = await fetch(`${BASE_URL}/v1/stats/online`).then((res) =>
		res.json()
	);

	return response;
}

export async function fetchOverflights() {
	const response: OverflightsResponse = await fetch(`${BASE_URL}/v1/overflight/${ARTCC}`).then(
		(res) => res.json()
	);

	return response;
}

export type ControllersResponse = {
	cid: string;
	controller: {
		first_name: string;
		last_name: string;
		operating_initials: string;
	};
	position: string;
	online_since: string;
}[];

export type AirportsResponse = {
	arpt_id: string;
	icao_id: string;
	state_code: string;
	city: string;
	arpt_name: string;
	resp_artcc_id: string;
	arpt_status: string;
	twr_type_code: string;
	elevation: number;
	latitude: number;
	longitude: number;
}[];

export type AirportResponse = {
	arpt_id: string;
	icao_id: string;
	state_code: string;
	city: string;
	arpt_name: string;
	resp_artcc_id: string;
	arpt_status: string;
	twr_type_code: string;
	elevation: number;
	latitude: number;
	longitude: number;
	metar: string;
	taf: string;
};

export type OverflightsResponse = {
	callsign: string;
	cid: string;
	facility: string;
	lat: number;
	lon: number;
	dep: string;
	arr: string;
	hdg: number;
	route: string;
}[];
