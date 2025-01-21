import { json } from '@sveltejs/kit';

export async function GET({ params }) {
	const charts = await fetch(
		`https://api.aviationapi.com/v1/charts?apt=${params.id.toUpperCase()}`
	).then((res) => res.json());

	return json(charts[params.id.toUpperCase()]);
}
