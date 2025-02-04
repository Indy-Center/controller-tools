<script lang="ts">
	import { page } from '$app/stores';
	import MdiIcon from '$lib/components/MdiIcon.svelte';
	import { type MdiIconName } from '$lib/types/mdi';

	let {
		href,
		label,
		icon,
		onclick = undefined
	} = $props<{
		href: string;
		label: string;
		icon: MdiIconName;
		onclick?: () => void;
	}>();

	let isActive = $derived.by(() => {
		return href === '/admin'
			? $page.url.pathname === '/admin'
			: $page.url.pathname.startsWith(`${href}/`) || $page.url.pathname === href;
	});
</script>

<a
	{href}
	{onclick}
	class={`flex items-center gap-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
		isActive
			? 'bg-accent/10 text-accent dark:bg-accent-dark/10 dark:text-accent-dark'
			: 'text-content-secondary hover:bg-surface-secondary dark:text-content-dark-secondary dark:hover:bg-surface-dark-secondary'
	}`}
>
	<MdiIcon name={icon} class="h-5 w-5" />
	{label}
</a>
