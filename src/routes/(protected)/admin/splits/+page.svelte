<script lang="ts">
	import { goto } from '$app/navigation';
	import MdiIcon from '$lib/components/MdiIcon.svelte';
	import ConfirmationModal from '$lib/ConfirmationModal.svelte';

	let { data } = $props();
	let confirmModal: ReturnType<typeof ConfirmationModal>;

	// Search query for filtering areas
	let searchQuery = $state('');

	// Function to export split data
	async function exportSplit(splitId: string, splitName: string) {
		try {
			const response = await fetch(`/api/splits/${splitId}/combined?export=crc&tags=high,low`);
			if (!response.ok) throw new Error('Failed to fetch split data');

			const data = await response.json();
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			// TODO: Make this name customizable
			// ex: Filter 12 - Demo Event Event Split.geojson
			a.download = `Filter 12 - ${splitName} Event Split.geojson`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Error exporting split:', error);
			alert('Failed to export split data');
		}
	}

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

<div class="flex h-full w-full flex-col space-y-6 p-6">
	<!-- Header Section with Info -->
	<div class="space-y-6">
		<div class="flex flex-col gap-y-2">
			<h1 class="text-2xl font-bold text-content dark:text-content-dark">Splits Management</h1>
			<p class="text-content-secondary dark:text-content-dark-secondary">
				Add and update splits for setting up how the airspace should be delegated between positions.
			</p>
		</div>

		<div class="rounded-lg bg-surface-secondary/50 p-4 dark:bg-surface-dark-secondary/50">
			<div class="flex items-start gap-3">
				<div class="mt-0.5 text-accent dark:text-accent-dark">
					<MdiIcon name="information" class="h-5 w-5" />
				</div>
				<p class="text-sm text-content-secondary dark:text-content-dark-secondary">
					Split Groups represent the individual positions that will own the underlying airspace.
					Each split configuration defines how the airspace is divided and delegated between
					different controller positions.
				</p>
			</div>
		</div>
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
				placeholder="Search splits..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-surface-tertiary bg-surface py-2.5 pl-10 pr-3 text-sm text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
			/>
		</div>
		<button
			class="flex items-center justify-center gap-2 rounded-md bg-action-success px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
			onclick={() => goto('/admin/splits/create')}
		>
			<MdiIcon name="plus-thick" />
			<span>Add Split</span>
		</button>
	</div>

	<!-- Splits Grid -->
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
							onclick={() => exportSplit(split.id, split.name)}
						>
							<MdiIcon name="export" />
						</button>
						<button
							type="button"
							class="rounded-md bg-surface-secondary p-2 text-content-secondary transition-all hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-accent-dark"
							onclick={() => goto(`/admin/splits/${split.id}/edit`)}
						>
							<MdiIcon name="pencil" />
						</button>
						{#if !split.isDefault}
							<button
								class="rounded-md bg-surface-secondary p-2 text-content-secondary transition-all hover:bg-action-danger hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary"
								onclick={() => {
									confirmModal.prompt({ id: split.id });
								}}
							>
								<MdiIcon name="delete" />
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
								class={`flex w-full items-center justify-center gap-x-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:shadow-sm focus:outline-none focus:ring-2 ${
									split.isPublished
										? 'bg-accent bg-opacity-10 text-accent hover:bg-opacity-20'
										: 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-surface-dark-tertiary'
								}`}
							>
								<MdiIcon name={split.isPublished ? 'eye-off' : 'eye'} class="h-4 w-4" />
								{split.isPublished ? 'Unpublish' : 'Publish'}
							</button>
						</form>
					{/if}
					{#if !split.isDefault}
						{#if split.isPublished}
							<form method="POST" action="?/makeDefault">
								<input type="hidden" name="id" value={split.id} />
								<button
									type="submit"
									class="rounded-md bg-surface-secondary px-3 py-1.5 text-sm font-medium text-content-secondary transition-all hover:bg-surface-tertiary dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-surface-dark-tertiary"
								>
									Make Default
								</button>
							</form>
						{/if}
					{:else}
						<span
							class="rounded-md bg-accent bg-opacity-10 px-3 py-1.5 text-sm font-medium text-accent dark:text-accent-dark"
						>
							Default
						</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
