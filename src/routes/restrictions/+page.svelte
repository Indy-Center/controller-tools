<script lang="ts">
	import RestrictionRow from '$lib/RestrictionRow.svelte';

	const { data } = $props();

	// Convert restrictions into a map of airports with restrictions
	let restrictions = $derived.by(() => {
		const map = new Map();
		data.restrictions.forEach((restriction: any) => {
			const airport = restriction.airport;
			if (!map.has(airport)) {
				map.set(airport, []);
			}

			map.get(airport).push(restriction);
		});

		return map;
	});
</script>

<svelte:head>
	<title>ICCT - Restrictions</title>
</svelte:head>

<div class="w-full">
	{#each restrictions as [airport, r]}
		<div class="w-full flex mb-2 p-2">
			<div class="text-left mr-4 font-medium border rounded-md p-2 bg-gray-700 text-white">{airport}</div>
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