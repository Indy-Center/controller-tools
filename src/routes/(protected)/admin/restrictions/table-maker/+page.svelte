<script lang="ts">
	import type { Restriction } from '$lib/db/schema';
	import MdiAirplane from 'virtual:icons/mdi/airplane';
	import MdiAirplaneTakeoff from 'virtual:icons/mdi/airplane-takeoff';
	import MdiAirplaneLanding from 'virtual:icons/mdi/airplane-landing';

	let { data } = $props();

	let showRawHTMLTables = $state(false);
	let area = $state('');
	let arrivalSelections = $state([]);
	let departureSelections = $state([]);
	let overflightSelections = $state([]);

	let filteredRestrictions = $derived.by(() => {
		if (!area) return data.restrictions;

		const lowerCaseArea = area.toLowerCase();
		return data.restrictions.filter(
			(r) =>
				r.from.toLowerCase().includes(lowerCaseArea) || r.to.toLowerCase().includes(lowerCaseArea)
		);
	});

	let areaPairTables = $derived.by(() => {
		if (!area) return [];

		const pairs = new Map<string, Restriction[]>(); //make an array of paired restrictions for the table generator
		filteredRestrictions.forEach((r) => {
			const from = r.from;
			const to = r.to;
			const pairKey = `${from}:${to}`; //the : is for naming them later

			if (!pairs.has(pairKey)) {
				pairs.set(pairKey, []);
			}
			pairs.get(pairKey)?.push(r);
		});

		return Array.from(pairs.entries()).map(([pairKey, restrictions]) => ({
			pair: pairKey,
			restrictions
		}));
	});

	// Generate raw HTML tables for later
	function generateHTMLTable(data: Restriction[]): string {
		if (!data || data.length === 0) return 'No data';

		return `<table>
	<thead>
		<tr>
			<th>Airport</th>
			<th>From</th>
			<th>To</th>
			<th>Restriction</th>
			<th>Notes</th>
		</tr>
	</thead>
	<tbody>
		${data
			.map(
				(r) => `<tr>
			<td>${r.airport}</td>
	<td>${r.from}</td>
			<td>${r.to}</td>
			<td>${r.restriction}</td>
			<td>${r.notes || ''}</td>
		</tr>`
			)
			.join('')}
	</tbody>
</table>`;
	}

	//generate the whole body of raw html
	function generateRawHTML(): string {
		const arrivalsHTML =
			`<h3 class="is-collapsible">Arrivals</h3>` + generateHTMLTable(arrivalSelections);
		const departuresHTML =
			`<h3 class="is-collapsible">Departures</h3>` + generateHTMLTable(departureSelections);
		const overflightsHTML =
			`<h3 class="is-collapsible">Overflights</h3>` + generateHTMLTable(overflightSelections);

		const areaPairsHTML = areaPairTables
			.map(
				(table) =>
					`<h3 class="is-collapsible">${table.pair}</h3>` + generateHTMLTable(table.restrictions)
			)
			.join('');

		return `<h2 class="is-collapsible">Terminal Summary</h2>
	${arrivalsHTML}
	${departuresHTML}
	${overflightsHTML}
<h2 class="is-collapsible">Facility to Facility</h2>
	${areaPairsHTML}`;
	}

	function toggleSelection(selection, row) {
		const index = selection.findIndex((r) => r.id === row.id);
		if (index === -1) {
			selection.push(row);
		} else {
			selection.splice(index, 1);
		}
	}
</script>

<h1 class="mb-2 text-2xl font-bold">Static Restrictions Table Maker</h1>

<input
	type="text"
	placeholder="Enter Area"
	bind:value={area}
	class="w-full rounded-md border border-zinc-400 p-2 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
/>

<div>
	<button
		onclick={() => (showRawHTMLTables = !showRawHTMLTables)}
		class="text-md secondary my-2 w-full rounded-md border p-1 text-white hover:bg-zinc-400 active:bg-zinc-300 dark:hover:bg-zinc-700 dark:active:bg-zinc-800"
	>
		{showRawHTMLTables ? 'Hide Raw HTML' : 'Show Raw HTML'}
	</button>

	{#if showRawHTMLTables}
		<pre
			class="overflow-x-auto rounded-md border-white bg-zinc-800 p-2 font-mono text-sm text-white">
			<code>{generateRawHTML()}</code>
		</pre>
	{/if}
</div>

<div>
	<h2 class="mb-2 text-xl font-bold">Restrictions to/from selected area</h2>
	<table class="w-full">
		<thead>
			<tr class="text-left">
				<th>Airport</th>
				<th>From</th>
				<th>To</th>
				<th>Restriction</th>
				<th>Notes</th>
				<th><MdiAirplaneTakeoff /></th>
				<th><MdiAirplane /></th>
				<th><MdiAirplaneLanding /></th>
			</tr>
		</thead>
		<tbody>
			{#each filteredRestrictions as r (r.id)}
				<tr class="odd:bg-gray-200">
					<td class="text-nowrap p-2 align-middle">{r.airport}</td>
					<td class="text-nowrap p-2">{r.from}</td>
					<td class="text-nowrap p-2">{r.to}</td>
					<td class="p-2">{r.restriction}</td>
					<td class="p-2">{r.notes || ''}</td>
					<td>
						<input type="checkbox" onchange={() => toggleSelection(arrivalSelections, r)} />
					</td>
					<td>
						<input type="checkbox" onchange={() => toggleSelection(overflightSelections, r)} />
					</td>
					<td>
						<input type="checkbox" onchange={() => toggleSelection(departureSelections, r)} />
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
