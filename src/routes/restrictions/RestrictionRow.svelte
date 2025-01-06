<script lang="ts">
	import AreaBadge from './AreaBadge.svelte';
	import type { Restriction } from '$lib/db/schema';
	import { restrictionFilters } from '$lib/state.svelte';

	let { route, restrictions }: { route: string; restrictions: Restriction[] } = $props();
</script>

<div
	class="flex flex-col border-b border-b-zinc-300 text-sm last:border-0 lg:flex-row lg:py-1 dark:border-b-zinc-500"
>
	<!-- Route Header -->
	<div
		class="mb-2 flex w-full flex-col text-zinc-700 lg:mb-0 lg:w-4/12 lg:text-black dark:text-white"
	>
		<span class="block font-bold lg:hidden">Route</span>
		{route}
	</div>

	<!-- Restrictions Data -->
	<div class="flex flex-grow flex-col space-y-2">
		{#each restrictions as restriction}
			<div
				class=" flex flex-col space-y-2 lg:flex-row lg:gap-x-2 lg:space-y-0"
				class:incoming={restrictionFilters.includeIncoming &&
					restrictionFilters.areas.includes(restriction.to.id) &&
					restrictionFilters.dimIncoming}
			>
				<!-- From Header -->

				<div class="w-full lg:w-1/12">
					{#if restriction.from}
						<AreaBadge label={restriction.from.id} />
					{/if}
				</div>

				<!-- To Header -->

				<div class="w-full lg:w-1/12">
					{#if restriction.to}
						<AreaBadge label={restriction.to.id} />
					{/if}
				</div>

				<!-- Restriction Header -->
				<div class="flex w-full flex-col justify-center lg:w-3/12">
					<span class="block font-bold lg:hidden">Restriction</span>
					{restriction.restriction}
				</div>

				<!-- Notes Header -->
				<div class="flex w-full flex-col justify-center font-light lg:w-3/12">
					<span class="block font-bold lg:hidden">Notes</span>
					{restriction.notes}
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
