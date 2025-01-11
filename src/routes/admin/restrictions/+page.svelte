<script lang="ts">
	import MdiContentSave from 'virtual:icons/mdi/content-save';
	import MdiPencil from 'virtual:icons/mdi/pencil';
	import MdiPencilOff from 'virtual:icons/mdi/pencil-off';
	import MdiDelete from 'virtual:icons/mdi/delete';
	import MdiPlusThick from 'virtual:icons/mdi/plus-thick';
	import MdiChartGantt from 'virtual:icons/mdi/chart-gantt';

	let { data } = $props();

	// Track which row is being edited
	let editingRow: string | null = $state(null);

	// Track if a row is being added
	let addingRow: boolean = $state(false);

	// Search query for filtering areas
	let searchQuery = $state('');

	// Filtered restrictions derived from the search query
	let filteredRestrictions = $derived.by(() => {
		return data.restrictions.filter((r) => {
			if (searchQuery !== '') {
				return `${r.airport} ${r.route} ${r.priority} ${r.from} ${r.restriction} ${r.to}`
					.toLowerCase()
					.includes(searchQuery.toLowerCase());
			}
			return true; // Return all areas if no search query
		});
	});
</script>

<svelte:head>
	<title>ICCT - Restrictions Management</title>
</svelte:head>

<h1 class="mb-2 text-2xl font-bold text-zinc-800">Restriction Management</h1>
<!-- Search Box -->
<div class="mb-4 flex gap-2">
	<input
		type="text"
		placeholder="Search by airport, route, or area"
		bind:value={searchQuery}
		class="w-full rounded-md border border-zinc-400 p-2 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
	/>
	
	<div class="flex gap-2 items-center justify-end rounded-md border border-zinc-400 p-2">
		<span class='text-nowrap'>New Restriction</span>
		<button
			type="button"
			class="text-md rounded bg-green-500 p-2 text-white hover:bg-green-600 focus:ring focus:ring-green-300"
			onclick={() => (addingRow = true)}
		>
			<MdiPlusThick />
		</button>
	</div>
</div>

<!-- Header -->
<div class="hidden items-center p-4 font-semibold text-zinc-800 md:grid lg:grid-cols-9">
	<div>Airport</div>
	<div>Route</div>
	<div>Priority</div>
	<div>From</div>
	<div>Restriction</div>
	<div>To</div>
	<div>Notes</div>
	<div>Validity</div>
	<div>Actions</div>
</div>
<div class="divide-y divide-zinc-300 rounded-md border border-zinc-300">

	{#if addingRow}
		Adding a Row
	{/if}

	{#each filteredRestrictions as restriction (restriction.id)}
		<div class="flex grid-cols-5 flex-col items-start gap-1 p-2 md:grid lg:grid-cols-9 lg:p-4">
			<div class="hidden">{restriction.id}</div>
			<div>{restriction.airport}</div>
			<div>{restriction.route}</div>
			<div>{restriction.priority}</div>
			<div>{restriction.from}</div>
			<div>{restriction.restriction}</div>
			<div>{restriction.to}</div>
			<div>{restriction.notes}</div>
			<MdiChartGantt />
			<div class='hidden'>{restriction.validAt} - {restriction.validUntil}</div>
		</div>
		
	{/each}
</div>
<!-- To Do -->
<!-- Add a form for adding a new restriction -->	
<!-- Add a form for editing a restriction -->
<!-- Add a form for deleting a restriction -->
 