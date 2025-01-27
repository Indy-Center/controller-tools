<script lang="ts">
	type Group = {
		name: string;
		color: string;
	};

	let { groups = [] } = $props<{ groups: Group[] }>();
</script>

<div
	class="absolute bottom-4 left-4 z-[450] max-h-[40vh] w-full max-w-[calc(100%-2rem)] overflow-y-auto rounded-lg bg-surface/95 p-4 shadow-lg backdrop-blur-md sm:max-w-xs dark:bg-surface-dark/95"
>
	<h3 class="mb-2 text-sm font-medium text-content dark:text-content-dark">Legend</h3>
	<div class="flex flex-wrap gap-3 sm:flex-col">
		{#each groups as group}
			<div class="flex min-w-[120px] items-center gap-2">
				<div class="h-4 w-4 flex-shrink-0 rounded-sm" style:background-color={group.color}></div>
				<span class="truncate text-sm text-content dark:text-content-dark">{group.name}</span>
			</div>
		{/each}
	</div>
</div>
