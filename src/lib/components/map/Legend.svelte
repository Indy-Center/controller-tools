<script lang="ts">
	type Group = {
		name: string;
		color: string;
		frequency?: string;
	};

	let { groups = [] } = $props<{ groups: Group[] }>();
</script>

<div
	class="max-h-[40vh] w-full min-w-[280px] overflow-y-auto rounded-lg bg-surface/95 p-4 shadow-lg backdrop-blur-md sm:w-[320px] dark:bg-surface-dark/95"
>
	<h3 class="mb-2 text-sm font-medium text-content dark:text-content-dark">Legend</h3>
	<div class="flex flex-col divide-y divide-content/10">
		{#each groups as group}
			<div class="group flex min-w-[120px] items-center gap-2 px-1 py-2 hover:bg-content/5">
				<div class="h-4 w-4 flex-shrink-0 rounded-sm" style:background-color={group.color}></div>
				<div class="flex flex-1 justify-between gap-4">
					<span class="text-sm text-content dark:text-content-dark">{group.name}</span>
					{#if group.frequency}
						<span class="font-mono text-sm tabular-nums text-content/75 dark:text-content-dark/75"
							>{group.frequency}</span
						>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
