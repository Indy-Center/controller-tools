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
</script>

<div class="rounded-m relative flex w-full flex-col px-1">
	<!-- Filter Header -->
	<div class="flex gap-1 py-2">
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
		class="bg absolute top-full z-40 flex origin-top scale-y-0 flex-col overflow-hidden rounded-b-md px-1 pb-1 shadow-md transition-all"
	>
		{#each areaMap as [category, areas]}
			<h2 class="text-lg font-medium">{category}</h2>
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
