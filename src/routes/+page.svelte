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

<div
	class="relative z-0 flex h-[calc(100dvh-136px)] lg:h-[calc(100dvh-96px)] lg:min-h-[calc(100dvh-96px)]"
>
	<div
		class="hidden h-full w-1/4 flex-col justify-between bg-white bg-opacity-80 lg:flex dark:bg-zinc-700 dark:text-white"
	>
		<!-- Controllers List Section -->
		<div class="flex flex-1 flex-col">
			<ControllerPanel controllers={data.controllers} />
		</div>
		<!-- Weather Section -->
		<div class="flex-1">
			<TrafficAndWeatherPanel
				metars={data.metars}
				departures={data.departures}
				arrivals={data.arrivals}
			/>
		</div>
	</div>
	<Map airports={data.airports} metars={data.metars} planes={data.overflights} />
</div>

<div
	class="absolute bottom-28 z-50 mx-auto flex w-full justify-around gap-4 bg-white px-4 py-2 text-sm drop-shadow lg:bottom-10 lg:left-1/2 lg:w-auto lg:rounded-2xl dark:bg-zinc-700 dark:text-white"
>
	<div>
		<span class="font-medium">Arrivals:</span>
		<span class="font-light">{data.arrivals.length}</span>
	</div>
	<div>
		<span class="font-medium">Departures:</span>
		<span class="font-light">{data.departures.length}</span>
	</div>
	<div>
		<span class="font-medium">Controllers:</span>
		<span class="font-light">{data.controllers.length}</span>
	</div>
</div>
