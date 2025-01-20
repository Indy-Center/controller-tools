<script lang="ts">
	import MdiPencil from 'virtual:icons/mdi/pencil';
	import MdiDelete from 'virtual:icons/mdi/delete';
	import AddUpdateAreaForm from './AddUpdateAreaForm.svelte';
	import MdiPlusThick from 'virtual:icons/mdi/plus-thick';
	import ConfirmationModal from '$lib/ConfirmationModal.svelte';

	let { data } = $props();

	let addUpdateAreaForm: ReturnType<typeof AddUpdateAreaForm>;

	let confirmModal: ReturnType<typeof ConfirmationModal>;

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
<ConfirmationModal
	bind:this={confirmModal}
	action="?/delete"
	message="Are you sure you want to delete this area? This action cannot be undone."
/>

<h1 class="text-content dark:text-content-dark mb-4 text-2xl font-bold">Area Management</h1>

<!-- Search Box -->
<div class="mb-4 flex flex-col gap-2">
	<input
		type="text"
		placeholder="Search by ID, name, or category"
		bind:value={searchQuery}
		class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface dark:bg-surface-dark text-content dark:text-content-dark placeholder:text-content-tertiary dark:placeholder:text-content-dark-tertiary focus:border-accent focus:ring-accent/20 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
	/>
	<button
		class="bg-action-success flex items-center justify-center rounded px-4 py-2 text-sm text-white hover:bg-green-600 focus:ring focus:ring-green-300"
		onclick={() => addUpdateAreaForm.create()}
	>
		<MdiPlusThick class="mr-2" />
		Add Area
	</button>
</div>

<!-- Header Row -->
<div
	class="text-content dark:text-content-dark hidden grid-cols-5 items-center p-4 font-semibold md:grid lg:grid-cols-6"
>
	<div>ID</div>
	<div>Short Name</div>
	<div class="md:hidden lg:block">Long Name</div>
	<div>Category</div>
	<div>Color</div>
	<div>Actions</div>
</div>

<!-- Areas List -->
<div
	class="divide-surface-tertiary dark:divide-surface-dark-tertiary border-surface-tertiary dark:border-surface-dark-tertiary divide-y rounded-md border"
>
	{#each filteredAreas as area}
		<div
			class="bg-surface dark:bg-surface-dark flex grid-cols-5 flex-col items-start gap-1 p-2 md:grid lg:grid-cols-6 lg:p-4"
		>
			<!-- Static Row -->
			<div class="text-content dark:text-content-dark font-bold">
				{area.id}
			</div>
			<div class="text-content dark:text-content-dark">
				<span class="text-content-secondary dark:text-content-dark-secondary font-thin md:hidden"
					>Short Name:{' '}</span
				>
				{area.short}
			</div>
			<div class="text-content dark:text-content-dark md:hidden lg:block">
				<span class="text-content-secondary dark:text-content-dark-secondary font-thin md:hidden"
					>Long Name:{' '}</span
				>
				{area.long}
			</div>
			<div class="text-content dark:text-content-dark">
				<span class="text-content-secondary dark:text-content-dark-secondary font-thin md:hidden"
					>Category:{' '}</span
				>
				{area.category}
			</div>
			<div class="justify-content-middle flex gap-1">
				<span class="text-content-secondary dark:text-content-dark-secondary font-thin md:hidden"
					>Color: {' '}</span
				>
				<div
					class="border-surface-tertiary dark:border-surface-dark-tertiary size-8 border md:size-10 lg:size-12"
					style="background-color: {area.color};"
				></div>
			</div>
			<div class="flex space-x-2">
				<button
					type="button"
					class="text-md bg-action-primary rounded p-2 text-white hover:bg-sky-600 focus:ring focus:ring-sky-300"
					onclick={() => addUpdateAreaForm.edit(area)}
				>
					<MdiPencil />
				</button>
				<button
					onclick={() => confirmModal.prompt({ id: area.id })}
					class="text-md bg-action-danger rounded p-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
				>
					<MdiDelete />
				</button>
			</div>
		</div>
	{/each}
</div>
