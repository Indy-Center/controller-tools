<script lang="ts">
	import PopupModal from '$lib/ModalPopup.svelte';
	import { restrictionFilters } from '$lib/state.svelte.js';
	import MdiFilterCogOutline from 'virtual:icons/mdi/filter-cog-outline';
	import MdiFilterOffOutline from 'virtual:icons/mdi/filter-off-outline';

	let { areaMap }: { areaMap: Map<string, { id: string; label: string }[]> } = $props();

	//state and a setter for the filters config popup
	let drawerOpen = $state(false);

	function toggleAreaFilter(area: string) {
		if (restrictionFilters.areas.includes(area)) {
			restrictionFilters.areas = restrictionFilters.areas.filter((a) => a !== area);
		} else {
			restrictionFilters.areas.push(area);
		}
	}

	//state and setter to shadow the sticky controls when scrolled
	let isScrolled = $state(false);

	function handleScroll() {
		isScrolled = window.scrollY > 0;
	}

	let confirmModal: PopupModal;

	function modalClearFilters() {
		restrictionFilters.areas = [];
		confirmModal.closeModal();
		drawerOpen = false;
	}

	function clearAll() {
		if (restrictionFilters.areas.length > 0) {
			confirmModal.openModal();
		}
	}
</script>

<svelte:window onscroll={handleScroll} />
<div class="bg sticky top-0 px-1 pb-2" class:scrolled={isScrolled}>
	<div class="rounded-m relative flex w-full flex-col">
		<!-- Filter Header -->
		<div class="my-2 flex gap-1">
			<input
				type="text"
				id="filter"
				class="w-full rounded-md border border-zinc-300 p-3 text-zinc-700"
				placeholder="Search for destination airport..."
				bind:value={restrictionFilters.airport}
			/>
		</div>

		<!-- Quick  Controls -->
		<div class="flex justify-center">
			<div class="mr-auto flex flex-col gap-2">
				<label for="includeIncoming" class="pl-2 text-sm">
					<input
						type="checkbox"
						id="includeIncoming"
						bind:checked={restrictionFilters.includeIncoming}
					/>
					Include Incoming Restrictions</label
				>
				<label for="dimIncoming" class="pl-2 text-sm">
					<input type="checkbox" id="dimIncoming" />
					Dim Incoming Restrictions</label
				>
				<label for="hideInternal" class="pl-2 text-sm">
					<input type="checkbox" id="hideInteral" />
					Hide Your Internal Restrictions</label
				>
			</div>
			<button
				id="filterSlider"
				class="mr-2 rounded-md border p-1 text-3xl hover:bg-zinc-200 active:bg-zinc-300"
				onclick={() => clearAll()}><MdiFilterOffOutline /></button
			>

			<PopupModal bind:this={confirmModal}>
				<div class="text-md flex flex-col items-center font-bold">
					<h2 class="mb-3">Clear all active filters?</h2>

					<div class="flex gap-3">
						<button
							onclick={() => modalClearFilters()}
							class="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
							>Clear All</button
						>
						<button
							class="rounded bg-gray-200 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-300"
							onclick={() => confirmModal.closeModal()}>Cancel</button
						>
					</div>
				</div>
			</PopupModal>

			<button
				id="filterSlider"
				class="mr-2 rounded-md border p-1 text-3xl hover:bg-zinc-200 active:bg-zinc-300"
				onclick={() => (drawerOpen = !drawerOpen)}><MdiFilterCogOutline /></button
			>
		</div>
		<div
			class:scale-y-100={drawerOpen}
			class="bg absolute top-full z-40 flex origin-top scale-y-0 flex-col overflow-hidden rounded-b-md px-1 pb-2 shadow-md transition-all"
		>
			<h2 class="text pt-2 text-sm">Select the areas you are responsible for:</h2>
			{#each areaMap as [category, areas]}
				<h2 class="py-1 text-lg font-medium">
					{category.charAt(0).toUpperCase() + category.slice(1)}
				</h2>
				<div class="flex flex-wrap gap-2">
					{#each areas as area}
						<button
							class="rounded-md border p-1 text-sm"
							class:bg-zinc-200={restrictionFilters.areas.includes(area.id)}
							class:dark:bg-zinc-700={restrictionFilters.areas.includes(area.id)}
							onclick={() => toggleAreaFilter(area.id)}>{area.label}</button
						>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.scrolled {
		@apply rounded-b-md shadow-md;
	}
</style>
