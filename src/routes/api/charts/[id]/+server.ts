import { json } from '@sveltejs/kit';

export async function GET({ params }) {
	const charts = await fetch(
		`https://api.aviationapi.com/v1/charts?apt=${params.id.toUpperCase()}`
	).then((res) => res.json());

	// Return the chart data. The key doesn't matter since we're only fetching one airport.
	// We'll merge all the results together into a single array.
	return json(Object.values(charts).flat());
}
