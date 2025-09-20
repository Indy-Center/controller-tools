const BASE_URL = 'https://api.flyindycenter.com';

// Cache for 30 seconds
let controllersCache: {
	data: ControllersResponse;
	timestamp: number;
} | null = null;

export async function fetchOnlineControllers() {
	return [];
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
