<script lang="ts">
	import RestrictionRow from './RestrictionRow.svelte';
	import { restrictionFilters } from '$lib/state.svelte';
	import RestrictionSection from './RestrictionSection.svelte';
	import FilterPanel from './FilterPanel.svelte';

	const { data } = $props();

	// Convert restrictions into a map of airports with restrictions
	let restrictions = $derived.by(() => {
		const map = new Map();
		data.restrictions.forEach((restriction: any) => {
			const airport = restriction.airport;
			if (!map.has(airport)) {
				map.set(airport, []);
			}

			const noAreaSelected = restrictionFilters.areas.length === 0;
			const searchIsEmpty = restrictionFilters.airport === '';
			const areaMatches = restrictionFilters.areas.includes(restriction.from) || (restrictionFilters.includeIncoming && restrictionFilters.areas.includes(restriction.to));
			const searchMatches = restriction.airport.toLowerCase().includes(restrictionFilters.airport.toLowerCase());

			const isAreaMatch = noAreaSelected || areaMatches;
			const isSearchMatch = searchMatches || searchIsEmpty;

			if (isAreaMatch && isSearchMatch) {
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
</script>

<svelte:head>
	<title>ICCT - Restrictions</title>
</svelte:head>
<FilterPanel />
<div class="w-full">
	{#each restrictions as [airport, r]}
		<RestrictionSection {airport} restrictions={r} />
	{/each}
</div>