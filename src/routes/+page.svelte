<script lang="ts">
	import Map from './Map.svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { AirportsResponse, ControllersResponse, OverflightsResponse } from '$lib/api';
	import ControllerInfo from '$lib/components/controllerInfo/ControllerInfo.svelte';
	import AirportWeather from '$lib/components/trafficAndWeather/AirportWeather.svelte';
	import { getFlightCategory } from '$lib/helpers';
	import MdiIcon from '$lib/components/MdiIcon.svelte';

	let showControllers = $state(false);
	let showWeather = $state(false);

	const {
		data
	}: {
		data: {
			airports: AirportsResponse;
			metars: Metar[];
			atis: VatsimDataResponse['atis'];
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
	<title>ICT - Integrated Controller Tools</title>
</svelte:head>

<div class="relative flex-1">
	<!-- Map Container -->
	<div class="absolute inset-0">
		<Map
			airports={data.airports}
			metars={data.metars}
			planes={data.overflights}
			controllers={data.controllers}
		/>
	</div>

	<!-- Floating Panels Container -->
	<div class="pointer-events-none absolute inset-0 z-[40]">
		<!-- Mobile Floating Buttons -->
		<div
			class="pointer-events-auto fixed bottom-32 left-1/2 z-[30] flex -translate-x-1/2 gap-4 md:hidden"
		>
			<button
				class={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-2 transition-colors ${
					showWeather
						? 'bg-accent text-white ring-transparent'
						: 'bg-surface/80 text-accent ring-accent dark:bg-surface-dark/80'
				}`}
				onclick={() => {
					if (showControllers) showControllers = false;
					showWeather = !showWeather;
				}}
			>
				<MdiIcon name="weather-partly-cloudy" class="h-6 w-6" />
			</button>
			<button
				class={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-2 transition-colors ${
					showControllers
						? 'bg-accent text-white ring-transparent'
						: 'bg-surface/80 text-accent ring-accent dark:bg-surface-dark/80'
				}`}
				onclick={() => {
					if (showWeather) showWeather = false;
					showControllers = !showControllers;
				}}
			>
				<MdiIcon name="transmission-tower" class="h-6 w-6" />
			</button>
		</div>

		<!-- Panels -->
		<div class="absolute inset-x-4 top-4 z-[40]">
			<div class="flex w-full flex-col gap-4 md:w-96">
				<!-- Controller Panel -->
				<div
					class={`pointer-events-auto max-h-[40vh] overflow-y-auto rounded-lg bg-surface/95 p-4 shadow-lg backdrop-blur-md dark:bg-surface-dark/95 ${
						!showControllers ? 'hidden md:block' : ''
					}`}
					onwheel={(e) => e.stopPropagation()}
				>
					<h3
						class="mb-2 flex items-center gap-2 text-sm font-medium text-content dark:text-content-dark"
					>
						<MdiIcon name="transmission-tower" class="h-5 w-5" />
						Online Controllers
					</h3>
					<div class="flex flex-col divide-y divide-content/5">
						{#if data.controllers.length > 0}
							{#each data.controllers as controller}
								<ControllerInfo {controller} />
							{/each}
						{:else}
							<div class="py-2 text-content dark:text-content-dark">No Controllers Online</div>
						{/if}
					</div>
				</div>

				<!-- Weather Panel -->
				<div
					class={`pointer-events-auto max-h-[40vh] overflow-y-auto rounded-lg bg-surface/95 p-4 shadow-lg backdrop-blur-md dark:bg-surface-dark/95 ${
						!showWeather ? 'hidden md:block' : ''
					}`}
					onwheel={(e) => e.stopPropagation()}
				>
					<h3
						class="mb-2 flex items-center gap-2 text-sm font-medium text-content dark:text-content-dark"
					>
						<MdiIcon name="weather-partly-cloudy" class="h-5 w-5" />
						Traffic and Weather
					</h3>
					<div class="flex flex-col divide-y divide-content/5">
						{#each data.airports.filter((airport) => data.departures.some((d) => d.flight_plan.departure === airport.icao_id) || data.arrivals.some((a) => a.flight_plan.arrival === airport.icao_id)) as airport}
							<AirportWeather
								airport={{
									id: airport.icao_id,
									departures: data.departures.filter(
										(d) => d.flight_plan.departure === airport.icao_id
									).length,
									arrivals: data.arrivals.filter((a) => a.flight_plan.arrival === airport.icao_id)
										.length,
									metar: data.metars.find((m) => m.id === airport.icao_id)?.metar ?? '',
									atis: data.atis.filter((a) => a.callsign.includes(airport.icao_id)) ?? [],
									category: getFlightCategory(
										data.metars.find((m) => m.id === airport.icao_id)?.metar ?? ''
									) as 'VFR' | 'IFR' | 'LIFR' | 'MVFR'
								}}
							/>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
