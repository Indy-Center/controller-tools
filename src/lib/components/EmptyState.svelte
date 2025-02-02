<script lang="ts">
	import type { MdiIconName } from '$lib/types/mdi';
	import MdiIcon from './MdiIcon.svelte';

	let {
		icon,
		message
	}: {
		icon: MdiIconName;
		message: string;
	} = $props();
</script>

<div class="w-full">
	<div
		class="flex flex-col items-center justify-center rounded-lg border border-surface-tertiary bg-surface p-12 shadow-sm transition-all dark:border-surface-dark-tertiary dark:bg-surface-dark"
	>
		<div class="mb-4 h-12 w-12 text-content-secondary dark:text-content-dark-secondary">
			<MdiIcon name={icon} class="h-full w-full" />
		</div>
		<p class="text-center text-content-secondary dark:text-content-dark-secondary">{message}</p>
	</div>
</div>
