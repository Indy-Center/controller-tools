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

	let groups: Group[] = $state($form.groups.length > 0 ? $form.groups : []);

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
	<title>ICT - Edit Split</title>
</svelte:head>

<div class="flex h-full w-full flex-col p-6">
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-content dark:text-content-dark">
			Edit Split: {data.split.name}
		</h1>
	</div>

	<form
		method="POST"
		action="?/update"
		use:enhance
		class="flex h-full w-full flex-1 flex-col gap-6"
	>
		{#if $message}
			<div class="rounded-md bg-action-success/10 p-3 text-sm text-action-success">
				{$message}
			</div>
		{/if}

		{#if $errors._errors}
			<div class="rounded-md bg-action-danger/10 p-3 text-sm text-action-danger">
				{$errors._errors}
			</div>
		{/if}

		<div class="space-y-2">
			<label for="name" class="block font-medium text-content dark:text-content-dark"> Name </label>
			{#if $errors.name}
				<span class="text-sm text-action-danger">{$errors.name}</span>
			{/if}
			<input
				type="text"
				id="name"
				name="name"
				bind:value={$form.name}
				class="w-full rounded-lg border border-surface-tertiary bg-surface p-3 text-sm text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				required
			/>
		</div>

		{#if $errors.groups}
			<div class="rounded-md bg-action-danger/10 p-3 text-sm text-action-danger">
				{$errors.groups}
			</div>
		{/if}

		<div
			class="flex w-full flex-1 flex-col overflow-hidden rounded-lg border border-surface-tertiary bg-surface shadow-sm dark:border-surface-dark-tertiary dark:bg-surface-dark"
		>
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
				<div class="flex flex-1 flex-col overflow-auto p-4">
					<GroupColorPicker
						color={activeGroup.color}
						onColorChange={(color) => {
							groups = groups.map((g, i) => (i === activeGroupIndex ? { ...g, color } : g));
						}}
					/>

					<div class="flex-1">
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
				</div>
			{/if}
		</div>

		<div class="flex justify-end gap-3">
			<a
				href="/admin/splits"
				class="rounded-md bg-surface-secondary px-4 py-2 text-sm font-medium text-content-secondary transition-all hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-surface-tertiary/20 dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-surface-dark-tertiary"
			>
				Cancel
			</a>
			<button
				type="submit"
				class="rounded-md bg-action-success px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
			>
				Save Changes
			</button>
		</div>
	</form>
</div>
