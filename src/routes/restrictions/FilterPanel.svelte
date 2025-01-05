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

<div class="flex flex-col rounded-md lg:border lg:p-4 lg:dark:border-zinc-700">
	<!-- Filter Header -->
	<div class="flex gap-1 py-2 lg:px-2">
		<input
			type="text"
			id="filter"
			class="w-full rounded-md border border-zinc-300 p-3 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
			placeholder="Search for Airport..."
			bind:value={restrictionFilters.airport}
		/>
	</div>

	<!-- Quick  Controls -->
	<div class="around flex justify-between px-1 py-2 lg:px-2">
		<div class="flex flex-col gap-2">
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
			class="rounded-md border p-1 text-3xl"
			onclick={() => (drawerOpen = !drawerOpen)}><MdiFilterCogOutline /></button
		>
	</div>
	<div class:hidden={!drawerOpen} class="flex max-w-full flex-col lg:p-2">
		<p class="p-4 text-center">
			Read more about this tool on the <a
				href="https://wiki.zidartcc.org/docs/"
				target="_blank"
				class="underline"
				rel="noopener noreferrer">Indy Library</a
			>.
		</p>
		{#each areaMap as [category, areas]}
			<h2 class="text-lg font-medium">{category}</h2>
			<div class="flex flex-wrap gap-2">
				{#each areas as area}
					<button
						class="rounded-md border p-1 text-sm lg:px-2 lg:text-base dark:border-zinc-700 dark:text-zinc-200"
						class:bg-zinc-200={restrictionFilters.areas.includes(area.id)}
						class:dark:bg-zinc-700={restrictionFilters.areas.includes(area.id)}
						onclick={() => toggleAreaFilter(area.id)}>{area.label}</button
					>
				{/each}
			</div>
		{/each}
	</div>
</div>
