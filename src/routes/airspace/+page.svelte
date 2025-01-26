<script lang="ts">
	import Map from '$lib/components/map/AirspaceMap.svelte';
	import type { PageData } from './$types';
	import { restrictionFilters } from '$lib/state.svelte';
	let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
	<title>ICT - Airspace</title>
</svelte:head>

<div class="relative flex-1">
	<div class="absolute inset-0">
		<Map areas={restrictionFilters.areas} />
	</div>
</div>

<style>
</style>
