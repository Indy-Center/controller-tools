<script lang="ts">
	import RestrictionRow from './RestrictionRow.svelte';
	import type { Restriction } from '$lib/db/schema';

	const {
		airport,
		restrictions,
		splits
	}: { airport: string; restrictions: Restriction[]; splits: any[] } = $props();

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
	class="mb-3 flex w-full flex-col rounded-md border-2 border-surface-tertiary md:mb-6 md:flex-row dark:border-surface-dark-tertiary"
>
	<div
		class="w-full flex-shrink-0 rounded-t-sm bg-surface-tertiary text-center text-lg font-normal text-content md:w-24 md:rounded-l-sm md:rounded-tr-none dark:bg-surface-dark-tertiary dark:text-content-dark"
	>
		{airport}
	</div>
	<div class="flex flex-grow flex-col gap-4 p-2">
		<div
			class="mx-2 -mb-4 hidden border-b border-surface-tertiary font-medium text-content lg:flex dark:border-surface-dark-tertiary dark:text-content-dark"
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
				<RestrictionRow {route} {restrictions} {splits} />
			{/each}
		{/key}
	</div>
</div>
