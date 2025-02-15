const BASE_URL = 'https://api.zidartcc.org';

// Cache for 30 seconds
let controllersCache: {
	data: ControllersResponse;
	timestamp: number;
} | null = null;

export async function fetchOnlineControllers() {
	try {
		// Return cached data if it's less than 30 seconds old
		if (controllersCache && Date.now() - controllersCache.timestamp < 30000) {
			return controllersCache.data;
		}

		const response: ControllersResponse = await fetch(`${BASE_URL}/v1/stats/online`).then((res) =>
			res.json()
		);

		// Update cache
		controllersCache = {
			data: response,
			timestamp: Date.now()
		};

		return response;
	} catch (e) {
		console.error(e);
		// Return cached data on error if available
		return controllersCache?.data || [];
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
