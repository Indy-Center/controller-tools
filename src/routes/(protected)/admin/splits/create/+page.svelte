<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import GroupTabs from '$lib/splits/GroupTabs.svelte';
	import AreaGrid from '$lib/splits/AreaGrid.svelte';
	import EmptyState from '$lib/splits/EmptyState.svelte';
	import GroupColorPicker from '$lib/splits/GroupColorPicker.svelte';

	let { data } = $props();

	// Initialize superForm with validation message
	const { form, errors, enhance, message } = superForm(data.form, {
		taintedMessage: null,
		dataType: 'json'
	});

	// Color palette for groups
	const groupColors = [
		'#7542f5', // Purple
		'#f59e0b', // Amber
		'#10b981', // Emerald
		'#3b82f6', // Blue
		'#ec4899', // Pink
		'#f43f5e', // Rose
		'#8b5cf6', // Violet
		'#06b6d4', // Cyan
		'#84cc16', // Lime
		'#14b8a6' // Teal
	];

	let activeGroupIndex: number = $state(0);
	let showNewGroupDropdown: boolean = $state(false);

	type Group = {
		name: string;
		color: string;
		areas: string[];
	};

	let groups: Group[] = $state([]);

	let activeGroup = $derived(groups[activeGroupIndex]);

	// Helper to find which group an area belongs to
	function getAreaGroup(areaId: string) {
		return groups.find((g) => g.areas.some((a) => a === areaId));
	}

	// Get next color from palette
	function getNextColor() {
		return groupColors[groups.length % groupColors.length];
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
			color: getNextColor(),
			areas: [area.id] // Initialize with the owner area
		};

		// If this is the first group, give it all unassigned areas
		if (groups.length === 0) {
			const allAreaIds = data.areas.map((a) => a.id);
			newGroup.areas = allAreaIds;
		} else {
			// Remove the area from any other group
			groups.forEach((g) => {
				g.areas = g.areas.filter((a) => a !== area.id);
			});
		}

		groups = [...groups, newGroup];
		showNewGroupDropdown = false;
		activeGroupIndex = groups.length - 1;
	}

	let areasByCategory = $derived.by(() => {
		if (!data?.areas?.length) return {};

		const reduced = data.areas.reduce((acc: Record<string, typeof data.areas>, area) => {
			// Format the group key based on category and tag
			let groupKey = area.category;
			if (area.tag && area.tag.toLowerCase() !== area.category.toLowerCase()) {
				groupKey += ` [${area.tag.toUpperCase()}]`;
			}

			if (!acc[groupKey]) acc[groupKey] = [];
			acc[groupKey].push(area);
			return acc;
		}, {});

		// Custom sort function for areas
		const sortAreas = (a: any, b: any) => {
			// Extract numbers from area shorts if they exist
			const aMatch = a.short.match(/\d+/);
			const bMatch = b.short.match(/\d+/);

			// If both have numbers, sort by number
			if (aMatch && bMatch) {
				return parseInt(aMatch[0]) - parseInt(bMatch[0]);
			}
			// If only one has a number, put numbered ones first
			if (aMatch) return -1;
			if (bMatch) return 1;
			// If neither has a number, sort alphabetically
			return a.short.localeCompare(b.short);
		};

		// Sort the areas within each group using the custom sort
		for (const category in reduced) {
			reduced[category].sort(sortAreas);
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

		// Don't allow clicking areas that match group names
		if (groups.some((g) => g.name === area.short)) return;

		if (currentGroup === activeGroup) {
			// If clicking an area in current group and it's not the first group, move it to first group
			if (currentGroup !== groups[0]) {
				removeArea(area);
			}
		} else {
			// Otherwise add it to current group
			addAreaToGroup(activeGroup, area);
		}
	}

	function removeArea(area: (typeof data.areas)[number]) {
		// Remove from all groups except the first one
		groups.forEach((g, i) => {
			if (i === 0) return;
			g.areas = g.areas.filter((a) => a !== area.id);
		});

		// Add to first group if one exists
		if (groups.length > 0) {
			groups[0].areas = [...groups[0].areas, area.id];
		}
	}

	function handleRemoveGroup(index: number) {
		if (groups.length > 1) {
			// If there are other groups, move areas to the first remaining group
			const areasToMove = groups[index].areas;
			// Remove the current group
			groups = groups.filter((_, idx) => idx !== index);
			// Find the new first group and add the areas
			if (groups.length > 0) {
				groups[0].areas = [...groups[0].areas, ...areasToMove];
			}
		} else {
			// If this is the last group, just remove it
			groups = [];
		}
		// Update active index if needed
		if (activeGroupIndex >= groups.length) {
			activeGroupIndex = Math.max(0, groups.length - 1);
		}
	}

	$effect(() => {
		$form.groups = groups;
	});
</script>

<svelte:head>
	<title>ICT - Create Split</title>
</svelte:head>

<div class="container mx-auto max-w-5xl p-4">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-content md:text-3xl dark:text-content-dark">Create Split</h1>
	</div>

	<form method="POST" action="?/create" use:enhance>
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

		<GroupTabs
			{groups}
			{activeGroupIndex}
			{availableOwnerAreas}
			{showNewGroupDropdown}
			onRemoveGroup={handleRemoveGroup}
			onSetActiveGroup={(index) => (activeGroupIndex = index)}
			onCreateGroup={createNewGroup}
			onToggleDropdown={() => (showNewGroupDropdown = !showNewGroupDropdown)}
		/>

		<!-- Empty State -->
		{#if groups.length === 0}
			<EmptyState />
		{/if}

		<!-- Group Editor-->
		{#if groups.length > 0}
			<div class="mt-4">
				<GroupColorPicker
					color={activeGroup.color}
					onColorChange={(color) => {
						groups = groups.map((g, i) => (i === activeGroupIndex ? { ...g, color } : g));
					}}
				/>

				<AreaGrid
					areas={data.areas}
					{areasByCategory}
					{activeGroup}
					{activeGroupIndex}
					{groups}
					{getAreaGroup}
					onAreaClick={handleAreaClick}
				/>
			</div>
		{/if}

		<div class="mt-6 flex items-center justify-end gap-4">
			{#if $message}
				<span class="text-sm text-content-secondary dark:text-content-dark-secondary">
					{$message}
				</span>
			{/if}
			<button
				type="submit"
				class="rounded px-4 py-2 font-medium text-white transition-colors {groups.length === 0
					? 'cursor-not-allowed bg-surface-tertiary dark:bg-surface-dark-tertiary'
					: 'bg-accent hover:bg-accent-secondary dark:bg-accent-dark dark:hover:bg-accent-dark-secondary'}"
				disabled={groups.length === 0}
			>
				Create Split
			</button>
		</div>
	</form>
</div>
