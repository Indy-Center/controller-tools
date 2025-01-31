<script lang="ts">
	import ControllerInfo from '$lib/components/controllerInfo/ControllerInfo.svelte';
	import type { ControllersResponse } from '$lib/api';
	import RadarTowerIcon from 'virtual:icons/mdi/radar';

	let { controllers }: { controllers: ControllersResponse } = $props();
</script>

<div
	class="max-h-[40vh] overflow-y-auto rounded-lg bg-surface/95 p-4 shadow-lg backdrop-blur-md dark:bg-surface-dark/95"
>
	<h3 class="mb-2 flex items-center gap-2 text-sm font-medium text-content dark:text-content-dark">
		<RadarTowerIcon class="h-5 w-5" />
		Online Controllers
	</h3>
	<div class="flex flex-col divide-y divide-content/5">
		{#if controllers.length > 0}
			{#each controllers as controller}
				<ControllerInfo {controller} />
			{/each}
		{:else}
			<div class="py-2 text-content dark:text-content-dark">No Controllers Online</div>
		{/if}
	</div>
</div>
