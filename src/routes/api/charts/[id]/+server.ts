import { json } from '@sveltejs/kit';

export async function GET({ params }) {
	const charts = await fetch(
		`https://api.aviationapi.com/v1/charts?apt=${params.id.toUpperCase()}`
	).then((res) => res.json());

	// Return the chart data. The key doesn't matter since we're only fetching one airport.
	// We'll merge all the results together into a single array and deduplicate.
	const allCharts = Object.values(charts).flat();
	const uniqueCharts = allCharts.filter((chart, index, arr) => 
		arr.findIndex(c => c.chart_code === chart.chart_code && c.chart_name === chart.chart_name) === index
	);
	return json(uniqueCharts);
}
