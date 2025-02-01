<script lang="ts">
	import { page } from '$app/state';
	import MdiIcon from '../MdiIcon.svelte';

	type NavigationTabsProps = {
		links: { href: string; displayName: string }[];
	};

	let { links }: NavigationTabsProps = $props();
	let isMenuOpen = $state(false);
</script>

<div class="flex w-full items-center justify-end md:w-auto">
	<button
		type="button"
		class="my-auto p-2 text-content-secondary md:hidden dark:text-content-dark-secondary"
		onclick={() => (isMenuOpen = !isMenuOpen)}
		aria-label="Toggle menu"
	>
		{#if isMenuOpen}
			<MdiIcon name="close" class="h-6 w-6" />
		{:else}
			<MdiIcon name="menu" class="h-6 w-6" />
		{/if}
	</button>
</div>

<div
	class="absolute left-0 top-full z-[900] flex w-full origin-top flex-col overflow-hidden bg-surface-secondary text-lg transition-all md:static md:w-auto md:transform-none md:flex-row md:space-x-2 md:bg-transparent lg:grow lg:justify-end xl:basis-0 dark:bg-surface-dark"
	class:scale-y-0={!isMenuOpen}
	class:scale-y-100={isMenuOpen}
>
	<ul
		id="tabs"
		class="flex w-full origin-top flex-col overflow-hidden text-lg transition-all md:static md:w-auto md:transform-none md:flex-row md:space-x-2 md:bg-transparent lg:grow lg:justify-end xl:basis-0"
	>
		{#each links as link}
			<li class="flex w-full justify-center p-1 md:w-auto">
				<a
					class="relative inline-block px-2 py-1 text-center text-content-secondary transition-colors duration-300 hover:text-content dark:text-content-dark-secondary dark:hover:text-content-dark"
					class:after:absolute={link.href === '/'
						? page.url.pathname === '/'
						: page.url.pathname.startsWith(link.href)}
					class:after:bottom-0={link.href === '/'
						? page.url.pathname === '/'
						: page.url.pathname.startsWith(link.href)}
					class:after:left-0={link.href === '/'
						? page.url.pathname === '/'
						: page.url.pathname.startsWith(link.href)}
					class:after:h-[2px]={link.href === '/'
						? page.url.pathname === '/'
						: page.url.pathname.startsWith(link.href)}
					class:after:w-full={link.href === '/'
						? page.url.pathname === '/'
						: page.url.pathname.startsWith(link.href)}
					class:after:bg-content-secondary={link.href === '/'
						? page.url.pathname === '/'
						: page.url.pathname.startsWith(link.href)}
					class:after:dark:bg-content-dark-secondary={link.href === '/'
						? page.url.pathname === '/'
						: page.url.pathname.startsWith(link.href)}
					href={link.href}
					onclick={() => (isMenuOpen = false)}
				>
					{link.displayName}
				</a>
			</li>
		{/each}
	</ul>
</div>
