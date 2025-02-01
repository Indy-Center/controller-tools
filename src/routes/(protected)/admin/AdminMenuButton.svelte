<script lang="ts">
	import { page } from '$app/state';
	import MdiIcon from '$lib/components/MdiIcon.svelte';
	import type { MdiIconName } from '$lib/types/mdi';

	const {
		href,
		label,
		icon,
		onclick
	}: { href: string; label: string; icon?: MdiIconName; onclick?: () => void } = $props();
</script>

<a
	{href}
	class="flex items-center gap-1 rounded px-4 py-2 transition-colors hover:bg-surface-secondary focus:bg-surface-secondary focus:outline-none dark:hover:bg-surface-dark-secondary dark:focus:bg-surface-dark-secondary"
	class:bg-surface-secondary={page.url.pathname === href}
	class:dark:bg-surface-dark-secondary={page.url.pathname === href}
	{onclick}
>
	<MdiIcon name={icon} class="h-5 w-5 text-content dark:text-content-dark" />
	<span class="block text-content dark:text-content-dark">{label}</span>
</a>
