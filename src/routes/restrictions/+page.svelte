<script lang="ts">
	import { restrictionFilters, restrictionConfig } from '$lib/state.svelte';
	import RestrictionSection from '$lib/components/restrictions/RestrictionSection.svelte';
	import FilterPanel from '$lib/components/restrictions/FilterPanel.svelte';
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
			const searchIsEmpty = restrictionFilters.search === '';
			const isFromSelectedArea = restrictionFilters.areas.includes(restriction?.from?.id ?? '');
			const isToSelectedArea = restrictionFilters.areas.includes(restriction?.to?.id ?? '');

			const areaMatches =
				// Include routes from selected areas if:
				// - hideInternal is false OR
				// - the destination is not another selected area
				(isFromSelectedArea && (!$restrictionConfig.hideInternal || !isToSelectedArea)) ||
				// Include routes to selected areas if:
				// - includeIncoming is true AND
				// - hideInternal is false OR the origin is not another selected area
				($restrictionConfig.includeIncoming &&
					isToSelectedArea &&
					(!$restrictionConfig.hideInternal || !isFromSelectedArea));

			const searchMatches =
				restriction.airport?.toLowerCase().includes(restrictionFilters.search.toLowerCase()) ||
				restriction.route?.toLowerCase().includes(restrictionFilters.search.toLowerCase());

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

	function sortAreas(a, b) {
		const extractNumber = (str) => {
			const match = str.match(/\d+/);
			return match ? parseInt(match[0], 10) : null;
		};

		const aNumber = extractNumber(a.label);
		const bNumber = extractNumber(b.label);

		if (aNumber !== null && bNumber !== null) {
			// Both labels contain numbers; sort numerically
			return aNumber - bNumber;
		} else if (aNumber !== null) {
			// Only 'a' contains a number; it should come first
			return -1;
		} else if (bNumber !== null) {
			// Only 'b' contains a number; it should come first
			return 1;
		} else {
			// Neither label contains a number; sort alphabetically
			return a.label.localeCompare(b.label);
		}
	}

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

		areas.forEach((areaList) => {
			areaList.sort(sortAreas);
		});

		return areas;
	});
</script>

<svelte:head>
	<title>ICT - Restrictions</title>
</svelte:head>
<div class="w-full lg:mx-auto lg:max-w-screen-2xl">
	<FilterPanel areaMap={filterAreaMap} />
	<div class="pl-1 pr-1">
		{#each restrictions as [airport, r]}
			<RestrictionSection {airport} restrictions={r} />
		{/each}
	</div>
</div>
