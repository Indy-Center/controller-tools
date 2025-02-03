<script lang="ts">
	import AddUpdateAreaForm from './AddUpdateAreaForm.svelte';
	import ConfirmationModal from '$lib/ConfirmationModal.svelte';
	import MdiIcon from '$lib/components/MdiIcon.svelte';

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

<div class="flex h-full w-full flex-col space-y-6 p-6">
	<!-- Header Section -->
	<div class="flex flex-col gap-y-2">
		<h1 class="text-2xl font-bold text-content dark:text-content-dark">Areas Management</h1>
		<p class="text-content-secondary dark:text-content-dark-secondary">
			Define and manage controllable airspace areas. These areas form the building blocks for splits
			and determine the scope of controller responsibility.
		</p>
	</div>

	<!-- Search and Add Section -->
	<div class="flex items-center gap-4">
		<div class="relative flex-1">
			<MdiIcon
				name="magnify"
				class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-content-tertiary dark:text-content-dark-tertiary"
			/>
			<input
				type="text"
				placeholder="Search areas..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-surface-tertiary bg-surface py-2.5 pl-10 pr-3 text-sm text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
			/>
		</div>
		<button
			type="button"
			onclick={() => addUpdateAreaForm.create()}
			class="flex items-center justify-center gap-2 rounded-md bg-action-success px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
		>
			<MdiIcon name="plus-thick" />
			<span>Add Area</span>
		</button>
	</div>

	<!-- Areas Table -->
	<div class="rounded-lg border border-surface-tertiary dark:border-surface-dark-tertiary">
		<!-- Header Row -->
		<div
			class="hidden grid-cols-5 items-center rounded-t-lg border border-surface-tertiary bg-surface-secondary p-4 font-medium text-content md:grid lg:grid-cols-[repeat(8,minmax(0,1fr))] dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary dark:text-content-dark"
		>
			<div>ID</div>
			<div>Short Name</div>
			<div class="md:hidden lg:block">Long Name</div>
			<div>Category</div>
			<div>Tag</div>
			<div>Color</div>
			<div class="col-span-2">Actions</div>
		</div>

		<!-- Areas List -->
		<div class="flex-1 overflow-auto">
			<div
				class="divide-y divide-surface-tertiary rounded-b-lg border-x border-b border-surface-tertiary bg-surface shadow-sm dark:divide-surface-dark-tertiary dark:border-surface-dark-tertiary dark:bg-surface-dark"
			>
				{#each filteredAreas as area}
					<div
						class="flex grid-cols-5 flex-col items-start gap-2 p-4 md:grid lg:grid-cols-[repeat(8,minmax(0,1fr))]"
					>
						<div class="font-medium text-content dark:text-content-dark">
							{area.id}
						</div>
						<div class="text-content dark:text-content-dark">
							<span
								class="font-light text-content-secondary md:hidden dark:text-content-dark-secondary"
								>Short Name:{' '}</span
							>
							{area.short}
						</div>
						<div class="text-content md:hidden lg:block dark:text-content-dark">
							<span
								class="font-light text-content-secondary md:hidden dark:text-content-dark-secondary"
								>Long Name:{' '}</span
							>
							{area.long}
						</div>
						<div class="text-content dark:text-content-dark">
							<span
								class="font-light text-content-secondary md:hidden dark:text-content-dark-secondary"
								>Category:{' '}</span
							>
							{area.category}
						</div>
						<div class="text-content dark:text-content-dark">
							<span
								class="font-light text-content-secondary md:hidden dark:text-content-dark-secondary"
								>Tag:{' '}</span
							>
							{area.tag || '—'}
						</div>
						<div class="justify-content-middle flex gap-1">
							<span
								class="font-light text-content-secondary md:hidden dark:text-content-dark-secondary"
								>Color: {' '}</span
							>
							<div
								class="size-8 rounded border border-surface-tertiary md:size-10 lg:size-12 dark:border-surface-dark-tertiary"
								style="background-color: {area.color};"
							></div>
						</div>
						<div class="col-span-2 flex space-x-2">
							<button
								type="button"
								class="rounded-md bg-action-primary px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-sky-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20"
								onclick={() => addUpdateAreaForm.edit(area)}
							>
								<MdiIcon name="pencil" />
							</button>
							<button
								onclick={() => confirmModal.prompt({ id: area.id })}
								class="rounded-md bg-action-danger px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500/20"
							>
								<MdiIcon name="delete" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
