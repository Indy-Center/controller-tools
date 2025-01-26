<script lang="ts">
	import ControllerInfo from '$lib/components/controllerInfo/ControllerInfo.svelte';
	import type { ControllersResponse } from '$lib/api';

	let { controllers }: { controllers: ControllersResponse } = $props();
</script>

<h2 class="bg-zinc-600 px-2 py-1 text-xl text-white">Online Controllers</h2>
<div
	class="max-h-[calc(50vh-40px)] flex-1 overflow-y-auto border-t border-t-zinc-400 text-sm dark:border-t-zinc-100"
>
	{#if controllers.length > 0}
		{#each controllers as controller}
			<ControllerInfo {controller} />
		{/each}
	{:else}
		<div class="w-full p-4 text-sm">No Controllers Online</div>
	{/if}
</div>
