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
	class="border-surface-tertiary dark:border-surface-dark-tertiary mb-3 flex w-full flex-col rounded-md border-2 md:mb-6 md:flex-row"
>
	<div
		class="bg-surface-tertiary dark:bg-surface-dark-tertiary text-content dark:text-content-dark w-full flex-shrink-0 rounded-t-sm text-center text-lg font-normal md:w-24 md:rounded-l-sm md:rounded-tr-none"
	>
		{airport}
	</div>
	<div class="flex flex-grow flex-col gap-4 p-2">
		<div
			class="border-surface-tertiary dark:border-surface-dark-tertiary text-content dark:text-content-dark mx-2 -mb-4 hidden border-b font-medium lg:flex"
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
		{#key routes}
			{#each routes as [route, restrictions]}
				<RestrictionRow {route} {restrictions} />
			{/each}
		{/key}
	</div>
</div>
