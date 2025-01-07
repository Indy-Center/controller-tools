<script lang="ts">
	import AreaBadge from './AreaBadge.svelte';
	import type { Restriction } from '$lib/db/schema';
	import { restrictionFilters } from '$lib/state.svelte';
	import Notes from './Notes.svelte';

	let { route, restrictions }: { route: string; restrictions: Restriction[] } = $props();
</script>

<div
	class="flex flex-col rounded-sm px-2 py-2 pb-2 odd:bg-zinc-200 md:flex-row dark:odd:bg-zinc-700"
>
	<!-- Route Header -->
	<div class=" flex flex-col pb-1 md:w-4/6 lg:w-4/12">
		<span class="block font-light lg:hidden">Route</span>
		{route || 'All Routes'}
	</div>

	<!-- Restrictions Data -->
	<div class="flex w-auto flex-grow flex-col md:w-5/6 lg:w-full">
		{#each restrictions as restriction}
			<div
				class="flex flex-grow flex-col border-zinc-200 pb-4 last:pb-0 md:gap-1 lg:flex-row"
				class:incoming={restrictionFilters.includeIncoming &&
					restrictionFilters.areas.includes(restriction.to.id) &&
					restrictionFilters.dimIncoming}
			>
				<!-- sectors -->
				<div class="flex w-full gap-2">
					<!-- From Header -->
					<div class="flex w-full flex-col justify-center">
						{#if restriction.from}
							<span class="block font-light lg:hidden">From</span>
							<AreaBadge label={restriction.from.id} />
						{/if}
					</div>

					<!-- To Header -->
					<div class="flex w-full flex-col justify-center">
						{#if restriction.to}
							<span class="block font-light lg:hidden">To</span>
							<AreaBadge label={restriction.to.id} />
						{/if}
					</div>
				</div>

				<!-- Restriction Header -->
				<div class="flex w-full flex-col justify-center">
					<span class="block font-light lg:hidden">Restriction</span>
					{restriction.restriction || 'Route only'}
				</div>

				<!-- Notes Header -->
				<div class="flex w-full flex-col justify-center">
					{#if restriction.notes}
						<span class="block font-light lg:hidden">Notes</span>
						<Notes content={restriction.notes || ''} />
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style lang="postcss">
	/* Apply opacity to the parent if it has only one child with the `.incoming` class */
	div:has(:only-child.incoming) {
		@apply -z-10 opacity-50;
	}

	/* Apply opacity to `.incoming` only if the parent does not match the above condition */
	div:not(:has(:only-child.incoming)) .incoming {
		@apply -z-10 opacity-50;
	}
</style>
