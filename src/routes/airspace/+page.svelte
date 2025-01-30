<script lang="ts">
	import Map from '$lib/components/map/AirspaceMap.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import MdiMapMarker from 'virtual:icons/mdi/map-marker';
	import type { PageData } from './$types';
	import { restrictionFilters } from '$lib/state.svelte';
	let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
	<title>ICT - Airspace</title>
</svelte:head>

<div class="relative flex-1">
	{#if data.splits.length === 0}
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="container mx-auto max-w-6xl px-4">
				<EmptyState
					icon={MdiMapMarker}
					message="No airspace areas available. If you're an admin, add some splits to get started."
				/>
			</div>
		</div>
	{:else}
		<div class="absolute inset-0">
			<Map splits={data.splits} />
		</div>
	{/if}
</div>

<style>
</style>
