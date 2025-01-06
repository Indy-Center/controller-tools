<script lang="ts">
	import { getWindDirection, sayNoToKilo } from '$lib/helpers';
	import ArrivalIcon from 'virtual:icons/mdi/airplane-landing';
	import FlightCategoryBadge from '$lib/FlightCategoryBadge.svelte';
	import CircleDouble from 'virtual:icons/mdi/circle-double';
	import DepartureIcon from 'virtual:icons/mdi/airplane-takeoff';
	import ArrowDown from 'virtual:icons/mdi/arrow-down-thin';

	let {
		airport
	}: {
		airport: {
			id: string;
			departures: number;
			arrivals: number;
			metar: string;
			category: 'VFR' | 'IFR' | 'LIFR' | 'MVFR';
		};
	} = $props();
</script>

<div class="w-full border-b border-zinc-300 px-2 py-1 last-of-type:border-0 dark:border-zinc-500">
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
		{#if airport.metar}
			<div class="flex flex-1 items-center justify-center space-x-2">
				{#if getWindDirection(airport.metar) || 0 > 0}
					<ArrowDown
						style="transform: rotate({getWindDirection(airport.metar || '')}deg)"
						class="h-6 w-6 text-blue-500"
					/>
				{:else}
					<CircleDouble class="h-4 w-4 text-blue-500" />
				{/if}
			</div>
		{/if}

		<!-- Flight Category Section -->
		<div class="flex-1 text-center" title={airport.metar}>
			<FlightCategoryBadge category={airport.category} />
		</div>
	</div>
</div>
