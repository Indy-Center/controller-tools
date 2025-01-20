<script lang="ts">
	import Map from '$lib/airspace/components/Map.svelte';
	import type { PageData } from './$types';
	import { restrictionFilters } from '$lib/state.svelte';
	let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
	<title>ICCT - Airspace</title>
</svelte:head>

<div class="absolute inset-0">
	<Map areas={restrictionFilters.areas} />
</div>

<style>
</style>
