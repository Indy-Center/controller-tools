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

<div
	class="mb-3 flex w-full flex-col rounded-md border-2 border-t-0 border-zinc-600 md:mb-6 md:flex-row md:border-l-0 md:border-t-2 lg:border-none"
>
	<div
		class="w-full rounded-sm bg-zinc-600 text-center text-lg font-normal text-white md:w-24 md:rounded-md"
	>
		{airport}
	</div>
	<div class="flex flex-grow flex-col gap-4">
		<div class="hidden border-b border-b-zinc-500 px-2 font-medium lg:flex dark:border-b-zinc-300">
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
