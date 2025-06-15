const BASE_URL = 'https://api.flyindycenter.com';
const ARTCC = 'ZID';

export async function fetchAirports() {
	try {
		const response: AirportsResponse = await fetch(`${BASE_URL}/v1/airports/${ARTCC}`).then((res) =>
			res.json()
		);

		return response;
	} catch (e) {
		return [];
	}
}

export async function fetchAirport(id: string) {
	try {
		const response: AirportResponse = await fetch(`${BASE_URL}/v1/airports/${ARTCC}/${id}`).then(
			(res) => res.json()
		);

		return response;
	} catch (e) {
		console.error(e);
		return null;
	}
}

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
