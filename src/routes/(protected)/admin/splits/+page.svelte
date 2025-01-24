<script lang="ts">
	import MdiPencil from 'virtual:icons/mdi/pencil';
	import MdiDelete from 'virtual:icons/mdi/delete';
	import MdiPlusThick from 'virtual:icons/mdi/plus-thick';
	import { goto } from '$app/navigation';
	import ConfirmationModal from '$lib/ConfirmationModal.svelte';

	let { data } = $props();
	let confirmModal: ReturnType<typeof ConfirmationModal>;
	let splitToDelete: (typeof data.splits)[number] | null = null;

	// Search query for filtering areas
	let searchQuery = $state('');

	// Filtered areas derived from the search query
	let filteredSplits = $derived.by(() => {
		return data.splits.filter((a) => {
			if (searchQuery !== '') {
				return `${a.name}`.toLowerCase().includes(searchQuery.toLowerCase());
			}
			return true;
		});
	});
</script>

<svelte:head>
	<title>ICT - Split Management</title>
</svelte:head>

<ConfirmationModal
	bind:this={confirmModal}
	action="?/delete"
	message="Are you sure you want to delete this split? This action cannot be undone."
/>

<div class="container mx-auto max-w-7xl p-4">
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-content md:text-3xl dark:text-content-dark">
			Split Management
		</h1>
		<button
			class="flex items-center justify-center gap-2 rounded-md bg-action-success px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20 active:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
			onclick={() => goto('/admin/splits/create')}
		>
			<MdiPlusThick />
			<span>Add Split</span>
		</button>
	</div>

	<input
		type="text"
		placeholder="Search splits..."
		bind:value={searchQuery}
		class="mb-6 w-full rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
	/>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each filteredSplits as split}
			<div
				class="group relative rounded-lg border border-surface-tertiary bg-surface p-4 shadow-sm transition-all hover:shadow-md dark:border-surface-dark-tertiary dark:bg-surface-dark"
			>
				<!-- Split Name -->
				<div class="mb-4 text-lg font-semibold text-content dark:text-content-dark">
					{split.name}
				</div>

				<!-- Groups -->
				<div class="mb-4 flex flex-wrap gap-2">
					{#each split.groups as group}
						<div
							class="flex flex-col rounded-md border-2 px-3 py-2 transition-all hover:shadow-sm"
							style="border-color: {group.color}; background-color: {group.color}15;"
						>
							<span class="font-medium" style="color: {group.color};">{group.name}</span>
							<span class="text-sm" style="color: {group.color};">
								{group.areas.length} Area{group.areas.length === 1 ? '' : 's'}
							</span>
						</div>
					{/each}
				</div>

				<!-- Actions -->
				<div class="absolute right-2 top-2 hidden gap-2 group-hover:flex">
					<button
						type="button"
						class="text-md rounded bg-action-primary p-2 text-white hover:bg-sky-600 focus:ring focus:ring-sky-300"
						onclick={() => goto(`/admin/splits/${split.id}/edit`)}
					>
						<MdiPencil />
					</button>
					<button
						class="text-md rounded bg-action-danger p-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
						onclick={() => {
							confirmModal.prompt({ id: split.id });
						}}
					>
						<MdiDelete />
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>
