const BASE_URL = 'https://api.zidartcc.org';

export async function fetchOnlineControllers() {
	try {
		const response: ControllersResponse = await fetch(`${BASE_URL}/v1/stats/online`).then((res) =>
			res.json()
		);

		return response;
	} catch (e) {
		console.error(e);
		return [];
	}
}

export type ControllersResponse = {
	cid: string;
	controller: {
		first_name: string;
		last_name: string;
		operating_initials: string;
	};
	position: string;
	frequency: string;
	online_since: string;
}[];
