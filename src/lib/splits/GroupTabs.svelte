<script lang="ts">
	type Group = {
		name: string;
		color: string;
		areas: string[];
	};

	type GroupTabsProps = {
		groups: Group[];
		activeGroupIndex: number;
		availableOwnerAreas: any[];
		showNewGroupDropdown?: boolean;
		onRemoveGroup: (index: number) => void;
		onSetActiveGroup: (index: number) => void;
		onCreateGroup: (area: any) => void;
		onToggleDropdown: () => void;
	};

	let props: GroupTabsProps = $props();
</script>

<!-- Outer container with hidden overflow -->
<div class="relative flex border-b border-surface-tertiary dark:border-surface-dark-tertiary">
	<!-- Scrollable container for tabs -->
	<div class="scrollbar-none flex gap-x-2 overflow-x-auto pb-2">
		{#each props.groups as group, i}
			<div class="group relative shrink-0">
				<button
					type="button"
					class="rounded-t-lg px-4 py-2 transition-colors {props.activeGroupIndex === i
						? 'border-x border-t border-surface-tertiary bg-surface-secondary dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary'
						: 'hover:bg-surface hover:dark:bg-surface-dark'}"
					onclick={() => props.onSetActiveGroup(i)}
				>
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-full" style="background-color: {group.color}"></div>
						<span
							class="font-medium {props.activeGroupIndex === i
								? 'text-content dark:text-content-dark'
								: 'text-content-secondary dark:text-content-dark-secondary'}"
						>
							{group.name}
						</span>
					</div>
				</button>
				{#if props.groups.length > 0}
					<button
						type="button"
						class="absolute -right-2 -top-2 hidden rounded-full bg-surface p-1 text-content-secondary shadow-lg hover:bg-surface-secondary group-hover:block dark:bg-surface-dark dark:text-content-dark-secondary dark:hover:bg-surface-dark-secondary"
						onclick={() => props.onRemoveGroup(i)}
						aria-label="Remove group"
					>
						<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				{/if}
			</div>
		{/each}
	</div>

	<!-- New Group Button + Dropdown (fixed position) -->
	<div class="relative shrink-0 border-l border-surface-tertiary dark:border-surface-dark-tertiary">
		<button
			type="button"
			class="flex h-full items-center gap-2 rounded-t-lg px-4 py-2 text-content-secondary transition-colors hover:bg-surface dark:text-content-dark-secondary dark:hover:bg-surface-dark"
			onclick={() => props.onToggleDropdown()}
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			<span class="font-medium">New Group</span>
		</button>

		{#if props.showNewGroupDropdown}
			<div
				class="absolute left-0 top-full z-10 mt-1 h-64 max-h-64 w-48 overflow-auto rounded-lg border border-surface-tertiary bg-surface p-2 shadow-lg dark:border-surface-dark-tertiary dark:bg-surface-dark"
			>
				{#each props.availableOwnerAreas as area}
					<button
						type="button"
						class="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary"
						onclick={() => props.onCreateGroup(area)}
					>
						<span class="text-sm">{area.short}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Hide scrollbar but keep functionality */
	.scrollbar-none {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
	.scrollbar-none::-webkit-scrollbar {
		display: none; /* Chrome, Safari and Opera */
	}
</style>
