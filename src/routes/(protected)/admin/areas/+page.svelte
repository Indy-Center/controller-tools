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
	<title>ICT - Area Management</title>
</svelte:head>

<AddUpdateAreaForm bind:this={addUpdateAreaForm} {data} />
<ConfirmationModal
	bind:this={confirmModal}
	action="?/delete"
	message="Are you sure you want to delete this area? This action cannot be undone."
/>

<h1 class="mb-4 text-2xl font-bold text-content dark:text-content-dark">Area Management</h1>

<!-- Search Box -->
<div class="mb-4 flex flex-col gap-2">
	<input
		type="text"
		placeholder="Search by ID, name, or category"
		bind:value={searchQuery}
		class="w-full rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
	/>
	<button
		class="flex items-center justify-center rounded bg-action-success px-4 py-2 text-sm text-white hover:bg-green-600 focus:ring focus:ring-green-300"
		onclick={() => addUpdateAreaForm.create()}
	>
		<MdiPlusThick class="mr-2" />
		Add Area
	</button>
</div>

<!-- Header Row -->
<div
	class="hidden grid-cols-5 items-center p-4 font-semibold text-content md:grid lg:grid-cols-6 dark:text-content-dark"
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
	class="divide-y divide-surface-tertiary rounded-md border border-surface-tertiary dark:divide-surface-dark-tertiary dark:border-surface-dark-tertiary"
>
	{#each filteredAreas as area}
		<div
			class="flex grid-cols-5 flex-col items-start gap-1 bg-surface p-2 md:grid lg:grid-cols-6 lg:p-4 dark:bg-surface-dark"
		>
			<!-- Static Row -->
			<div class="font-bold text-content dark:text-content-dark">
				{area.id}
			</div>
			<div class="text-content dark:text-content-dark">
				<span class="font-thin text-content-secondary md:hidden dark:text-content-dark-secondary"
					>Short Name:{' '}</span
				>
				{area.short}
			</div>
			<div class="text-content md:hidden lg:block dark:text-content-dark">
				<span class="font-thin text-content-secondary md:hidden dark:text-content-dark-secondary"
					>Long Name:{' '}</span
				>
				{area.long}
			</div>
			<div class="text-content dark:text-content-dark">
				<span class="font-thin text-content-secondary md:hidden dark:text-content-dark-secondary"
					>Category:{' '}</span
				>
				{area.category}
			</div>
			<div class="justify-content-middle flex gap-1">
				<span class="font-thin text-content-secondary md:hidden dark:text-content-dark-secondary"
					>Color: {' '}</span
				>
				<div
					class="size-8 border border-surface-tertiary md:size-10 lg:size-12 dark:border-surface-dark-tertiary"
					style="background-color: {area.color};"
				></div>
			</div>
			<div class="flex space-x-2">
				<button
					type="button"
					class="text-md rounded bg-action-primary p-2 text-white hover:bg-sky-600 focus:ring focus:ring-sky-300"
					onclick={() => addUpdateAreaForm.edit(area)}
				>
					<MdiPencil />
				</button>
				<button
					onclick={() => confirmModal.prompt({ id: area.id })}
					class="text-md rounded bg-action-danger p-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
				>
					<MdiDelete />
				</button>
			</div>
		</div>
	{/each}
</div>
