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

<div class="flex h-full w-full flex-col p-6">
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-content dark:text-content-dark">Split Management</h1>
		<button
			class="flex items-center justify-center gap-2 rounded-md bg-action-success px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
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
		class="mb-6 w-full rounded-lg border border-surface-tertiary bg-surface p-3 text-sm text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
	/>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each filteredSplits as split}
			<div
				class="group flex flex-col rounded-lg border border-surface-tertiary bg-surface shadow-sm transition-all hover:border-accent/30 hover:shadow-md dark:border-surface-dark-tertiary dark:bg-surface-dark"
			>
				<!-- Header with name and action buttons -->
				<div
					class="flex items-center justify-between border-b border-surface-tertiary p-4 dark:border-surface-dark-tertiary"
				>
					<h3 class="text-lg font-semibold text-content dark:text-content-dark">
						{split.name}
					</h3>
					<div class="flex gap-2">
						<button
							type="button"
							class="rounded-md bg-surface-secondary p-2 text-content-secondary transition-all hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-accent-dark"
							onclick={() => goto(`/admin/splits/${split.id}/edit`)}
						>
							<MdiPencil />
						</button>
						{#if !split.isDefault}
							<button
								class="rounded-md bg-surface-secondary p-2 text-content-secondary transition-all hover:bg-action-danger hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary"
								onclick={() => {
									confirmModal.prompt({ id: split.id });
								}}
							>
								<MdiDelete />
							</button>
						{/if}
					</div>
				</div>

				<!-- Groups section with scrollable area -->
				<div class="flex-1 overflow-y-auto p-4">
					<div
						class="mb-2 text-sm font-medium text-content-secondary dark:text-content-dark-secondary"
					>
						Groups ({split.groups.length})
					</div>
					<div class="flex flex-wrap gap-2">
						{#each split.groups as group}
							<div
								class="inline-flex items-center rounded-md px-2 py-1 text-sm transition-all"
								style="border: 1px solid {group.color}; background-color: {group.color}10;"
							>
								<span style="color: {group.color};" class="font-medium">{group.name}</span>
								<span style="color: {group.color};" class="ml-1 text-xs opacity-75"
									>({group.areas.length})</span
								>
							</div>
						{/each}
					</div>
				</div>

				<!-- Footer with status buttons -->
				<div
					class="flex gap-2 border-t border-surface-tertiary p-4 dark:border-surface-dark-tertiary"
				>
					{#if !split.isDefault}
						<form method="POST" action="?/togglePublish" class="flex-1">
							<input type="hidden" name="id" value={split.id} />
							<input type="hidden" name="publish" value={(!split.isPublished).toString()} />
							<button
								type="submit"
								class="w-full rounded-md px-3 py-1.5 text-sm font-medium transition-all"
								class:bg-accent-muted={split.isPublished}
								class:text-accent={split.isPublished}
								class:bg-surface-secondary={!split.isPublished}
								class:text-content-secondary={!split.isPublished}
								class:dark:bg-accent-dark-muted={split.isPublished}
								class:dark:bg-surface-dark-secondary={!split.isPublished}
								class:dark:text-content-dark-secondary={!split.isPublished}
							>
								{split.isPublished ? 'Published' : 'Draft'}
							</button>
						</form>
					{/if}
					{#if !split.isDefault}
						{#if split.isPublished}
							<form method="POST" action="?/makeDefault">
								<input type="hidden" name="id" value={split.id} />
								<button
									type="submit"
									class="rounded-md bg-surface-secondary px-3 py-1.5 text-sm font-medium text-content-secondary transition-all hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-accent-dark"
								>
									Make Default
								</button>
							</form>
						{/if}
					{:else}
						<span
							class="rounded-md bg-accent-muted px-3 py-1.5 text-sm font-medium text-accent dark:bg-accent-dark-muted"
						>
							Default
						</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
