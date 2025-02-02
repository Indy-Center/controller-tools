<script lang="ts">
	import { clickOutside } from '$lib/actions/clickOutside';
	import type { MdiIconName } from '$lib/types/mdi';
	import * as mdi from '@mdi/js';
	import MdiIcon from './MdiIcon.svelte';

	let {
		value = $bindable(),
		placeholder = 'Search icons...',
		error,
		name = 'icon',
		constraints
	} = $props();

	// Memoize the icon list on component initialization
	const commonIcons = $derived.by(() =>
		Object.keys(mdi)
			.filter((key) => key.startsWith('mdi'))
			.map(
				(key) =>
					key
						.replace('mdi', '')
						.replace(/([A-Z])/g, '-$1')
						.toLowerCase()
						.replace(/^-/, '') as MdiIconName
			)
	);

	let isOpen = $state(false);
	let searchTerm = $state(value || '');

	const filteredIcons = $derived.by(() => {
		if (searchTerm.length === 0) {
			return commonIcons.slice(0, 100); // Show first 100 icons when no search
		}
		return commonIcons
			.filter((icon) => icon.toLowerCase().includes(searchTerm.toLowerCase()))
			.slice(0, 100); // Limit results to 100 icons
	});

	function handleSelect(icon: string) {
		value = icon;
		isOpen = false;
		searchTerm = icon;
	}

	function handleFocus() {
		isOpen = true;
		searchTerm = value;
	}

	function handleClickOutside() {
		isOpen = false;
		searchTerm = value;
	}
</script>

<div class="relative" use:clickOutside={{ handler: handleClickOutside }}>
	<div class="flex items-center gap-x-2">
		{#if value}
			<div
				class="flex items-center justify-center rounded-md border border-surface-tertiary bg-surface dark:border-surface-dark-tertiary dark:bg-surface-dark"
			>
				<MdiIcon name={value} class="h-6 w-6 text-content dark:text-content-dark" />
			</div>
		{/if}
		<input
			{name}
			type="text"
			bind:value={searchTerm}
			{placeholder}
			onfocus={handleFocus}
			class="flex-1 rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
			aria-invalid={error ? 'true' : undefined}
			{...constraints}
		/>
	</div>

	{#if isOpen}
		<div
			class="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-surface-tertiary bg-surface shadow-lg dark:border-surface-dark-tertiary dark:bg-surface-dark"
		>
			<div class="grid grid-cols-4 gap-2 p-2">
				{#each filteredIcons as icon}
					<button
						type="button"
						onclick={() => handleSelect(icon)}
						class="flex flex-col items-center rounded-md p-2 text-content hover:bg-surface-secondary dark:text-content-dark dark:hover:bg-surface-dark-secondary {value ===
						icon
							? 'bg-surface-secondary dark:bg-surface-dark-secondary'
							: ''}"
					>
						<MdiIcon name={icon} class="h-6 w-6" />
						<span
							class="mt-1 w-full overflow-hidden text-ellipsis text-center text-xs leading-tight"
							title={icon}
						>
							{icon}
						</span>
					</button>
				{/each}
			</div>
			{#if filteredIcons.length === 0}
				<div
					class="p-4 text-center text-sm text-content-secondary dark:text-content-dark-secondary"
				>
					No icons found
				</div>
			{/if}
		</div>
	{/if}
</div>
