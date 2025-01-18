<script lang="ts">
	import Map from '$lib/airspace/components/Map.svelte';
	import type { PageData } from './$types';
	import { restrictionFilters } from '$lib/state.svelte';
	let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
	<title>ICCT - Airspace</title>
</svelte:head>

<div
	class="relative z-0 flex h-[calc(100dvh-136px)] lg:h-[calc(100dvh-96px)] lg:min-h-[calc(100dvh-96px)]"
>
	<div class="h-[calc(100dvh-136px)] w-full lg:h-[calc(100dvh-96px)]">
		<Map areas={restrictionFilters.areas} />
	</div>
</div>

<style>
</style>
