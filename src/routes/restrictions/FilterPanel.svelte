<script lang="ts">
	import { restrictionFilters } from '$lib/state.svelte.js';

	let { areaMap }: { areaMap: Map<string, { id: string, label: string }[]> } = $props();

	function toggleAreaFilter(area: string) {
		if (restrictionFilters.areas.includes(area)) {
			restrictionFilters.areas = restrictionFilters.areas.filter(a => a !== area);
		} else {
			restrictionFilters.areas.push(area);
		}
	}
</script>
<div class="rounded-md lg:border lg:p-4 lg:dark:border-zinc-700 flex flex-col">
	<div class="py-2 lg:px-2">
		<input type="text" id="filter"
					 class="w-full rounded-md border border-zinc-300 p-3 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
					 placeholder="Search for Airport..." bind:value={restrictionFilters.airport}>
	</div>
	<div class="flex flex-col lg:p-2">
		{#each areaMap as [category, areas]}
			<h2 class="text-lg font-medium">{category}</h2>
			<div class="flex gap-2">
				{#each areas as area}
					<button
						class="px-1 lg:px-2 py-1 text-sm lg:text-base rounded-md border dark:border-zinc-700 dark:text-zinc-200"
						class:bg-zinc-200={restrictionFilters.areas.includes(area.id)}
						class:dark:bg-zinc-700={restrictionFilters.areas.includes(area.id)}
						onclick="{() => toggleAreaFilter(area.id)}">{area.label}</button>
				{/each}
			</div>
		{/each}
	</div>
	<div class="flex py-2 lg:px-2">
		<input type="checkbox" id="includeIncoming" bind:checked={restrictionFilters.includeIncoming}>
		<label for="includeIncoming" class="text-sm pl-2">Include Incoming Restrictions</label>
	</div>
</div>