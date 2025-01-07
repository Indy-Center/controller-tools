<script lang="ts">
	import AreaBadge from './AreaBadge.svelte';
	import type { Restriction } from '$lib/db/schema';
	import { restrictionFilters } from '$lib/state.svelte';
	import Notes from './Notes.svelte';

	let { route, restrictions }: { route: string; restrictions: Restriction[] } = $props();
</script>

<div class="flex flex-col rounded-md px-1 pb-2 odd:bg-zinc-200 dark:odd:bg-zinc-700">
	<!-- Route Header -->
	<div class="flex w-full flex-col pb-2">
		<span class="block font-light">Route</span>
		{route || 'All Routes'}
	</div>

	<!-- Restrictions Data -->
	<div class="flex flex-grow flex-col">
		{#each restrictions as restriction}
			<div
				class="flex flex-col border-zinc-200 pb-4 last:pb-0"
				class:incoming={restrictionFilters.includeIncoming &&
					restrictionFilters.areas.includes(restriction.to.id) &&
					restrictionFilters.dimIncoming}
			>
				<!-- sectors -->
				<div class="flex gap-2">
					<!-- From Header -->
					<div class="flex w-full flex-col justify-center">
						{#if restriction.from}
							<span class="block font-light">From</span>
							<AreaBadge label={restriction.from.id} />
						{/if}
					</div>

					<!-- To Header -->
					<div class="flex w-full flex-col justify-center">
						{#if restriction.to}
							<span class="block font-light">To</span>
							<AreaBadge label={restriction.to.id} />
						{/if}
					</div>
				</div>

				<!-- Restriction Header -->
				<div class="flex w-full flex-col justify-center">
					<span class="block font-light">Restriction</span>
					{restriction.restriction || 'Route only'}
				</div>

				<!-- Notes Header -->
				<div class="flex w-full flex-col justify-center">
					{#if restriction.notes}
						<span class="block font-light">Notes</span>
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

	.after-line:not(:last-child)::after {
		content: '';
		display: block;
		border-bottom: 2px solid #a1a1aa;
		border-radius: 2%;
		width: 80%;
		margin-right: auto;
		margin-left: auto;
		padding: 0.25rem;
	}
</style>
