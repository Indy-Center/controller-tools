<script lang="ts">
	import { getWindDirection, sayNoToKilo } from '$lib/helpers';
	import FlightCategoryBadge from '$lib/FlightCategoryBadge.svelte';
	import MdiIcon from '../MdiIcon.svelte';

	let {
		airport
	}: {
		airport: {
			id: string;
			departures: number;
			arrivals: number;
			metar: string;
			atis: VatsimDataResponse['atis'];
			category: 'VFR' | 'IFR' | 'LIFR' | 'MVFR';
		};
	} = $props();
</script>

<div class="w-full px-2 py-2">
	<div class="flex items-center">
		<!-- Airport Section -->
		<div class="w-1/6 text-left font-medium">
			{sayNoToKilo(airport.id)}
		</div>

		<!-- Departure Section -->
		<div class="flex w-1/6 items-center justify-center space-x-2">
			<MdiIcon name="airplane-takeoff" class="h-6 w-6" />
			<span>
				{airport.departures}
			</span>
		</div>

		<!-- Arrival Section -->
		<div class="mr-2 flex w-1/6 items-center justify-center space-x-2">
			<MdiIcon name="airplane-landing" class="h-6 w-6" />
			<span>
				{airport.arrivals}
			</span>
		</div>

		<!-- Wind Direction Section -->
		{#if airport.metar}
			<div class="flex w-1/6 items-center justify-center">
				{#if getWindDirection(airport.metar) || 0 > 0}
					<MdiIcon
						name="arrow-down"
						style="transform: rotate({getWindDirection(airport.metar || '')}deg)"
						class="h-5 w-5 text-blue-500"
					/>
				{:else}
					<MdiIcon name="circle-double" class="h-4 w-4 text-blue-500" />
				{/if}
			</div>
		{/if}

		<!-- Flight Category Section -->
		<div class="flex w-1/6 items-center" title={airport.metar}>
			<FlightCategoryBadge category={airport.category} />
		</div>

		<!-- ATIS Section -->
		<div class="flex w-1/6 items-center space-x-1">
			{#if airport.atis.length > 0}
				{#each airport.atis as atis}
					{#if atis.text_atis && atis.atis_code}
						<div
							class="mx-0.5 flex h-5 w-5 items-center justify-center rounded border text-xs text-white"
							title={atis.text_atis.join()}
							class:bg-red-500={atis.callsign.includes('_D_ATIS')}
							class:bg-blue-500={atis.callsign.includes('_A_ATIS')}
							class:bg-green-500={!atis.callsign.includes('_D_ATIS') &&
								!atis.callsign.includes('_A_ATIS')}
						>
							{atis.atis_code}
						</div>
					{/if}
				{/each}
			{:else}
				<!-- Show blank space for no ATIS -->
				<div class="mx-0.5 flex h-5 w-10"></div>
			{/if}
		</div>
	</div>
</div>
