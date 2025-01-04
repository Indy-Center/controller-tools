import { json } from '@sveltejs/kit';
import { fetchData } from '$lib/vatspy';

export async function GET() {
	const data = await fetchData();
	const metarData = await fetch('https://metar.vatsim.net/metar.php?id=all&format=json').then(
		(res) => res.json()
	);

	const airports = data.airports.filter((a) => {
		return a.fir === 'KZID';
	});

	const metars = metarData.filter((m: any) => {
		return airports.map((a) => a.icao).includes(m.id);
	});

	return json({
		airports,
		metars
	});
}
