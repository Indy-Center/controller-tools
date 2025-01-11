<script lang="ts">
	import { page } from '$app/state';
	import type { Component } from 'svelte';

	const { href, label, Icon }: { href: string; label: string; Icon?: Component } = $props();
</script>

<a
	{href}
	class="flex items-center gap-1 rounded px-4 py-2 hover:bg-zinc-700 focus:bg-zinc-700 focus:outline-none"
	class:bg-zinc-800={page.url.pathname === href}
>
	<Icon />
	<span class="-mt-1 block">{label}</span>
</a>
