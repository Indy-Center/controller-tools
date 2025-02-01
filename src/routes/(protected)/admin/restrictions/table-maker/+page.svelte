<script lang="ts">
	import MdiIcon from '$lib/components/MdiIcon.svelte';
	import type { Restriction } from '$lib/db/schema';

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

<div class="flex h-full w-full flex-col p-6">
	<div class="mb-6 flex flex-col gap-4">
		<h1 class="text-2xl font-bold text-content dark:text-content-dark">
			Static Restrictions Table Maker
		</h1>

		<input
			type="text"
			placeholder="Enter Area"
			bind:value={area}
			class="w-full rounded-lg border border-surface-tertiary bg-surface p-3 text-sm text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
		/>

		<div>
			<button
				onclick={() => (showRawHTMLTables = !showRawHTMLTables)}
				class="w-full rounded-md bg-surface-secondary px-4 py-2 text-sm font-medium text-content-secondary transition-all hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-surface-tertiary/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-surface-dark-tertiary"
			>
				{showRawHTMLTables ? 'Hide Raw HTML' : 'Show Raw HTML'}
			</button>

			{#if showRawHTMLTables}
				<div
					class="mt-4 overflow-x-auto rounded-lg border border-surface-tertiary bg-surface-secondary p-4 font-mono text-sm text-content dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary dark:text-content-dark"
				>
					<pre><code>{generateRawHTML()}</code></pre>
				</div>
			{/if}
		</div>

		<div class="mt-4">
			<h2 class="mb-4 text-xl font-semibold text-content dark:text-content-dark">
				Restrictions to/from selected area
			</h2>
			<div
				class="overflow-x-auto rounded-lg border border-surface-tertiary dark:border-surface-dark-tertiary"
			>
				<table class="w-full">
					<thead>
						<tr
							class="border-b border-surface-tertiary bg-surface-secondary text-left dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary"
						>
							<th class="p-4 font-medium text-content dark:text-content-dark">Airport</th>
							<th class="p-4 font-medium text-content dark:text-content-dark">From</th>
							<th class="p-4 font-medium text-content dark:text-content-dark">To</th>
							<th class="p-4 font-medium text-content dark:text-content-dark">Restriction</th>
							<th class="p-4 font-medium text-content dark:text-content-dark">Notes</th>
							<th class="p-4 text-content dark:text-content-dark"
								><MdiIcon name="airplane-takeoff" class="h-5 w-5" /></th
							>
							<th class="p-4 text-content dark:text-content-dark"
								><MdiIcon name="airplane" class="h-5 w-5" /></th
							>
							<th class="p-4 text-content dark:text-content-dark"
								><MdiIcon name="airplane-landing" class="h-5 w-5" /></th
							>
						</tr>
					</thead>
					<tbody
						class="divide-y divide-surface-tertiary bg-surface dark:divide-surface-dark-tertiary dark:bg-surface-dark"
					>
						{#each filteredRestrictions as r (r.id)}
							<tr
								class="transition-colors hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary"
							>
								<td class="whitespace-nowrap p-4 text-content dark:text-content-dark"
									>{r.airport}</td
								>
								<td class="whitespace-nowrap p-4 text-content dark:text-content-dark">{r.from}</td>
								<td class="whitespace-nowrap p-4 text-content dark:text-content-dark">{r.to}</td>
								<td class="p-4 text-content dark:text-content-dark">{r.restriction}</td>
								<td class="p-4 text-content dark:text-content-dark">{r.notes || ''}</td>
								<td class="p-4">
									<input
										type="checkbox"
										onchange={() => toggleSelection(arrivalSelections, r)}
										class="h-4 w-4 rounded border-surface-tertiary text-accent transition-colors focus:ring-accent/20 dark:border-surface-dark-tertiary dark:text-accent-dark dark:focus:ring-accent-dark/20"
									/>
								</td>
								<td class="p-4">
									<input
										type="checkbox"
										onchange={() => toggleSelection(overflightSelections, r)}
										class="h-4 w-4 rounded border-surface-tertiary text-accent transition-colors focus:ring-accent/20 dark:border-surface-dark-tertiary dark:text-accent-dark dark:focus:ring-accent-dark/20"
									/>
								</td>
								<td class="p-4">
									<input
										type="checkbox"
										onchange={() => toggleSelection(departureSelections, r)}
										class="h-4 w-4 rounded border-surface-tertiary text-accent transition-colors focus:ring-accent/20 dark:border-surface-dark-tertiary dark:text-accent-dark dark:focus:ring-accent-dark/20"
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
