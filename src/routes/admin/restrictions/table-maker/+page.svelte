<script lang="ts">
	import type { Restriction } from '$lib/db/schema';

	let { data } = $props();

	// State variables
	let showRawHTMLTables = $state(false);
	let area = $state('');
	let arrivalSelections = $state([]);
	let departureSelections = $state([]);
	let overflightSelections = $state([]);

	// Derived states
	let filteredRestrictions = $derived.by(() => {
		if (!area) return data.restrictions;

		const lowerCaseArea = area.toLowerCase();
		return data.restrictions.filter(
			(r) =>
				r.from.toLowerCase().includes(lowerCaseArea) ||
				r.to.toLowerCase().includes(lowerCaseArea)
		);
	});

	let areaPairTables = $derived.by(() => {
		if (!area) return [];

		const pairs = new Map<string, Restriction[]>();
		filteredRestrictions.forEach((r) => {
			const from = r.from.toLowerCase();
			const to = r.to.toLowerCase();
			const pairKey = `${from} <-> ${to}`;

			if (!pairs.has(pairKey)) {
				pairs.set(pairKey, []);
			}
			pairs.get(pairKey)?.push(r);
		});

		return Array.from(pairs.entries()).map(([pairKey, restrictions]) => ({
			pair: pairKey,
			restrictions,
		}));
	});

	let areaPairTableHTML = $derived.by(() => {
		return areaPairTables
			.map(
				(table) => `
				<h3 class="mt-4 text-xl font-semibold">Area: ${table.pair}</h3>
				${generateHTMLTable(table.restrictions)}
			`
			)
			.join('');
	});

	// Generate raw HTML table
	function generateHTMLTable(data: Restriction[]): string {
		if (!data || data.length === 0) return 'No data';

		return `
		<table>
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
						(r) => `
				<tr>
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
    <button onclick={() => showRawHTMLTables = !showRawHTMLTables}>
      {showRawHTMLTables ? 'Hide Raw HTML' : 'Show Raw HTML'}
    </button>
    
    {#if showRawHTMLTables}
      <h2>Raw HTML Tables</h2>
      <h3>Arrival Table</h3>
      <pre><code>{generateHTMLTable(arrivalSelections)}</code></pre>
      
      <h3>Departure Table</h3>
      <pre><code>{generateHTMLTable(departureSelections)}</code></pre>
      
      <h3>Overflight Table</h3>
      <pre><code>{generateHTMLTable(overflightSelections)}</code></pre>

      <h2 class="mb-2 text-2xl font-bold">Tables for Related Areas</h2>
      {#each areaPairTables as table}
				<h3 class="mt-4 text-xl font-semibold">
					{table.selectedArea}:{table.otherArea}
				</h3>
				<pre><code>{@html generateHTMLTable(table.restrictions)}</code></pre>
			{/each}
    {/if}
  </div>

<div>
	<h2 class="mb-2 text-2xl font-bold">Filtered Restrictions</h2>
	<table>
		<thead>
			<tr>
				<th>Airport</th>
				<th>From</th>
				<th>To</th>
				<th>Restriction</th>
				<th>Notes</th>
				<th>Arrival</th>
				<th>Departure</th>
				<th>Overflight</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredRestrictions as r (r.id)}
				<tr>
					<td>{r.airport}</td>
					<td>{r.from}</td>
					<td>{r.to}</td>
					<td>{r.restriction}</td>
					<td>{r.notes || ''}</td>
					<td>
						<input
							type="checkbox"
							onchange={() => toggleSelection(arrivalSelections, r)}
						/>
					</td>
					<td>
						<input
							type="checkbox"
							onchange={() => toggleSelection(departureSelections, r)}
						/>
					</td>
					<td>
						<input
							type="checkbox"
							onchange={() => toggleSelection(overflightSelections, r)}
						/>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>