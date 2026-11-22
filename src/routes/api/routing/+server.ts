import { fetchPendingFlightPlans } from '$lib/api/flightPlans';
import { evaluateFlightPlans } from '$lib/api/recommendation';
import { adarRecordsTable } from '$lib/db/schema';
import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';

export async function GET() {
	try {
		const adar = await db.select().from(adarRecordsTable).orderBy(adarRecordsTable.order);

		// Only airports with an ADAR route can produce a recommendation.
		const departureIcaos = [
			...new Set(adar.flatMap((record) => record.departureAirports as string[]))
		];

		const flightPlans = await fetchPendingFlightPlans(departureIcaos);
		const recommendations = evaluateFlightPlans(flightPlans, adar);

		return json({
			recommendations: recommendations.filter(
				(recommendation) => recommendation.status === 'needs_reroute'
			)
		});
	} catch (e) {
		console.error('Could not build routing recommendations:', e);
		return json({ recommendations: [] }, { status: 502 });
	}
}
