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

<div class="w-full flex flex-col lg:flex-row mb-2 py-2">
	<div class="w-full lg:w-32 text-left mr-4 font-medium border rounded-md p-2 bg-zinc-700 text-white">
		{airport}
	</div>
	<div class="flex flex-col flex-grow">
		<div class="hidden lg:flex font-medium border-b dark:border-b-zinc-300 border-b-zinc-500 mb-2">
			<div class="w-4/12">Route</div>
			<div class="flex flex-grow lg:gap-x-2">
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