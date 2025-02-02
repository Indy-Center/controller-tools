<script lang="ts">
	import MdiIcon from '$lib/components/MdiIcon.svelte';
	import ConfirmationModal from '$lib/ConfirmationModal.svelte';
	import AddUpdateStaticElementForm from './AddUpdateStaticElementForm.svelte';

	let { data } = $props();

	let addUpdateStaticElementForm: ReturnType<typeof AddUpdateStaticElementForm>;
	let confirmModal: ReturnType<typeof ConfirmationModal>;

	// Search query for filtering elements
	let searchQuery = $state('');

	// Filtered elements derived from the search query
	let filteredElements = $derived.by(() => {
		return data.staticElements.filter((element) => {
			if (searchQuery !== '') {
				return element.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
			}
			return true;
		});
	});
</script>

<svelte:head>
	<title>ICT - Airspace Management</title>
</svelte:head>

<AddUpdateStaticElementForm bind:this={addUpdateStaticElementForm} {data} />
<ConfirmationModal
	bind:this={confirmModal}
	action="?/delete"
	message="Are you sure you wish to delete this static element? This action annot be undone."
/>

<div class="flex h-full w-full flex-col p-6">
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-content dark:text-content-dark">Airspace Management</h1>
		<button
			class="flex items-center justify-center gap-2 rounded-md bg-action-success px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
			onclick={() => addUpdateStaticElementForm.create()}
		>
			<MdiIcon name="plus-thick" />
			<span>Add Element Group</span>
		</button>
	</div>

	<input
		type="text"
		placeholder="Search element groups..."
		bind:value={searchQuery}
		class="mb-6 w-full rounded-lg border border-surface-tertiary bg-surface p-3 text-sm text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
	/>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each filteredElements as element}
			<div
				class="group flex flex-col rounded-lg border border-surface-tertiary bg-surface shadow-sm transition-all hover:border-accent/30 hover:shadow-md dark:border-surface-dark-tertiary dark:bg-surface-dark"
			>
				<!-- Header with name and action buttons -->
				<div
					class="flex items-center justify-between border-b border-surface-tertiary p-4 dark:border-surface-dark-tertiary"
				>
					<h3 class="text-lg font-semibold text-content dark:text-content-dark">
						{element.name ?? 'Unnamed Element'}
					</h3>
					<div class="flex gap-2">
						<button
							type="button"
							class="rounded-md bg-surface-secondary p-2 text-content-secondary transition-all hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-accent-dark"
							onclick={() => addUpdateStaticElementForm.edit(element)}
						>
							<MdiIcon name="pencil" />
						</button>
						<button
							class="rounded-md bg-surface-secondary p-2 text-content-secondary transition-all hover:bg-action-danger hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary"
							onclick={() => confirmModal.prompt({ id: element.id })}
						>
							<MdiIcon name="delete" />
						</button>
					</div>
				</div>

				<!-- Components section -->
				<div class="flex-1 overflow-y-auto p-4">
					<div
						class="mb-2 text-sm font-medium text-content-secondary dark:text-content-dark-secondary"
					>
						Components ({element.components.length})
					</div>
					<div class="flex flex-wrap gap-2">
						{#each element.components.filter((c): c is NonNullable<typeof c> => c !== null) as component}
							<div
								class="inline-flex items-center rounded-md border border-surface-tertiary px-2 py-1 text-sm"
							>
								<span class="font-medium">{component.name ?? 'Unnamed Component'}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Footer with icon -->
				<div
					class="flex items-center gap-2 border-t border-surface-tertiary p-4 dark:border-surface-dark-tertiary"
				>
					<span
						class="inline-flex items-center gap-2 rounded-md bg-surface-secondary px-3 py-1.5 text-sm font-medium text-content-secondary dark:bg-surface-dark-secondary dark:text-content-dark-secondary"
					>
						{#if element.icon}
							<MdiIcon name={element.icon} />
						{/if}
						{element.icon ?? 'No Icon'}
					</span>
				</div>
			</div>
		{/each}
	</div>
</div>
