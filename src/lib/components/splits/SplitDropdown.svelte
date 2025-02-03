<script lang="ts">
	import { restrictionFilters } from '$lib/state.svelte';
	import SplitName from './SplitName.svelte';
	import { useSessionStorage } from '$lib/sessionStore.svelte';
	import MdiIcon from '../MdiIcon.svelte';

	let { splits } = $props();

	let isDropdownOpen = $state(false);
	let settings = useSessionStorage('mapSettings', {
		showTiles: true,
		selectedTag: null as string | null,
		showLines: true,
		showNavaids: true,
		selectedSplit: null as string | null
	});

	function handleSplitChange(splitId: string) {
		settings.selectedSplit = splitId;
		restrictionFilters.selectedSplit = splitId;
		isDropdownOpen = false;
	}
</script>

<div class="relative">
	<button
		type="button"
		class="flex w-full items-center justify-between rounded-lg bg-surface/95 px-4 py-2 text-left text-sm font-medium text-content shadow-lg backdrop-blur-md hover:bg-surface-secondary focus:outline-none dark:bg-surface-dark/95 dark:text-content-dark dark:hover:bg-surface-dark-secondary"
		onclick={() => (isDropdownOpen = !isDropdownOpen)}
	>
		<span class="truncate">
			{#if splits.some((split: any) => split.id === restrictionFilters.selectedSplit)}
				{@const split = splits.find((split: any) => split.id === restrictionFilters.selectedSplit)}
				<SplitName {...split} />
			{:else}
				Select Split
			{/if}
		</span>
		<MdiIcon name="chevron-down" class="ml-2 h-5 w-5 flex-shrink-0" />
	</button>

	{#if isDropdownOpen}
		<div
			class="absolute right-0 z-[600] mt-2 w-full origin-top-right rounded-md bg-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-surface-dark"
			role="menu"
		>
			<div class="py-1" role="none">
				{#each splits as split}
					<button
						type="button"
						class="block w-full px-4 py-2 text-left text-sm text-content hover:bg-surface-secondary dark:text-content-dark dark:hover:bg-surface-dark-secondary"
						role="menuitem"
						onclick={() => handleSplitChange(split.id)}
					>
						<SplitName {...split} />
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
