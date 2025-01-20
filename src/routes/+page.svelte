<script lang="ts">
	import Map from './Map.svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { AirportsResponse, ControllersResponse, OverflightsResponse } from '$lib/api';
	import ControllerInfo from './ControllerInfo.svelte';
	import AirportWeather from './AirportWeather.svelte';
	import { getFlightCategory, getWindDirection } from '$lib/helpers';
	import RadarTowerIcon from 'virtual:icons/mdi/radar';
	import WeatherPartlyCloudyIcon from 'virtual:icons/mdi/weather-partly-cloudy';
	import ChevronDownIcon from 'virtual:icons/mdi/chevron-down';
	import MenuIcon from 'virtual:icons/mdi/menu';

	let showPanels = false;
	let showControllers = $state(false);
	let showWeather = $state(false);

	// Test data for controllers
	const testControllers = [
		{
			position: 'IND_CTR',
			frequency: '134.375',
			online_since: '2024-03-19T12:00:00Z',
			controller: {
				first_name: 'John',
				last_name: 'Doe',
				operating_initials: 'JD'
			}
		},
		{
			position: 'IND_E_APP',
			frequency: '132.050',
			online_since: '2024-03-19T13:30:00Z',
			controller: {
				first_name: 'Jane',
				last_name: 'Smith',
				operating_initials: 'JS'
			}
		},
		{
			position: 'IND_W_APP',
			frequency: '125.350',
			online_since: '2024-03-19T14:15:00Z',
			controller: {
				first_name: 'Mike',
				last_name: 'Johnson',
				operating_initials: 'MJ'
			}
		},
		{
			position: 'IND_N_APP',
			frequency: '126.700',
			online_since: '2024-03-19T15:00:00Z',
			controller: {
				first_name: 'Sarah',
				last_name: 'Wilson',
				operating_initials: 'SW'
			}
		},
		{
			position: 'IND_S_APP',
			frequency: '127.225',
			online_since: '2024-03-19T16:45:00Z',
			controller: {
				first_name: 'Tom',
				last_name: 'Brown',
				operating_initials: 'TB'
			}
		},
		{
			position: 'IND_DEP',
			frequency: '133.700',
			online_since: '2024-03-19T17:30:00Z',
			controller: {
				first_name: 'Lisa',
				last_name: 'Davis',
				operating_initials: 'LD'
			}
		},
		{
			position: 'EVV_APP',
			frequency: '118.850',
			online_since: '2024-03-19T18:15:00Z',
			controller: {
				first_name: 'David',
				last_name: 'Miller',
				operating_initials: 'DM'
			}
		},
		{
			position: 'FWA_APP',
			frequency: '119.600',
			online_since: '2024-03-19T19:00:00Z',
			controller: {
				first_name: 'Emily',
				last_name: 'Taylor',
				operating_initials: 'ET'
			}
		},
		{
			position: 'SDF_APP',
			frequency: '120.775',
			online_since: '2024-03-19T20:30:00Z',
			controller: {
				first_name: 'Robert',
				last_name: 'Anderson',
				operating_initials: 'RA'
			}
		},
		{
			position: 'CMH_APP',
			frequency: '124.200',
			online_since: '2024-03-19T21:15:00Z',
			controller: {
				first_name: 'Amanda',
				last_name: 'White',
				operating_initials: 'AW'
			}
		}
	];

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

	// Override the controllers with test data
	data.controllers = testControllers;

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
						: 'bg-surface/80 dark:bg-surface-dark/80 text-accent ring-accent'
				}`}
				onclick={() => (showWeather = !showWeather)}
			>
				<WeatherPartlyCloudyIcon class="h-6 w-6" />
			</button>
			<button
				class={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-2 transition-colors ${
					showControllers
						? 'bg-accent text-white ring-transparent'
						: 'bg-surface/80 dark:bg-surface-dark/80 text-accent ring-accent'
				}`}
				onclick={() => (showControllers = !showControllers)}
			>
				<RadarTowerIcon class="h-6 w-6" />
			</button>
		</div>

		<!-- Panels -->
		<div class="absolute inset-x-4 top-4 z-[40]">
			<div class="flex w-full flex-col gap-4 md:w-96">
				<!-- Controller Panel -->
				<div
					class={`bg-surface/95 dark:bg-surface-dark/95 rounded-lg shadow-lg ring-1 ring-black/5 backdrop-blur-md dark:ring-white/10 ${
						!showControllers ? 'hidden md:block' : ''
					}`}
				>
					<div
						class="bg-accent flex w-full items-center gap-2 rounded-t-lg px-4 py-2 text-lg font-medium text-white"
					>
						<RadarTowerIcon class="h-5 w-5" />
						Online Controllers
					</div>
					<div class="h-[30vh] min-h-[30vh] overflow-y-auto md:h-[30vh]">
						{#if data.controllers.length > 0}
							{#each data.controllers as controller}
								<ControllerInfo {controller} />
							{/each}
						{:else}
							<div class="text-content dark:text-content-dark p-4">No Controllers Online</div>
						{/if}
					</div>
				</div>

				<!-- Weather Panel -->
				<div
					class={`bg-surface/95 dark:bg-surface-dark/95 rounded-lg shadow-lg ring-1 ring-black/5 backdrop-blur-md dark:ring-white/10 ${
						!showWeather ? 'hidden md:block' : ''
					}`}
				>
					<div
						class="bg-accent flex w-full items-center gap-2 rounded-t-lg px-4 py-2 text-lg font-medium text-white"
					>
						<WeatherPartlyCloudyIcon class="h-5 w-5" />
						Traffic and Weather
					</div>
					<div class="h-[30vh] min-h-[30vh] overflow-y-auto md:h-[30vh]">
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
