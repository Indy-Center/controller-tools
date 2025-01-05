<script lang="ts">
	import Map from './Map.svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import dayjs from 'dayjs';
	import duration from 'dayjs/plugin/duration';
	import utc from 'dayjs/plugin/utc';
	import { getFlightCategory, getWindDirection } from '$lib/helpers';
	import FlightCategoryBadge from '$lib/FlightCategoryBadge.svelte';
	import { sayNoToKilo } from '$lib/helpers.js';
	import DepartureIcon from 'virtual:icons/mdi/airplane-takeoff';
	import ArrivalIcon from 'virtual:icons/mdi/airplane-landing';
	import ArrowDown from 'virtual:icons/mdi/arrow-down-thin';
	import CircleDouble from 'virtual:icons/mdi/circle-double';
	const {
		data
	}: {
		data: {
			airports: Airport[];
			metars: Metar[];
			controllers: Controller[];
			departures: any[];
			arrivals: any[];
		};
	} = $props();

	dayjs.extend(duration);
	dayjs.extend(utc);

	const weatherAirports: {
		id: string;
		departures: number;
		arrivals: number;
		metar: string;
		category: 'VFR' | 'IFR' | 'LIFR' | 'MVFR';
	}[] = $derived.by(() => {
		// Extract both departure and arrival airports
		const airportsWithTraffic = new Set<string>();
		data.departures.forEach((d) => airportsWithTraffic.add(d.flight_plan.departure));
		data.arrivals.forEach((d) => airportsWithTraffic.add(d.flight_plan.arrival));

		return Array.from(airportsWithTraffic)
			.map((a: string) => {
				const metar = data.metars.find((m) => m.id === a);
				return {
					id: a,
					metar: metar ? metar.metar : '',
					departures: data.departures.filter((dd) => dd.flight_plan.departure === a)?.length || 0,
					arrivals: data.arrivals.filter((da) => da.flight_plan.arrival === a)?.length || 0,
					category: metar ? getFlightCategory(metar.metar) : 'VFR'
				};
			})
			.sort((a, b) => {
				// Sort by the sum of arrivals and departures
				const aTotal = a.arrivals + a.departures;
				const bTotal = b.arrivals + b.departures;

				// Compare the totals
				return bTotal - aTotal; // Sorting in descending order
			});
	});

	function formatTime(logonTime: string) {
		return `${dayjs.utc(logonTime).format('HH:mm')}Z`;
	}

	function formatDuration(logonTime: string) {
		const logonMoment = dayjs.utc(logonTime);
		const now = dayjs.utc();

		const duration = now.diff(logonMoment); // Get the difference in milliseconds

		// Use dayjs to calculate the duration in various units
		const hours = dayjs.duration(duration).hours();
		const minutes = dayjs.duration(duration).minutes();

		// Create a fuzzy output
		let timeString = '';
		if (hours > 0) {
			timeString += `${hours} Hour${hours > 1 ? 's' : ''}`;
		}
		if (minutes > 0) {
			if (timeString) timeString += ', ';
			timeString += `${minutes} Minute${minutes > 1 ? 's' : ''}`;
		}

		return timeString || '< 1 minute'; // In case the duration is less than a minute
	}

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
	class="relative z-0 flex h-[calc(100vh-136px)] lg:h-[calc(100vh-96px)] lg:min-h-[calc(100vh-96px)]"
>
	<div
		class="hidden h-full w-1/4 flex-col justify-between bg-white bg-opacity-80 lg:flex dark:bg-zinc-700 dark:text-white"
	>
		<!-- Controllers List Section -->
		<div class="flex flex-1 flex-col">
			<!-- Controller Header (fixed) -->
			<h2 class="bg-zinc-600 px-2 py-1 text-xl text-white">Online Controllers</h2>

			<!-- Scrollable Controller List (ensure it doesn't stretch off the page) -->
			<div
				class="max-h-[calc(50vh-40px)] flex-1 overflow-y-auto border-t border-t-zinc-400 text-sm dark:border-t-zinc-100"
			>
				{#if data.controllers.length > 0}
					{#each data.controllers as controller}
						<div
							class="w-full border-b border-zinc-300 px-4 py-2 last-of-type:border-0 dark:border-zinc-500"
						>
							<div class="flex justify-between">
								<div class="font-medium">{controller.callsign}</div>
								<div class="font-light">{controller.name}</div>
							</div>
							<div class="flex justify-between">
								<div class="text-xs font-light">{formatTime(controller.logon_time)}</div>
								<div class="text-xs font-light">{formatDuration(controller.logon_time)}</div>
							</div>
						</div>
					{/each}
				{:else}
					<div class="w-full p-4 text-sm">No Controllers Online</div>
				{/if}
			</div>
		</div>
		<!-- Weather Section -->
		<div class="flex-1">
			<h2 class="bg-zinc-600 px-2 py-1 text-xl text-white">Weather</h2>
			<div
				class="max-h-[calc(50vh-40px)] flex-1 overflow-y-auto border-t border-t-zinc-400 text-sm dark:border-t-zinc-100"
			>
				{#each weatherAirports as airport}
					<div
						class="w-full border-b border-zinc-300 px-2 py-1 last-of-type:border-0 dark:border-zinc-500"
					>
						<div class="flex items-center justify-between">
							<!-- Airport Section -->
							<div class="flex-1 text-center font-medium">
								{sayNoToKilo(airport.id)}
							</div>

							<!-- Arrival Section -->
							<div class="flex flex-1 items-center justify-center space-x-2">
								<span class="text-center">
									{airport.arrivals}
								</span>
								<ArrivalIcon class="h-6 w-6" />
							</div>

							<!-- Departure Section -->
							<div class="flex flex-1 items-center justify-center space-x-2">
								<span class="text-center">
									{airport.departures}
								</span>
								<DepartureIcon class="h-6 w-6" />
							</div>

							<!-- Wind Direction Section -->
							{#if data.metars}
								<div class="flex flex-1 items-center justify-center space-x-2">
									{#if getWindDirection(airport.metar) || 0 > 0}
										<ArrowDown
											style="transform: rotate({getWindDirection(
												data.metars.find((m) => m.id === airport.id)?.metar || ''
											)}deg)"
											class="h-6 w-6 text-blue-500"
										/>
									{:else}
										<CircleDouble class="h-4 w-4 text-blue-500" />
									{/if}
								</div>
							{/if}

							<!-- Flight Category Section -->
							<div class="flex-1 text-center">
								<FlightCategoryBadge category={airport.category} />
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
	<Map airports={data.airports} metars={data.metars} />
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
