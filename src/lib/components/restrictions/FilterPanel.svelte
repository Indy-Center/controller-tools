<script lang="ts">
	import { restrictionConfig } from '$lib/state.svelte.js';
	import PopupModal from '$lib/ModalPopup.svelte';
	import { restrictionFilters } from '$lib/state.svelte.js';
	import { onMount } from 'svelte';
	import { useSessionStorage } from '$lib/sessionStore.svelte';
	import SplitDropdown from './SplitDropdown.svelte';
	import MdiIcon from '../MdiIcon.svelte';

	let { areaMap, splits }: { areaMap: Map<string, { id: string; label: string }[]>; splits: any } =
		$props();

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

	onMount(() => {
		restrictionFilters.selectedSplit = useSessionStorage('mapSettings', {
			showTiles: true,
			selectedTag: null as string | null,
			showLines: true,
			showNavaids: true,
			selectedSplit: null as string | null
		}).selectedSplit;
	});
</script>

<svelte:document onkeydown={handleKeyDown} />

<svelte:window onscroll={handleScroll} />
<div
	class="sticky top-16 z-[800] -mx-4 border-b border-transparent bg-surface px-4 pb-2 transition-all duration-300 dark:bg-surface-dark"
	class:border-surface-tertiary={isScrolled}
	class:dark:border-surface-dark-tertiary={isScrolled}
>
	<div class="relative flex w-full flex-col">
		<!-- Filter Header -->
		<div class="my-2 flex flex-col gap-2 md:flex-row md:items-center">
			<div class="w-full md:order-last md:w-56">
				<SplitDropdown {splits} />
			</div>
			<div class="flex w-full items-center gap-2">
				<!-- Toggle Buttons with Tooltips -->
				<div class="flex gap-2">
					<button
						class={{
							'group relative rounded-md border border-accent p-1.5 text-lg transition-colors duration-300 focus:outline-none': true,
							'bg-accent text-white hover:bg-accent/90': $restrictionConfig.includeIncoming,
							'bg-surface text-accent hover:bg-accent/10': !$restrictionConfig.includeIncoming,
							'dark:bg-accent dark:text-white': $restrictionConfig.includeIncoming,
							'dark:bg-surface-dark dark:text-accent': !$restrictionConfig.includeIncoming
						}}
						onclick={() =>
							($restrictionConfig.includeIncoming = !$restrictionConfig.includeIncoming)}
					>
						<MdiIcon name="account-arrow-left" class="h-6 w-6" />
						<div
							class="absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 rounded-md bg-surface-tertiary px-2 py-1 text-xs text-content shadow-lg group-hover:block dark:bg-surface-dark-tertiary dark:text-content-dark"
						>
							Include Incoming Restrictions
						</div>
					</button>

					<button
						class={{
							'group relative rounded-md border border-accent p-1.5 text-lg transition-colors duration-300 focus:outline-none': true,
							'bg-accent text-white hover:bg-accent/90': $restrictionConfig.dimIncoming,
							'bg-surface text-accent hover:bg-accent/10': !$restrictionConfig.dimIncoming,
							'dark:bg-accent dark:text-white': $restrictionConfig.dimIncoming,
							'dark:bg-surface-dark dark:text-accent': !$restrictionConfig.dimIncoming
						}}
						onclick={() => ($restrictionConfig.dimIncoming = !$restrictionConfig.dimIncoming)}
					>
						<MdiIcon name="eye-arrow-left" class="h-6 w-6" />
						<div
							class="absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 rounded-md bg-surface-tertiary px-2 py-1 text-xs text-content shadow-lg group-hover:block dark:bg-surface-dark-tertiary dark:text-content-dark"
						>
							Dim Incoming Restrictions
						</div>
					</button>

					<button
						class={{
							'group relative rounded-md border border-accent p-1.5 text-lg transition-colors duration-300 focus:outline-none': true,
							'bg-accent text-white hover:bg-accent/90': $restrictionConfig.hideInternal,
							'bg-surface text-accent hover:bg-accent/10': !$restrictionConfig.hideInternal,
							'dark:bg-accent dark:text-white': $restrictionConfig.hideInternal,
							'dark:bg-surface-dark dark:text-accent': !$restrictionConfig.hideInternal
						}}
						onclick={() => ($restrictionConfig.hideInternal = !$restrictionConfig.hideInternal)}
					>
						<MdiIcon name="arrow-left-right" class="h-6 w-6" />
						<div
							class="absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 rounded-md bg-surface-tertiary px-2 py-1 text-xs text-content shadow-lg group-hover:block dark:bg-surface-dark-tertiary dark:text-content-dark"
						>
							Hide Internal Restrictions
						</div>
					</button>
				</div>

				<input
					type="text"
					id="filter"
					class="w-full rounded-md border border-surface-tertiary bg-surface-secondary p-2 text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary dark:text-content-dark dark:placeholder:text-content-dark-tertiary"
					placeholder="Search for destination airport or route..."
					bind:value={restrictionFilters.search}
				/>
				<button
					id="filterSlider"
					class={{
						'rounded-md border border-accent p-1.5 text-lg transition-colors duration-300 focus:outline-none': true,
						'bg-accent text-white hover:bg-accent/90':
							restrictionFilters.search ||
							restrictionFilters.areas.length < Array.from(areaMap.values()).flat().length,
						'bg-surface text-accent hover:bg-accent/10':
							!restrictionFilters.search &&
							restrictionFilters.areas.length === Array.from(areaMap.values()).flat().length,
						'dark:bg-accent dark:text-white':
							restrictionFilters.search ||
							restrictionFilters.areas.length < Array.from(areaMap.values()).flat().length,
						'dark:bg-surface-dark dark:text-accent':
							!restrictionFilters.search &&
							restrictionFilters.areas.length === Array.from(areaMap.values()).flat().length,
						'dark:hover:bg-accent/90':
							restrictionFilters.search ||
							restrictionFilters.areas.length < Array.from(areaMap.values()).flat().length,
						'dark:hover:bg-accent/20':
							!restrictionFilters.search &&
							restrictionFilters.areas.length === Array.from(areaMap.values()).flat().length
					}}
					onclick={() => clearAll()}
				>
					<MdiIcon name="filter-off-outline" class="h-6 w-6" />
				</button>
				<button
					id="filterSlider"
					class={{
						'rounded-md border border-accent p-1.5 text-lg transition-colors duration-300 focus:outline-none': true,
						'bg-accent text-white hover:bg-accent/90': drawerOpen,
						'bg-surface text-accent hover:bg-accent/10': !drawerOpen,
						'dark:bg-accent dark:text-white': drawerOpen,
						'dark:bg-surface-dark dark:text-accent': !drawerOpen,
						'dark:hover:bg-accent/90': drawerOpen,
						'dark:hover:bg-accent/20': !drawerOpen
					}}
					onclick={() => (drawerOpen = !drawerOpen)}
				>
					<MdiIcon name="filter-cog-outline" class="h-6 w-6" />
				</button>
			</div>
		</div>

		<PopupModal closeButton={false} bind:this={confirmModal}>
			<div class="text-md flex flex-col items-center font-bold">
				<h2 class="mb-3 text-content dark:text-content-dark">Clear all active filters?</h2>

				<div class="flex gap-3">
					<button
						onclick={() => modalClearFilters()}
						class="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
						>Clear All
					</button>
					<button
						class="rounded bg-surface-secondary px-4 py-2 font-semibold text-content hover:bg-surface-tertiary dark:bg-surface-dark-secondary dark:text-content-dark dark:hover:bg-surface-dark-tertiary"
						onclick={() => confirmModal.closeModal()}
						>Cancel
					</button>
				</div>
			</div>
		</PopupModal>

		<div
			class:scale-y-100={drawerOpen}
			class="absolute top-full z-50 -mx-1 flex w-full origin-top scale-y-0 flex-col overflow-hidden rounded-b-md bg-surface px-4 pb-4 shadow-lg transition-all dark:bg-surface-dark"
		>
			<!-- Area Selection -->
			<h2 class="pt-4 text-sm font-medium text-content-secondary dark:text-content-dark-secondary">
				Select Areas
			</h2>
			{#each areaMap as [category, areas]}
				<h2 class="py-1 text-lg font-medium text-content dark:text-content-dark">
					{category.charAt(0).toUpperCase() + category.slice(1)}
				</h2>
				<div class="flex flex-wrap gap-2">
					{#each areas as area}
						<button
							class={{
								'rounded-md border border-accent px-2 py-1 text-sm transition-colors duration-300 focus:outline-none': true,
								'bg-accent text-white hover:bg-accent/90': restrictionFilters.areas.includes(
									area.id
								),
								'bg-surface text-accent hover:bg-accent/10': !restrictionFilters.areas.includes(
									area.id
								),
								'dark:bg-accent dark:text-white': restrictionFilters.areas.includes(area.id),
								'dark:bg-surface-dark dark:text-accent': !restrictionFilters.areas.includes(
									area.id
								),
								'dark:hover:bg-accent/90': restrictionFilters.areas.includes(area.id),
								'dark:hover:bg-accent/20': !restrictionFilters.areas.includes(area.id)
							}}
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
