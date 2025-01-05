<script lang="ts">
	import { restrictionFilters } from '$lib/state.svelte';
	import RestrictionSection from './RestrictionSection.svelte';
	import FilterPanel from './FilterPanel.svelte';
	import type { Restriction } from '$lib/db/schema';

	const { data }: { data: { restrictions: Restriction[] } } = $props();

	// Convert restrictions into a map of airports with restrictions
	let restrictions = $derived.by(() => {
		const map = new Map<string, Restriction[]>();
		data.restrictions.forEach((restriction: Restriction) => {
			const airport = restriction.airport;
			if (!map.has(airport)) {
				map.set(airport, []);
			}

			const noAreaSelected = restrictionFilters.areas.length === 0;
			const searchIsEmpty = restrictionFilters.airport === '';
			const areaMatches =
				restrictionFilters.areas.includes(restriction?.from?.id ?? '') ||
				(restrictionFilters.includeIncoming &&
					restrictionFilters.areas.includes(restriction?.to?.id ?? ''));
			const searchMatches = restriction.airport
				?.toLowerCase()
				.includes(restrictionFilters.airport.toLowerCase());

			const isAreaMatch = noAreaSelected || areaMatches;
			const isSearchMatch = searchMatches || searchIsEmpty;

			if (isAreaMatch && isSearchMatch) {
				map.get(airport)!.push(restriction);
			}
		});

		// Filter out any airports with no restrictions
		map.forEach((restrictions: Restriction[], airport: string) => {
			if (restrictions.length === 0) {
				map.delete(airport);
			}
		});

		return map;
	});

	let filterAreaMap = $derived.by(() => {
		const areas = new Map<string, { id: string; label: string }[]>();
		data.restrictions.forEach((restriction: Restriction) => {
			if (!areas.has(restriction.from?.category)) {
				areas.set(restriction.from?.category, []);
			}

			if (!areas.has(restriction.to?.category)) {
				areas.set(restriction.to?.category, []);
			}

			if (
				restriction.from &&
				areas.get(restriction.from.category)!.find((a) => a.id === restriction.from.id) ===
					undefined
			) {
				areas
					.get(restriction.from.category)!
					.push({ id: restriction.from.id, label: restriction.from.short });
			}

			if (
				restriction.to &&
				areas.get(restriction.to.category)!.find((a) => a.id === restriction.to.id) === undefined
			) {
				areas
					.get(restriction.to.category)!
					.push({ id: restriction.to.id, label: restriction.to.short });
			}
		});

		return areas;
	});
</script>

<svelte:head>
	<title>ICCT - Restrictions</title>
</svelte:head>
<FilterPanel areaMap={filterAreaMap} />
<div class="w-full pl-1 pr-1">
	{#each restrictions as [airport, r]}
		<RestrictionSection {airport} restrictions={r} />
	{/each}
</div>
