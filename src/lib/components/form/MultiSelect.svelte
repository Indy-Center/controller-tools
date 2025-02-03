<script lang="ts">
	import { clickOutside } from '$lib/actions/clickOutside';
	import MdiIcon from '../MdiIcon.svelte';
	import type { MdiIconName } from '$lib/types/mdi';

	type Option = {
		id: string;
		label: string;
		icon?: MdiIconName;
	};

	let {
		options = [],
		selected = [],
		placeholder = 'Select options...',
		onChange = (selected: string[]) => {}
	} = $props<{
		options?: Option[];
		selected?: string[];
		placeholder?: string;
		onChange?: (selected: string[]) => void;
	}>();

	let isOpen = $state(false);
	let searchTerm = $state('');

	let filteredOptions = $derived(
		options.filter((option: Option) =>
			option.label.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	function toggle(id: string) {
		const index = selected.indexOf(id);
		if (index === -1) {
			onChange([...selected, id]);
		} else {
			onChange(selected.filter((i: string) => i !== id));
		}
	}

	function handleClickOutside() {
		isOpen = false;
		searchTerm = '';
	}
</script>

<div class="relative w-full" use:clickOutside={{ handler: handleClickOutside }}>
	<button
		type="button"
		class="flex w-full items-center justify-between rounded-lg bg-surface/95 px-4 py-2 text-left text-sm font-medium text-content shadow-lg backdrop-blur-md hover:bg-surface-secondary focus:outline-none dark:bg-surface-dark/95 dark:text-content-dark dark:hover:bg-surface-dark-secondary"
		onclick={() => (isOpen = !isOpen)}
	>
		<span>
			{#if selected.length === 0}
				{placeholder}
			{:else}
				{placeholder} ({selected.length})
			{/if}
		</span>
		<MdiIcon name="chevron-down" class="ml-2 h-5 w-5 flex-shrink-0" />
	</button>

	{#if isOpen}
		<div
			class="absolute left-0 z-[600] mt-2 w-full origin-top-left rounded-md bg-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-surface-dark"
		>
			<div class="p-2">
				<input
					type="text"
					placeholder="Search..."
					class="w-full rounded-md border border-content/20 bg-transparent px-3 py-1.5 text-sm text-content placeholder:text-content/50 focus:border-accent focus:outline-none focus:ring-0 dark:border-content-dark/20 dark:text-content-dark dark:placeholder:text-content-dark/50"
					bind:value={searchTerm}
				/>
			</div>
			<div class="max-h-60 overflow-auto py-1">
				{#each filteredOptions as option}
					<button
						type="button"
						class="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary"
						onclick={() => toggle(option.id)}
					>
						<span class="flex items-center gap-2">
							{#if option.icon}
								<MdiIcon name={option.icon} class="h-4 w-4" />
							{/if}
							<span class="text-content dark:text-content-dark">{option.label}</span>
						</span>
						{#if selected.includes(option.id)}
							<MdiIcon name="check" class="h-4 w-4 text-accent" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
