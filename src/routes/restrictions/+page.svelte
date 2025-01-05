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
			const fromCategory = restriction.from?.category?.toLowerCase();
			const toCategory = restriction.to?.category?.toLowerCase();

			if (fromCategory === 'terminal' || fromCategory === 'center') {
				if (!areas.has(fromCategory)) {
					areas.set(fromCategory, []);
				}

				const fromAreaExists = areas.get(fromCategory)!.some((a) => a.id === restriction.from!.id);

				if (!fromAreaExists) {
					areas.get(fromCategory)!.push({
						id: restriction.from!.id,
						label: restriction.from!.short
					});
				}
			}

			if (toCategory === 'terminal' || toCategory === 'center') {
				if (!areas.has(toCategory)) {
					areas.set(toCategory, []);
				}

				const toAreaExists = areas.get(toCategory)!.some((a) => a.id === restriction.to!.id);

				if (!toAreaExists) {
					areas.get(toCategory)!.push({
						id: restriction.to!.id,
						label: restriction.to!.short
					});
				}
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
