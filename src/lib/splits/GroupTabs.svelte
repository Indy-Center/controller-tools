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

<!-- Outer container -->
<div class="relative flex">
	<!-- Scrollable container for tabs -->
	<div class="scrollbar-none flex gap-x-1 overflow-x-auto">
		{#each props.groups as group, i}
			<div class="group relative shrink-0">
				<button
					type="button"
					class="relative flex items-center gap-2 px-4 py-3 pr-8 transition-all {props.activeGroupIndex ===
					i
						? 'text-content dark:text-content-dark'
						: 'text-content-secondary hover:text-content dark:text-content-dark-secondary dark:hover:text-content-dark'}"
					onclick={() => props.onSetActiveGroup(i)}
				>
					<div class="h-2.5 w-2.5 rounded-full" style="background-color: {group.color}"></div>
					<span class="font-medium">
						{group.name}
					</span>
					{#if props.activeGroupIndex === i}
						<div
							class="absolute bottom-0 left-4 right-4 h-0.5"
							style="background-color: {group.color}"
						></div>
					{/if}
				</button>
				{#if props.groups.length > 0}
					<button
						type="button"
						class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-content-secondary opacity-0 transition-all hover:text-action-danger group-hover:opacity-100 dark:text-content-dark-secondary dark:hover:text-action-danger"
						onclick={() => props.onRemoveGroup(i)}
						aria-label="Remove group"
					>
						<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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

	<!-- New Group Button + Dropdown -->
	<div class="relative shrink-0">
		<button
			type="button"
			class="flex h-full items-center gap-2 px-4 py-3 text-content-secondary transition-all hover:text-content dark:text-content-dark-secondary dark:hover:text-content-dark"
			onclick={() => props.onToggleDropdown()}
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			<span class="font-medium">New Group</span>
		</button>

		{#if props.showNewGroupDropdown}
			<div
				class="absolute left-0 top-full z-10 mt-1 h-64 max-h-64 w-48 overflow-auto rounded-lg border border-surface-tertiary bg-surface p-2 shadow-sm dark:border-surface-dark-tertiary dark:bg-surface-dark"
			>
				{#each props.availableOwnerAreas as area}
					<button
						type="button"
						class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-content-secondary hover:bg-surface-secondary hover:text-content dark:text-content-dark-secondary dark:hover:bg-surface-dark-secondary dark:hover:text-content-dark"
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
