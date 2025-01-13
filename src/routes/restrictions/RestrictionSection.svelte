<script lang="ts">
	import RestrictionRow from './RestrictionRow.svelte';
	import type { Restriction } from '$lib/db/schema';

	const { airport, restrictions }: { airport: string; restrictions: Restriction[] } = $props();

	let routes = $derived.by(() => {
		const map = new Map<string, Restriction[]>();
		restrictions.forEach((restriction) => {
			const route = restriction.route || 'All Routes';
			if (!map.has(route)) {
				map.set(route, []);
			}
			map.get(route)!.push(restriction);
		});
		return map;
	});
</script>

<div
	class="mb-3 flex w-full flex-col rounded-md border-2 border-t-0 border-zinc-600 md:mb-6 md:flex-row md:border-l-0 md:border-t-2 lg:border-none"
>
	<div
		class="w-full rounded-sm bg-zinc-600 text-center text-lg font-normal flex-shrink-0 text-white md:w-24 md:rounded-md lg:mt-2"
	>
		{airport}
	</div>
	<div class="flex flex-grow flex-col gap-4">
		<div
			class="mx-2 -mb-4 hidden border-b border-b-zinc-500 font-medium lg:flex dark:border-b-zinc-300"
		>
			<div class="w-4/12">Route</div>
			<div class="flex w-8/12 flex-grow">
				<div class="flex w-1/4 gap-2">
					<div class="w-full">From</div>
					<div class="w-full">To</div>
				</div>
				<div class="w-1/3 px-4">Restriction</div>
				<div class="w-1/3">Notes</div>
			</div>
		</div>
		{#each routes as [route, restrictions]}
			<RestrictionRow {route} {restrictions} />
		{/each}
	</div>
</div>
