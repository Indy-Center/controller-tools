<script lang="ts">
	import AirportWeather from './AirportWeather.svelte';
	import { getFlightCategory } from '$lib/helpers';

	let {
		metars,
		departures,
		arrivals,
		atis
	}: {
		metars: Metar[];
		departures: any[];
		arrivals: any[];
		atis: VatsimDataResponse['atis'];
	} = $props();

	const weatherAirports: {
		id: string;
		departures: number;
		arrivals: number;
		metar: string;
		atis: VatsimDataResponse['atis'];
		category: 'VFR' | 'IFR' | 'LIFR' | 'MVFR';
	}[] = $derived.by(() => {
		// Extract both departure and arrival airports
		const airportsWithTraffic = new Set<string>();
		departures.forEach((d) => airportsWithTraffic.add(d.flight_plan.departure));
		arrivals.forEach((d) => airportsWithTraffic.add(d.flight_plan.arrival));

		return Array.from(airportsWithTraffic)
			.map((a: string) => {
				const metar = metars.find((m) => m.id === a);
				return {
					id: a,
					metar: metar ? metar.metar : '',
					atis: atis.filter((at) => at.callsign.includes(a)),
					departures: departures.filter((dd) => dd.flight_plan.departure === a)?.length || 0,
					arrivals: arrivals.filter((da) => da.flight_plan.arrival === a)?.length || 0,
					category: metar ? getFlightCategory(metar.metar) : 'VFR'
				};
			})
			.sort((a, b) => {
				// Sort by the sum of arrivals and departures
				const aTotal = a.arrivals + a.departures;
				const bTotal = b.arrivals + b.departures;

				// Compare the totals
				return bTotal - aTotal; // Sorting in descending order
			})
			.slice(0, 8);
	});
</script>

<h2 class="bg-zinc-600 px-2 py-1 text-xl text-white">Traffic and Weather</h2>
<div
	class="max-h-[calc(50vh-40px)] flex-1 overflow-y-auto border-t border-t-zinc-400 text-sm dark:border-t-zinc-100"
>
	{#each weatherAirports as airport}
		<AirportWeather {airport} />
	{/each}
</div>
