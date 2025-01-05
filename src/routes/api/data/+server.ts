import { json } from '@sveltejs/kit';
import { fetchAirports, fetchOnlineControllers, fetchOverflights } from '$lib/api';

export async function GET() {
	const airports = await fetchAirports();
	const overflights = await fetchOverflights();

	const metarData = await fetch('https://metar.vatsim.net/metar.php?id=all&format=json').then(
		(res) => res.json()
	);
	const vatsimData = await fetch('https://data.vatsim.net/v3/vatsim-data.json').then((r) =>
		r.json()
	);

	const airportIcaos = airports.map((a) => a.icao_id);

	const metars = metarData.filter((m: any) => {
		return airportIcaos.includes(m.id);
	});

	const controllers = await fetchOnlineControllers();

	const arrivals = vatsimData.pilots.filter((p: any) => {
		return p.flight_plan && airportIcaos.includes(p.flight_plan.arrival);
	});

	const departures = vatsimData.pilots.filter((p: any) => {
		return p.flight_plan && airportIcaos.includes(p.flight_plan.departure);
	});

	return json({
		airports,
		metars,
		controllers,
		departures,
		arrivals,
		overflights
	});
}
