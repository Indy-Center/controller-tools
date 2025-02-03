<script lang="ts">
	import MdiIcon from '$lib/components/MdiIcon.svelte';
	import ConfirmationModal from '$lib/ConfirmationModal.svelte';
	import AddUpdateStaticElementForm from './AddUpdateStaticElementForm.svelte';
	import AddUpdateOverlayForm from './AddUpdateOverlayForm.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { enhance } from '$app/forms';

	let { data } = $props();

	let confirmDeleteStaticElementModal: ReturnType<typeof ConfirmationModal>;
	let confirmDeleteOverlayModal: ReturnType<typeof ConfirmationModal>;
	let staticElementForm: ReturnType<typeof AddUpdateStaticElementForm>;
	let overlayForm: ReturnType<typeof AddUpdateOverlayForm>;
	let searchQuery = $state('');

	let filteredStaticElements = $derived.by(() => {
		if (!searchQuery) return data.staticElements;
		const query = searchQuery.toLowerCase();
		return data.staticElements.filter(
			(element) =>
				element.name.toLowerCase().includes(query) ||
				element.components.some((comp: { name: string }) => comp.name.toLowerCase().includes(query))
		);
	});

	let filteredOverlays = $derived.by(() => {
		if (!searchQuery) return data.overlayGroups;
		const query = searchQuery.toLowerCase();
		return data.overlayGroups.filter(
			(overlay) =>
				overlay.name.toLowerCase().includes(query) ||
				overlay.components.some((comp: { name: string }) => comp.name.toLowerCase().includes(query))
		);
	});
</script>

<svelte:head>
	<title>ICT - Airspace Management</title>
</svelte:head>

<ConfirmationModal
	bind:this={confirmDeleteStaticElementModal}
	message="This action cannot be undone."
	action="?/deleteStatic"
/>
<ConfirmationModal
	bind:this={confirmDeleteOverlayModal}
	message="This action cannot be undone."
	action="?/deleteOverlay"
/>

<div class="flex h-full w-full flex-col space-y-6 p-6">
	<!-- Header Section -->
	<div class="flex flex-col gap-y-2">
		<h1 class="text-2xl font-bold text-content dark:text-content-dark">Airspace Management</h1>
		<p class="text-content-secondary dark:text-content-dark-secondary">
			Add and update map elements for display on the Airspace page. Configure static elements and
			overlays to enhance controller visualization and situational awareness.
		</p>
	</div>

	<!-- Info Boxes -->
	<div class="grid gap-4 lg:grid-cols-2">
		<div class="rounded-lg bg-surface-secondary/50 p-4 dark:bg-surface-dark-secondary/50">
			<div class="flex items-start gap-3">
				<div class="mt-0.5 text-accent dark:text-accent-dark">
					<MdiIcon name="information" class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-sm font-medium text-content dark:text-content-dark">Static Elements</h3>
					<p class="mt-1 text-sm text-content-secondary dark:text-content-dark-secondary">
						Static Elements are foundational map features that provide essential context for all
						controllers. These include permanent features like airways, boundary lines, and fixed
						geographical markers that are relevant across all positions and operations.
					</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-surface-secondary/50 p-4 dark:bg-surface-dark-secondary/50">
			<div class="flex items-start gap-3">
				<div class="mt-0.5 text-accent dark:text-accent-dark">
					<MdiIcon name="information" class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-sm font-medium text-content dark:text-content-dark">Overlays</h3>
					<p class="mt-1 text-sm text-content-secondary dark:text-content-dark-secondary">
						Overlays are toggleable map elements that provide additional context for specific
						operations. Common examples include SIDs (Standard Instrument Departures), STARs
						(Standard Terminal Arrival Routes), and other procedural information that controllers
						can enable based on their current needs.
					</p>
				</div>
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
				placeholder="Search elements and overlays..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-surface-tertiary bg-surface py-2.5 pl-10 pr-3 text-sm text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
			/>
		</div>
		<button
			type="button"
			onclick={() => staticElementForm.create()}
			class="flex items-center justify-center gap-2 rounded-md bg-action-success px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
		>
			<MdiIcon name="plus-thick" />
			<span>Add Static Element</span>
		</button>
		<button
			type="button"
			onclick={() => overlayForm.create()}
			class="flex items-center justify-center gap-2 rounded-md bg-action-success px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
		>
			<MdiIcon name="plus-thick" />
			<span>Add Overlay</span>
		</button>
	</div>

	<!-- Static Elements Section -->
	<div class="space-y-6">
		<h2 class="text-xl font-bold text-content dark:text-content-dark">Static Elements</h2>

		{#if data.staticElements.length === 0}
			<EmptyState
				icon="map-marker-plus"
				message="No static elements have been added yet. Click the button above to add one."
			/>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each filteredStaticElements as element}
					<div
						class="flex flex-col justify-between rounded-lg border border-surface-tertiary bg-surface p-4 dark:border-surface-dark-tertiary dark:bg-surface-dark"
					>
						<div>
							<div class="mb-4 flex items-center justify-between">
								<div class="flex items-center gap-x-2">
									<MdiIcon name={element.icon} class="h-5 w-5" />
									<h3 class="font-medium text-content dark:text-content-dark">{element.name}</h3>
								</div>
								<div class="flex items-center gap-x-2">
									<button
										type="button"
										onclick={() => staticElementForm.edit(element)}
										class="rounded-md bg-surface-secondary p-2 text-content-secondary transition-all hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-accent-dark"
									>
										<MdiIcon name="pencil" class="h-4 w-4" />
									</button>
									<button
										type="submit"
										class="rounded-md bg-surface-secondary p-2 text-content-secondary transition-all hover:bg-action-danger hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary"
										onclick={() => confirmDeleteStaticElementModal.prompt({ id: element.id })}
									>
										<MdiIcon name="delete" class="h-4 w-4" />
									</button>
								</div>
							</div>
							<div class="flex flex-wrap gap-2">
								{#each element.components as component}
									<span
										class="inline-flex items-center gap-x-1 rounded-full bg-surface-secondary px-2 py-1 text-xs text-content dark:bg-surface-dark-secondary dark:text-content-dark"
									>
										<span class="h-2 w-2 rounded-full" style="background-color: {component.color}"
										></span>
										{component.name}
									</span>
								{/each}
							</div>
						</div>
						<div class="mt-4">
							<form
								method="POST"
								action="?/togglePublishStatic"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<input type="hidden" name="id" value={element.id} />
								<input type="hidden" name="publish" value={(!element.isPublished).toString()} />
								<button
									type="submit"
									class={`flex w-full items-center justify-center gap-x-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:shadow-sm focus:outline-none focus:ring-2 ${
										element.isPublished
											? 'bg-accent bg-opacity-10 text-accent hover:bg-opacity-20'
											: 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-surface-dark-tertiary'
									}`}
								>
									<MdiIcon name={element.isPublished ? 'eye-off' : 'eye'} class="h-4 w-4" />
									{element.isPublished ? 'Unpublish' : 'Publish'}
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Overlays Section -->
	<div class="space-y-6">
		<h2 class="text-xl font-bold text-content dark:text-content-dark">Overlays</h2>

		{#if data.overlayGroups.length === 0}
			<EmptyState
				icon="map-marker-plus"
				message="No overlays have been added yet. Click the button above to add one."
			/>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each filteredOverlays as overlay}
					<div
						class="flex flex-col justify-between rounded-lg border border-surface-tertiary bg-surface p-4 dark:border-surface-dark-tertiary dark:bg-surface-dark"
					>
						<div>
							<div class="mb-4 flex items-center justify-between">
								<h3 class="font-medium text-content dark:text-content-dark">{overlay.name}</h3>
								<div class="flex items-center gap-x-2">
									<button
										type="button"
										onclick={() => overlayForm.edit(overlay)}
										class="rounded-md bg-surface-secondary p-2 text-content-secondary transition-all hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-accent-dark"
									>
										<MdiIcon name="pencil" class="h-4 w-4" />
									</button>
									<button
										type="submit"
										class="rounded-md bg-surface-secondary p-2 text-content-secondary transition-all hover:bg-action-danger hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary"
										onclick={() => confirmDeleteOverlayModal.prompt({ id: overlay.id })}
									>
										<MdiIcon name="delete" class="h-4 w-4" />
									</button>
								</div>
							</div>
							<div class="flex flex-wrap gap-2">
								{#each overlay.components as component}
									<span
										class="inline-flex items-center gap-x-1 rounded-full bg-surface-secondary px-2 py-1 text-xs text-content dark:bg-surface-dark-secondary dark:text-content-dark"
									>
										<span class="h-2 w-2 rounded-full" style="background-color: {component.color}"
										></span>
										{component.name}
									</span>
								{/each}
							</div>
						</div>
						<div class="mt-4">
							<form
								method="POST"
								action="?/togglePublishOverlay"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<input type="hidden" name="id" value={overlay.id} />
								<input type="hidden" name="publish" value={(!overlay.isPublished).toString()} />
								<button
									type="submit"
									class={`flex w-full items-center justify-center gap-x-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:shadow-sm focus:outline-none focus:ring-2 ${
										overlay.isPublished
											? 'bg-accent bg-opacity-10 text-accent hover:bg-opacity-20'
											: 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-surface-dark-tertiary'
									}`}
								>
									<MdiIcon name={overlay.isPublished ? 'eye-off' : 'eye'} class="h-4 w-4" />
									{overlay.isPublished ? 'Unpublish' : 'Publish'}
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<AddUpdateStaticElementForm bind:this={staticElementForm} data={data.staticForm} />
<AddUpdateOverlayForm bind:this={overlayForm} data={data.overlayForm} />
