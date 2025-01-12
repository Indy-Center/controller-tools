<script lang="ts">
	import MdiPencil from 'virtual:icons/mdi/pencil';
	import MdiDelete from 'virtual:icons/mdi/delete';
	import MdiPlusThick from 'virtual:icons/mdi/plus-thick';
	import AddUpdateRestrictionForm from './AddUpdateRestrictionForm.svelte';

	let { data } = $props();

	let restrictionForm: ReturnType<typeof AddUpdateRestrictionForm>;

	// Search query for filtering restrictions
	let searchQuery = $state('');

	// Filtered restrictions derived from the search query
	let filteredRestrictions = $derived.by(() => {
		return data.restrictions.filter((r) => {
			if (searchQuery !== '') {
				return `${r.airport} ${r.route} ${r.priority} ${r.from} ${r.restriction} ${r.to}`
					.toLowerCase()
					.includes(searchQuery.toLowerCase());
			}
			return true; // Return all restrictions if no search query
		});
	});
</script>

<svelte:head>
	<title>ICCT - Restrictions Management</title>
</svelte:head>

<AddUpdateRestrictionForm {data} areas={data.areas} bind:this={restrictionForm} />

<h1 class="mb-4 text-2xl font-bold text-zinc-800">Restrictions Management</h1>

<!-- Search Box -->
<div class="mb-4 flex flex-col gap-2">
	<input
		type="text"
		placeholder="Search by airport, route, or priority"
		bind:value={searchQuery}
		class="w-full rounded-md border border-zinc-400 p-2 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
	/>
	<button
		class="flex items-center justify-center rounded bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600 focus:ring focus:ring-green-300"
		onclick={() => restrictionForm.create()}
	>
		<MdiPlusThick class="mr-2" />
		Add Restriction
	</button>
</div>

<!-- Header Row -->
<div class="hidden grid-cols-5 items-center p-4 font-semibold text-zinc-800 md:grid lg:grid-cols-10">
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

<!-- Restrictions List -->
<div class="divide-y divide-zinc-300 rounded-md border border-zinc-300">
	{#each filteredRestrictions as restriction (restriction.id)}
		<div class="flex grid-cols-5 flex-col items-start gap-1 p-2 md:grid lg:grid-cols-10 lg:p-4">
			<!-- Static Row -->
			<div class="font-bold">{restriction.airport}</div>
			<div>{restriction.route}</div>
			<div>{restriction.priority}</div>
			<div>{restriction.from}</div>
			<div>{restriction.restriction}</div>
			<div>{restriction.to}</div>
			<div>{restriction.notes}</div>
			<div>{restriction.validAt || 'N/A'}</div>
			<div class="flex space-x-2">
				<!-- Edit Button -->
				<button
					type="button"
					class="text-md rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:ring focus:ring-blue-300"
					onclick={() => restrictionForm.edit(restriction)}
				>
					<MdiPencil />
				</button>
				<!-- Delete Button -->
				<form method="post" action="?/delete">
					<input type="hidden" name="id" value={restriction.id} />
					<button
						type="submit"
						class="text-md rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
					>
						<MdiDelete />
					</button>
				</form>
			</div>
		</div>
	{/each}
</div>