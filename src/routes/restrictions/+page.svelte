<script lang="ts">
	import RestrictionRow from './RestrictionRow.svelte';
	import { restrictionFilters } from '$lib/state.svelte';

	const { data } = $props();

	// Convert restrictions into a map of airports with restrictions
	let restrictions = $derived.by(() => {
		const map = new Map();
		data.restrictions.forEach((restriction: any) => {
			const airport = restriction.airport;
			if (!map.has(airport)) {
				map.set(airport, []);
			}

			if (restrictionFilters.areas.length === 0
				|| (restrictionFilters.areas.includes(restriction.to)
					|| restrictionFilters.areas.includes(restriction.from))) {
				map.get(airport).push(restriction);
			}
		});

		// Filter out any airports with no restrictions
		map.forEach((restrictions, airport) => {
			if (restrictions.length === 0) {
				map.delete(airport);
			}
		});

		return map;
	});

	const areas = [
		'Area 1',
		'Area 2',
		'Area 3',
		'Area 4',
		'Area 5',
		'Area 6',
		'Area 7'
	];

	function toggleAreaFilter(area: string) {
		if (restrictionFilters.areas.includes(area)) {
			restrictionFilters.areas = restrictionFilters.areas.filter(a => a !== area);
		} else {
			restrictionFilters.areas.push(area);
		}
	}
</script>

<svelte:head>
	<title>ICCT - Restrictions</title>
</svelte:head>
<h2>Filters</h2>
<div class="flex gap-2">
	{#each areas.filter((a) => a && a.includes('Area')) as area}
		<button class="px-2 py-1 rounded-md border border-b-zinc-200"
						class:bg-zinc-200={restrictionFilters.areas.includes(area)}
						onclick="{() => toggleAreaFilter(area)}">{area}</button>
	{/each}
</div>
<div class="w-full">
	{#each restrictions as [airport, r]}
		<div class="w-full flex mb-2 p-2">
			<div class="w-32 text-left mr-4 font-medium border rounded-md p-2 bg-gray-700 text-white">{airport}</div>
			<div class="flex-grow flex flex-col">
				<div class="flex border-b border-b-zinc-400 font-medium">
					<div class="w-5/12">Route</div>
					<div class="w-1/12">From</div>
					<div class="w-1/12">To</div>
					<div class="w-3/12">Restriction</div>
					<div class="w-2/12">Notes</div>
				</div>
				{#each r as restriction}
					<RestrictionRow {restriction} />
				{/each}
			</div>
		</div>
	{/each}
</div>