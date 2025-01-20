<script lang="ts">
	import Checkbox from '$lib/Checkbox.svelte';
	import { restrictionConfig } from '$lib/state.svelte.js';
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
		restrictionFilters.search = '';
		confirmModal.closeModal();
		drawerOpen = false;
	}

	function clearAll() {
		if (restrictionFilters.areas.length > 0 || restrictionFilters.search.length > 0) {
			confirmModal.openModal();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			drawerOpen = false;
		}
	}

	$effect(() => {
		if (restrictionFilters.areas.length === 0) {
			restrictionFilters.areas = Array.from(areaMap.values())
				.flat()
				.map((area) => area.id);
		}
	});
</script>

<svelte:document onkeydown={handleKeyDown} />

<svelte:window onscroll={handleScroll} />
<div
	class="bg-surface dark:bg-surface-dark sticky top-0 border-b border-transparent px-1 pb-2 transition-all duration-300"
	class:border-surface-tertiary={isScrolled}
	class:border-surface-dark-tertiary={isScrolled}
>
	<div class="relative flex w-full flex-col">
		<!-- Filter Header -->
		<div class="my-2 flex gap-1">
			<input
				type="text"
				id="filter"
				class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface-secondary dark:bg-surface-dark-secondary text-content dark:text-content-dark w-full rounded-md border p-3"
				placeholder="Search for destination airport or route..."
				bind:value={restrictionFilters.search}
			/>
			<button
				id="filterSlider"
				class="border-surface-tertiary dark:border-surface-dark-tertiary text-content-secondary dark:text-content-dark-secondary hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary mx-2 rounded-md border p-1 text-3xl transition-colors duration-300"
				onclick={() => clearAll()}
			>
				<MdiFilterOffOutline />
			</button>
			<button
				id="filterSlider"
				class="border-surface-tertiary dark:border-surface-dark-tertiary text-content-secondary dark:text-content-dark-secondary hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary mr-2 rounded-md border p-1 text-3xl transition-colors duration-300"
				onclick={() => (drawerOpen = !drawerOpen)}
			>
				<MdiFilterCogOutline />
			</button>

			<PopupModal closeButton={false} bind:this={confirmModal}>
				<div class="text-md flex flex-col items-center font-bold">
					<h2 class="text-content dark:text-content-dark mb-3">Clear all active filters?</h2>

					<div class="flex gap-3">
						<button
							onclick={() => modalClearFilters()}
							class="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
							>Clear All
						</button>
						<button
							class="bg-surface-secondary dark:bg-surface-dark-secondary text-content dark:text-content-dark hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded px-4 py-2 font-semibold"
							onclick={() => confirmModal.closeModal()}
							>Cancel
						</button>
					</div>
				</div>
			</PopupModal>
		</div>

		<!-- Quick  Controls -->
		<div class="flex justify-center">
			<div class="mr-auto flex flex-col gap-2 md:flex-row md:gap-x-4">
				<Checkbox
					id="includeIncoming"
					label="Include Incoming Restrictions"
					bind:checked={$restrictionConfig.includeIncoming}
				/>

				<Checkbox
					id="dimIncoming"
					label="Dim Incoming Restrictions"
					bind:checked={$restrictionConfig.dimIncoming}
				/>

				<Checkbox
					id="hideInternal"
					label="Hide Your Internal Restrictions"
					bind:checked={$restrictionConfig.hideInternal}
				/>
			</div>
		</div>
		<div
			class:scale-y-100={drawerOpen}
			class="bg-surface dark:bg-surface-dark absolute top-full z-40 -mx-1 flex origin-top scale-y-0 flex-col overflow-hidden rounded-b-md px-1 pb-2 shadow-md transition-all"
		>
			<h2 class="text-content-secondary dark:text-content-dark-secondary pt-4 text-sm">
				Select the areas you are responsible for:
			</h2>
			{#each areaMap as [category, areas]}
				<h2 class="text-content dark:text-content-dark py-1 text-lg font-medium">
					{category.charAt(0).toUpperCase() + category.slice(1)}
				</h2>
				<div class="flex flex-wrap gap-2">
					{#each areas as area}
						<button
							class="border-surface-tertiary dark:border-surface-dark-tertiary text-content dark:text-content-dark rounded-md border p-1 text-sm transition-colors duration-300"
							class:bg-surface-secondary={restrictionFilters.areas.includes(area.id)}
							class:dark:bg-surface-dark-secondary={restrictionFilters.areas.includes(area.id)}
							ondblclick={() => (restrictionFilters.areas = [area.id])}
							onclick={() => toggleAreaFilter(area.id)}
						>
							{area.label}
						</button>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
