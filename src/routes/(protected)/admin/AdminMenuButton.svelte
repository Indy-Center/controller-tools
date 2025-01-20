<script lang="ts">
	import { page } from '$app/state';
	import type { Component } from 'svelte';

	const { href, label, Icon }: { href: string; label: string; Icon?: Component } = $props();
</script>

<a
	{href}
	class="hover:bg-surface-secondary hover:dark:bg-surface-dark-secondary focus:bg-surface-secondary focus:dark:bg-surface-dark-secondary flex items-center gap-1 rounded px-4 py-2 focus:outline-none"
	class:bg-surface-secondary={page.url.pathname === href}
	class:dark:bg-surface-dark-secondary={page.url.pathname === href}
>
	<Icon class="text-content dark:text-content-dark" />
	<span class="text-content dark:text-content-dark -mt-1 block">{label}</span>
</a>
