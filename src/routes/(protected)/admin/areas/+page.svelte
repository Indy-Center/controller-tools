<script lang="ts">
	import MdiPencil from 'virtual:icons/mdi/pencil';
	import MdiDelete from 'virtual:icons/mdi/delete';
	import AddUpdateAreaForm from './AddUpdateAreaForm.svelte';
	import MdiPlusThick from 'virtual:icons/mdi/plus-thick';

	let { data } = $props();

	let addUpdateAreaForm: ReturnType<typeof AddUpdateAreaForm>;

	// Search query for filtering areas
	let searchQuery = $state('');

	// Filtered areas derived from the search query
	let filteredAreas = $derived.by(() => {
		return data.areas.filter((a) => {
			if (searchQuery !== '') {
				return `${a.short} ${a.long} ${a.id} ${a.category}`
					.toLowerCase()
					.includes(searchQuery.toLowerCase());
			}
			return true; // Return all areas if no search query
		});
	});
</script>

<svelte:head>
	<title>ICCT - Area Management</title>
</svelte:head>

<AddUpdateAreaForm bind:this={addUpdateAreaForm} {data} />

<h1 class="mb-4 text-2xl font-bold text-zinc-800">Area Management</h1>

<!-- Search Box -->
<div class="mb-4 flex flex-col gap-2">
	<input
		type="text"
		placeholder="Search by ID, name, or category"
		bind:value={searchQuery}
		class="w-full rounded-md border border-zinc-400 p-2 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
	/>
	<button
		class="flex items-center justify-center rounded bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600 focus:ring focus:ring-green-300"
		onclick={() => addUpdateAreaForm.create()}
	>
		<MdiPlusThick class="mr-2" />
		Add Area
	</button>
</div>

<!-- Header Row -->
<div class="hidden grid-cols-5 items-center p-4 font-semibold text-zinc-800 md:grid lg:grid-cols-6">
	<div>ID</div>
	<div>Short Name</div>
	<div class="md:hidden lg:block">Long Name</div>
	<div>Category</div>
	<div>Color</div>
	<div>Actions</div>
</div>

<!-- Areas List -->
<div class="divide-y divide-zinc-300 rounded-md border border-zinc-300">
	{#each filteredAreas as area}
		<div class="flex grid-cols-5 flex-col items-start gap-1 p-2 md:grid lg:grid-cols-6 lg:p-4">
			<!-- Static Row -->
			<div class="font-bold">
				{area.id}
			</div>
			<div><span class="font-thin md:hidden">Short Name:{' '}</span>{area.short}</div>
			<div class="md:hidden lg:block">
				<span class="font-thin md:hidden">Long Name:{' '}</span>{area.long}
			</div>
			<div><span class="font-thin md:hidden">Category:{' '}</span>{area.category}</div>
			<div class="justify-content-middle flex gap-1">
				<span class="font-thin md:hidden">Color: {' '}</span>
				<div
					class="size-8 border border-zinc-400 md:size-10 lg:size-12"
					style="background-color: {area.color};"
				></div>
			</div>
			<div class="flex space-x-2">

				<button
					type="button"
					class="text-md rounded bg-blue-500 p-2 text-white hover:bg-blue-600 focus:ring focus:ring-blue-300"
					onclick={() => (addUpdateAreaForm.edit(area))}
				>
					<MdiPencil />
				</button>
				<form
					method="post"
					action="?/delete"
				>
					<input type="hidden" name="id" value={area.id} />
					<button
						type="submit"
						class="text-md rounded bg-red-500 p-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
					>
						<MdiDelete />
					</button>
				</form>
			</div>
		</div>
	{/each}
</div>
