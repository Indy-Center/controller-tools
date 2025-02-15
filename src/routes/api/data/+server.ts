import { fetchAirports } from '$lib/api/airports';
import { fetchOnlineControllers } from '$lib/api/controllers';
import { fetchOverflights } from '$lib/api/overflights';
import { json } from '@sveltejs/kit';

export async function GET() {
	const airports = await fetchAirports();
	const airportIcaos = airports.map((a) => a.icao_id);

	const overflights = await fetchOverflights();

	const metarData = await fetch(
		`https://metar.vatsim.net/metar.php?id=${airportIcaos.join(',')}&format=json`
	).then((res) => res.json());
	const vatsimData = await fetch('https://data.vatsim.net/v3/vatsim-data.json').then((r) =>
		r.json()
	);

	const metars = metarData.filter((m: any) => {
		return airportIcaos.includes(m.id);
	});

	const atis = vatsimData.atis
		.filter((a: { callsign: string }) => {
			return airportIcaos.includes(a.callsign.split('_')[0]!);
		})
		.sort((a: { callsign: string }, b: { callsign: string }) => {
			const isADeparture = a.callsign.includes('_D_ATIS') ? -1 : 0;
			const isBDeparture = b.callsign.includes('_D_ATIS') ? -1 : 0;
			return isADeparture - isBDeparture;
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
		atis,
		controllers,
		departures,
		arrivals,
		overflights
	});
}
