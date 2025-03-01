const BASE_URL = 'https://api.flyindycenter.com';
const ARTCC = 'ZID';

export async function fetchOverflights() {
	try {
		const response: OverflightsResponse = await fetch(`${BASE_URL}/v1/overflight/${ARTCC}`).then(
			(res) => res.json()
		);

		return response;
	} catch (e) {
		console.error(e);
		return [];
	}
}

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
