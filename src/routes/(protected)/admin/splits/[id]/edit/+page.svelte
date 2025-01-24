<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

	let { data } = $props();

	// Initialize superForm with validation message
	const { form, errors, enhance, message } = superForm(data.form, {
		taintedMessage: null,
		dataType: 'json'
	});

	let activeGroupIndex: number = $state(0);
	let showNewGroupDropdown: boolean = $state(false);

	type Group = {
		name: string;
		color: string;
		areas: string[];
	};

	let groups: Group[] = $state(
		$form.groups.length > 0
			? $form.groups
			: [
					{
						name: 'SHB 34',
						color: '#7542f5',
						areas: [...(data?.areas.map((a) => a.id) ?? [])]
					}
				]
	);

	let activeGroup = $derived(groups[activeGroupIndex]);

	// Helper to find which group an area belongs to
	function getAreaGroup(areaId: string) {
		return groups.find((g) => g.areas.some((a) => a === areaId));
	}

	// Get available areas for new groups
	let availableOwnerAreas = $derived(
		!data?.areas?.length
			? []
			: data.areas
					.filter((area) => !groups.some((g) => g.name === area.short))
					.sort((a, b) => {
						// First, compare by category
						const categoryComparison = a.category.localeCompare(b.category);
						if (categoryComparison !== 0) {
							return categoryComparison;
						}
						// If categories are the same, compare by id
						return a.id.localeCompare(b.id);
					})
	);

	function createNewGroup(area: (typeof data.areas)[number]) {
		const newGroup = {
			name: area.short,
			color: area.color,
			areas: [area.id] // Initialize with the owner area
		};

		// Remove the area from any other group (including SHB 34)
		groups.forEach((g) => {
			g.areas = g.areas.filter((a) => a !== area.id);
		});

		groups = [...groups, newGroup];
		showNewGroupDropdown = false;
		activeGroupIndex = groups.length - 1;
	}

	let areasByCategory = $derived.by(() => {
		if (!data?.areas?.length) return {};

		const reduced = data.areas.reduce((acc: Record<string, typeof data.areas>, area) => {
			if (!acc[area.category]) acc[area.category] = [];
			acc[area.category].push(area);
			return acc;
		}, {});

		for (const category in reduced) {
			reduced[category].sort((a: any, b: any) => a.id.localeCompare(b.id));
		}

		return reduced;
	});

	function addAreaToGroup(group: Group, area: (typeof data.areas)[number]) {
		if (group.areas.some((g) => g === area.id)) return;
		if (area.short === group.name) return; // Can't add an area to a group with the same name

		// Remove from other groups first
		groups.forEach((g) => {
			g.areas = g.areas.filter((a) => a !== area.id);
		});

		// Add to target group
		group.areas = [...group.areas, area.id];
	}

	function handleAreaClick(area: (typeof data.areas)[number]) {
		const currentGroup = getAreaGroup(area.id);

		if (activeGroupIndex === 0) {
			// If SHB 34 is active, clicking any area in another group will claim it back
			if (currentGroup && currentGroup !== groups[0]) {
				removeArea(area);
			}
			return;
		}

		// Don't allow clicking areas that match group names
		if (groups.some((g) => g.name === area.short)) return;

		if (currentGroup === activeGroup) {
			// If clicking an area in current group, move it to SHB 34
			removeArea(area);
		} else {
			// Otherwise add it to current group
			addAreaToGroup(activeGroup, area);
		}
	}

	function removeArea(area: (typeof data.areas)[number]) {
		// Remove from all non-SHB groups
		groups.forEach((g, i) => {
			if (i === 0) return;
			g.areas = g.areas.filter((a) => a !== area.id);
		});

		// Add to SHB 34 if not already there
		if (!groups[0].areas.some((a) => a === area.id)) {
			groups[0].areas = [...groups[0].areas, area.id];
		}
	}

	$effect(() => {
		$form.groups = groups;
	});
</script>

<svelte:head>
	<title>ICT - Edit Split</title>
</svelte:head>

<div class="container mx-auto max-w-5xl p-4">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-content md:text-3xl dark:text-content-dark">
			Edit Split: {data.split.name}
		</h1>
	</div>

	<form method="POST" action="?/update" use:enhance>
		{#if $message}
			<div class="mb-4 rounded bg-action-success/10 p-2 text-sm text-action-success">
				{$message}
			</div>
		{/if}

		{#if $errors._errors}
			<div class="mb-4 rounded bg-action-danger/10 p-2 text-sm text-action-danger">
				{$errors._errors}
			</div>
		{/if}

		<label for="name" class="mb-2 block font-medium text-content dark:text-content-dark">
			Name
		</label>
		{#if $errors.name}
			<span class="mb-2 text-sm text-action-danger">{$errors.name}</span>
		{/if}
		<input
			type="text"
			id="name"
			name="name"
			bind:value={$form.name}
			class="mb-4 w-full rounded border border-surface-tertiary bg-surface px-3 py-2 dark:border-surface-dark-tertiary dark:bg-surface-dark"
			required
		/>

		{#if $errors.groups}
			<div class="mb-4 rounded bg-action-danger/10 p-2 text-sm text-action-danger">
				{$errors.groups}
			</div>
		{/if}

		<!-- Tabs for Groups -->
		<div class="flex gap-x-2 border-b border-surface-tertiary dark:border-surface-dark-tertiary">
			{#each groups as group, i}
				<div class="group relative">
					<button
						type="button"
						class="rounded-t-lg px-4 py-2 transition-colors {activeGroupIndex === i
							? 'border-x border-t border-surface-tertiary bg-surface-secondary dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary'
							: 'hover:bg-surface hover:dark:bg-surface-dark'}"
						onclick={() => (activeGroupIndex = i)}
					>
						<div class="flex items-center gap-2">
							<div class="h-3 w-3 rounded-full" style="background-color: {group.color}"></div>
							<span
								class="font-medium {activeGroupIndex === i
									? 'text-content dark:text-content-dark'
									: 'text-content-secondary dark:text-content-dark-secondary'}"
							>
								{group.name}
							</span>
						</div>
					</button>
					{#if i > 0}
						<button
							type="button"
							class="absolute -right-2 -top-2 hidden rounded-full bg-surface p-1 text-content-secondary shadow-lg hover:bg-surface-secondary group-hover:block dark:bg-surface-dark dark:text-content-dark-secondary dark:hover:bg-surface-dark-secondary"
							onclick={() => {
								// Move areas back to SHB 34
								groups[0].areas = [...groups[0].areas, ...group.areas];
								// Remove the group
								groups = groups.filter((_, idx) => idx !== i);
								// Update active index if needed
								if (activeGroupIndex >= groups.length) {
									activeGroupIndex = groups.length - 1;
								}
							}}
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

			<!-- New Group Button + Dropdown -->
			<div class="relative">
				<button
					type="button"
					class="flex h-full items-center gap-2 rounded-t-lg px-4 py-2 text-content-secondary transition-colors hover:bg-surface dark:text-content-dark-secondary dark:hover:bg-surface-dark"
					onclick={() => (showNewGroupDropdown = !showNewGroupDropdown)}
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					<span class="font-medium">New Group</span>
				</button>

				{#if showNewGroupDropdown}
					<div
						class="absolute left-0 top-full z-10 mt-1 h-64 max-h-64 w-48 overflow-auto rounded-lg border border-surface-tertiary bg-surface p-2 shadow-lg dark:border-surface-dark-tertiary dark:bg-surface-dark"
					>
						{#each availableOwnerAreas as area}
							<button
								type="button"
								class="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary"
								onclick={() => createNewGroup(area)}
							>
								<div class="h-2 w-2 rounded-full" style="background-color: {area.color}"></div>
								<span class="text-sm">{area.short}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Group Editor-->
		<div class="mt-4">
			<div class="mb-4 flex items-center gap-2">
				<label for="groupColor" class="mb-2 block font-medium text-content dark:text-content-dark"
					>Group Color</label
				>
				<input
					id="groupColor"
					type="color"
					value={activeGroup.color}
					class="h-8 w-8 cursor-pointer rounded"
					oninput={(e) => {
						const newColor = e.currentTarget.value;
						groups = groups.map((g, i) => (i === activeGroupIndex ? { ...g, color: newColor } : g));
					}}
				/>
			</div>

			<!-- Area Selection -->
			<div class="grid grid-cols-2 gap-8 p-2">
				<!-- Center Areas -->
				<div>
					<label
						for="center-areas"
						class="mb-2 block font-medium text-content dark:text-content-dark">Center Areas</label
					>
					<div id="center-areas" role="group" class="grid grid-cols-4 gap-2">
						{#each areasByCategory['Center'] ?? [] as area}
							{@const areaGroup = getAreaGroup(area.id)}
							{@const isOwnerArea = groups.some((g) => g.name === area.short)}
							<button
								type="button"
								class="relative rounded border px-3 py-2 text-left text-sm transition-colors
										{isOwnerArea
									? 'cursor-not-allowed border-accent bg-accent/10 text-content-secondary dark:border-accent-dark dark:bg-accent-dark/10'
									: areaGroup === activeGroup
										? 'border-accent bg-accent-muted text-content dark:border-accent-dark dark:bg-accent-dark-muted dark:text-content-dark'
										: areaGroup
											? 'border-surface-tertiary bg-surface-secondary text-content-secondary dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary dark:text-content-dark-secondary'
											: 'border-surface-tertiary bg-surface hover:bg-accent-muted dark:border-surface-dark-tertiary dark:bg-surface-dark dark:hover:bg-accent-dark-muted'}"
								onclick={() => handleAreaClick(area)}
								disabled={isOwnerArea ||
									(activeGroupIndex === 0 && (!areaGroup || areaGroup === groups[0]))}
							>
								{#if areaGroup && areaGroup !== activeGroup}
									<div
										class="absolute right-1 top-1 h-2 w-2 rounded-full"
										style="background-color: {areaGroup.color}"
									></div>
								{/if}
								{area.short}
							</button>
						{/each}
					</div>
				</div>

				<!-- Terminal Areas -->
				<div>
					<label
						for="terminal-areas"
						class="mb-2 block font-medium text-content dark:text-content-dark">Terminal Areas</label
					>
					<div id="terminal-areas" role="group" class="grid grid-cols-4 gap-2">
						{#each areasByCategory['Terminal'] ?? [] as area}
							{@const areaGroup = getAreaGroup(area.id)}
							{@const isOwnerArea = groups.some((g) => g.name === area.short)}
							<button
								type="button"
								class="relative rounded border px-3 py-2 text-left text-sm transition-colors
										{isOwnerArea
									? 'cursor-not-allowed border-accent bg-accent/10 text-content-secondary dark:border-accent-dark dark:bg-accent-dark/10'
									: areaGroup === activeGroup
										? 'border-accent bg-accent-muted text-content dark:border-accent-dark dark:bg-accent-dark-muted dark:text-content-dark'
										: areaGroup
											? 'border-surface-tertiary bg-surface-secondary text-content-secondary dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary dark:text-content-dark-secondary'
											: 'border-surface-tertiary bg-surface hover:bg-accent-muted dark:border-surface-dark-tertiary dark:bg-surface-dark dark:hover:bg-accent-dark-muted'}"
								onclick={() => handleAreaClick(area)}
								disabled={isOwnerArea ||
									(activeGroupIndex === 0 && (!areaGroup || areaGroup === groups[0]))}
							>
								{#if areaGroup && areaGroup !== activeGroup}
									<div
										class="absolute right-1 top-1 h-2 w-2 rounded-full"
										style="background-color: {areaGroup.color}"
									></div>
								{/if}
								{area.short}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<div class="mt-6 flex items-center justify-end gap-4">
			{#if $message}
				<span class="text-sm text-content-secondary dark:text-content-dark-secondary">
					{$message}
				</span>
			{/if}
			<button
				type="submit"
				class="rounded bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-secondary dark:bg-accent-dark dark:hover:bg-accent-dark-secondary"
			>
				Update Split
			</button>
		</div>
	</form>
</div>
