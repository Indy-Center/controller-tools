<script lang="ts">
	import Map from './Map.svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import dayjs from 'dayjs';
	import duration from 'dayjs/plugin/duration';
	import utc from 'dayjs/plugin/utc';
	import { getFlightCategory } from '$lib/helpers';
	import FlightCatagoryBadge from '$lib/FlightCatagoryBadge.svelte';
	import { sayNoToKilo } from '$lib/helpers.js';

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

	const weatherAirports = ['KCVG', 'KLEX', 'KCMH', 'KIND', 'KCRW', 'KHUF', 'KEVV', 'KHTS', 'KSDF'];

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
			timeString += `~${hours} Hour${hours > 1 ? 's' : ''}`;
		}
		if (minutes > 0) {
			if (timeString) timeString += ', ';
			timeString += `~${minutes} Minute${minutes > 1 ? 's' : ''}`;
		}

		return timeString || '~0 minutes'; // In case the duration is less than a minute
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
	class="relative z-0 flex h-[calc(100vh-136px)] lg:h-[calc(100vh-87px)] lg:min-h-[calc(100vh-88px)]"
>
	<div
		class="left-4 top-14 z-50 hidden w-1/4 flex-col justify-between bg-white bg-opacity-80 drop-shadow lg:flex dark:bg-zinc-700 dark:text-white"
	>
		<!-- Controllers List Section -->
		<div class="relative flex-1 overflow-y-auto">
			<h2 class="bg-zinc-600 px-2 py-1 text-xl font-medium text-white">Online Controllers</h2>
			<div
				class="h-full w-full overflow-y-scroll border-t border-t-zinc-400 text-sm dark:border-t-zinc-100"
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

			<!-- Gradient Effect at the Bottom -->
			<div
				class="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-zinc-200 to-transparent dark:from-zinc-700"
			></div>
		</div>

		<!-- Weather Section -->
		<div class="h-fit flex-1">
			<h2 class="bg-zinc-600 px-2 py-1 text-xl font-medium text-white">Weather</h2>
			<div class="w-full overflow-y-auto border-t border-t-zinc-400 text-sm dark:border-t-zinc-100">
				{#each weatherAirports as airport}
					<div
						class="w-full border-b border-zinc-300 px-2 py-1 last-of-type:border-0 dark:border-zinc-500"
					>
						<div class="flex justify-between">
							<div class="font-medium">{sayNoToKilo(airport)}</div>
							<FlightCatagoryBadge
								category={getFlightCategory(data.metars.find((m) => m.id === airport)?.metar || '')}
							/>
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
