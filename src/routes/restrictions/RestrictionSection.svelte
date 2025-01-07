<script lang="ts">
	import RestrictionRow from './RestrictionRow.svelte';
	import type { Restriction } from '$lib/db/schema';

	const { airport, restrictions }: { airport: string; restrictions: Restriction[] } = $props();

	let routes = $derived.by(() => {
		const map = new Map<string, Restriction[]>();
		restrictions.forEach((restriction) => {
			const route = restriction.route;
			if (!map.has(route)) {
				map.set(route, []);
			}
			map.get(route).push(restriction);
		});
		return map;
	});
</script>

<div class="flex w-full flex-col p-1">
	<div class="w-full rounded-md bg-zinc-700 text-center text-lg font-normal text-white">
		{airport}
	</div>
	<div class="flex flex-grow flex-col gap-2">
		<div class="hidden border-b border-b-zinc-500 font-medium dark:border-b-zinc-300">
			<div class="w-4/12">Route</div>
			<div class="flex flex-grow">
				<div class="w-1/12">From</div>
				<div class="w-1/12">To</div>
				<div class="w-3/12">Restriction</div>
				<div class="w-3/12">Notes</div>
			</div>
		</div>
		{#each routes as [route, restrictions]}
			<RestrictionRow {route} {restrictions} />
		{/each}
	</div>
</div>
