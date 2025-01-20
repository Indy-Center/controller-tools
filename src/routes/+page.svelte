<script lang="ts">
	import Map from './Map.svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { AirportsResponse, ControllersResponse, OverflightsResponse } from '$lib/api';
	import TrafficAndWeatherPanel from './TrafficAndWeatherPanel.svelte';
	import ControllerPanel from './ControllerPanel.svelte';

	const {
		data
	}: {
		data: {
			airports: AirportsResponse;
			metars: Metar[];
			atis: VatsimDataResponse['atis'][number];
			controllers: ControllersResponse;
			departures: any[];
			arrivals: any[];
			overflights: OverflightsResponse;
		};
	} = $props();

	onMount(() => {
		const interval = setInterval(() => {
			// Force a reload of the data
			invalidate('/api/data');
		}, 15000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<svelte:head>
	<title>ICCT - Indy Center Controller Tools</title>
</svelte:head>

<div class="absolute inset-0">
	<Map
		airports={data.airports}
		metars={data.metars}
		planes={data.overflights}
		controllers={data.controllers}
	/>
</div>
