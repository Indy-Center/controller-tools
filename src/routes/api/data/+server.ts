import { json } from '@sveltejs/kit';
import { fetchAirports } from '$lib/api';

export async function GET() {
	const airports = await fetchAirports();

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

	const controllers = vatsimData.controllers.filter((c: any) => {
		return (
			c.facility > 1 &&
			c.rating > 0 &&
			(airportIcaos.some((icao) => icao.endsWith(c.callsign.substring(0, 3))) || // Reverse check
				/^IND_\d+_CTR$/.test(c.callsign)) // Matches "IND_83_CTR", "IND_403_CTR", etc.
		);
	});

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
		arrivals
	});
}
