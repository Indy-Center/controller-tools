import { fetchAirports } from '$lib/api/airports';
import { fetchPendingFlightPlans } from '$lib/api/flightPlans';
import { evaluateFlightPlans } from '$lib/api/recommendation';
import { json } from '@sveltejs/kit';

export async function GET() {
	const flightPlans = await fetchPendingFlightPlans();
	const recommendations = await evaluateFlightPlans(flightPlans);

	return json({
		recommendations: recommendations.filter(
			(recommendation) => recommendation.status === 'needs_reroute'
		)
	});
}
