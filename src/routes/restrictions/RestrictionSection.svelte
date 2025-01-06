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

<div class="mb-2 flex w-full flex-col space-y-4 py-2 lg:flex-row lg:space-y-0">
	<div
		class="w-full rounded-md border bg-zinc-700 p-2 text-center font-medium text-white lg:mr-4 lg:w-32 lg:text-left"
	>
		{airport}
	</div>
	<div class="flex flex-grow flex-col">
		<div class="mb-2 hidden border-b border-b-zinc-500 font-medium lg:flex dark:border-b-zinc-300">
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
