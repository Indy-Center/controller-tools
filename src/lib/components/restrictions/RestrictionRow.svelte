<script lang="ts">
	import AreaBadge from './AreaBadge.svelte';
	import type { Restriction } from '$lib/db/schema';
	import { restrictionFilters, restrictionConfig } from '$lib/state.svelte';
	import Notes from './Notes.svelte';

	let {
		route,
		restrictions,
		splits
	}: { route: string; restrictions: Restriction[]; splits: any[] } = $props();

	let splitOptions = $derived.by(() => {
		return splits.map((split) => ({
			value: split.split.id,
			label: split.split.name
		}));
	});

	let activeSplit = $derived.by(() => {
		if (!restrictionFilters.selectedSplit) return undefined;
		return splits.find((s) => s.split.id === restrictionFilters.selectedSplit);
	});

	function getAreaColor(areaId: string) {
		if (!activeSplit) return undefined;

		for (const { group, areas } of activeSplit.groups) {
			if (areas.includes(areaId)) {
				return group.color;
			}
		}

		return undefined;
	}
</script>

<div
	class="flex flex-col rounded-md p-2 odd:bg-surface-secondary md:flex-row lg:gap-0 odd:dark:bg-surface-dark-secondary"
>
	<!-- Route Header -->
	<div class="flex flex-col pb-1 md:w-4/6 lg:w-4/12">
		<span class="block font-light text-content-secondary lg:hidden dark:text-content-dark-secondary"
			>Route</span
		>
		<span class="text-content dark:text-content-dark">{route}</span>
	</div>

	<!-- Restrictions Data -->
	<div class="flex flex-col gap-4 md:w-5/6 lg:w-8/12">
		{#each restrictions as restriction}
			<div
				class="flex flex-col border-zinc-200 pb-4 last:pb-0 md:gap-1 lg:flex-row lg:gap-0"
				class:incoming={$restrictionConfig.includeIncoming &&
					restrictionFilters.areas.includes(restriction.to?.id) &&
					$restrictionConfig.dimIncoming}
			>
				<!-- sectors -->
				<div class="flex gap-2 lg:w-1/4">
					<!-- From Header -->
					<div class="flex w-full flex-col justify-center lg:justify-start">
						{#if restriction.from}
							<span
								class="block font-light text-content-secondary lg:hidden dark:text-content-dark-secondary"
								>From</span
							>
							{#key restrictionFilters.selectedSplit}
								<AreaBadge
									label={restriction.from.id}
									color={getAreaColor(restriction.from.id) || restriction.from.color}
								/>
							{/key}
						{/if}
					</div>

					<!-- To Header -->
					<div class="flex w-full flex-col justify-center lg:justify-start">
						{#if restriction.to}
							<span
								class="block font-light text-content-secondary lg:hidden dark:text-content-dark-secondary"
								>To</span
							>
							{#key restrictionFilters.selectedSplit}
								<AreaBadge
									label={restriction.to.id}
									color={getAreaColor(restriction.to.id) || restriction.to.color}
								/>
							{/key}
						{/if}
					</div>
				</div>

				<!-- Restriction Header -->
				<div class="flex w-full flex-col justify-center lg:w-1/3 lg:justify-start lg:px-4">
					<span
						class="block font-light text-content-secondary lg:hidden dark:text-content-dark-secondary"
						>Restriction</span
					>
					<span class="text-content dark:text-content-dark"
						>{restriction.restriction || 'Route only'}</span
					>
				</div>

				<!-- Notes Header -->
				<div class="flex w-full flex-col justify-center lg:w-1/3 lg:justify-start">
					{#if restriction.notes}
						<span
							class="block font-light text-content-secondary lg:hidden dark:text-content-dark-secondary"
							>Notes</span
						>
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
		@apply opacity-70;
	}

	/* Apply opacity to `.incoming` only if the parent does not match the above condition */
	div:not(:has(:only-child.incoming)) .incoming {
		@apply opacity-70;
	}
</style>
