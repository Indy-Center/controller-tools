<script lang="ts">
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Map from '$lib/components/map/AirspaceMap.svelte';
	import type { PageData } from './$types';
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
					icon="map-marker"
					message="No airspace areas available. If you're an admin, add some splits to get started."
				/>
			</div>
		</div>
	{:else}
		<div class="absolute inset-0">
			<Map staticElementGroups={data.staticElementGroups} splits={data.splits} />
		</div>
	{/if}
</div>

<style>
</style>
