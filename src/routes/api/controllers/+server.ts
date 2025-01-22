import { json } from '@sveltejs/kit';
import { fetchOnlineControllers } from '$lib/api';

export async function GET() {
	const controllers = await fetchOnlineControllers();

	return json({
		controllers
	});
}
