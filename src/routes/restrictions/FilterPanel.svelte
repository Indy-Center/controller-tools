<script lang="ts">
	import { restrictionFilters } from '$lib/state.svelte.js';
	import MdiFilterCogOutline from 'virtual:icons/mdi/filter-cog-outline';

	let { areaMap }: { areaMap: Map<string, { id: string; label: string }[]> } = $props();

	//state and a setter for the filters config popup
	let drawerOpen = $state(false);

	function toggleAreaFilter(area: string) {
		if (restrictionFilters.areas.includes(area)) {
			restrictionFilters.areas = restrictionFilters.areas.filter((a) => a !== area);
		} else {
			restrictionFilters.areas.push(area);
		}
	}

	//state and setter to shadow the sticky controls when scrolled
	let isScrolled = $state(false);

	function handleScroll() {
		isScrolled = window.scrollY > 0;
	}
</script>

<svelte:window onscroll={handleScroll} />
<div class="bg sticky top-0 px-1 pb-2" class:scrolled={isScrolled}>
	<div class="rounded-m relative flex w-full flex-col">
		<!-- Filter Header -->
		<div class="my-2 flex gap-1">
			<input
				type="text"
				id="filter"
				class="w-full rounded-md border border-zinc-300 p-3 text-zinc-700"
				placeholder="Search for Airport..."
				bind:value={restrictionFilters.airport}
			/>
		</div>

		<!-- Quick  Controls -->
		<div class="flex justify-center">
			<div class="mr-auto flex flex-col gap-2">
				<label for="includeIncoming" class="pl-2 text-sm">
					<input
						type="checkbox"
						id="includeIncoming"
						bind:checked={restrictionFilters.includeIncoming}
					/>
					Include Incoming Restrictions</label
				>
				<label for="dimIncoming" class="pl-2 text-sm">
					<input type="checkbox" id="dimIncoming" />
					Dim Incoming Restrictions</label
				>
			</div>
			<button
				id="filterSlider"
				class="mr-2 rounded-md border p-1 text-3xl hover:bg-zinc-200 active:bg-zinc-300"
				onclick={() => (drawerOpen = !drawerOpen)}><MdiFilterCogOutline /></button
			>
		</div>
		<div
			class:scale-y-100={drawerOpen}
			class="bg absolute top-full z-40 flex origin-top scale-y-0 flex-col overflow-hidden rounded-b-md px-1 pb-2 shadow-md transition-all"
		>
			<h2 class="text pt-2 text-sm">Select the areas you are responsible for:</h2>
			{#each areaMap as [category, areas]}
				<h2 class="py-1 text-lg font-medium">
					{category.charAt(0).toUpperCase() + category.slice(1)}
				</h2>
				<div class="flex flex-wrap gap-2">
					{#each areas as area}
						<button
							class="rounded-md border p-1 text-sm"
							class:bg-zinc-200={restrictionFilters.areas.includes(area.id)}
							class:dark:bg-zinc-700={restrictionFilters.areas.includes(area.id)}
							onclick={() => toggleAreaFilter(area.id)}>{area.label}</button
						>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.scrolled {
		@apply rounded-b-md shadow-md;
	}
</style>
