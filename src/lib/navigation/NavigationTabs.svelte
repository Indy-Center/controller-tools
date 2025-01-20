<script lang="ts">
	import { page } from '$app/state';
	import MdiMenu from 'virtual:icons/mdi/menu';
	import MdiClose from 'virtual:icons/mdi/close';

	type NavigationTabsProps = {
		links: { href: string; displayName: string }[];
	};

	let { links }: NavigationTabsProps = $props();
	let isMenuOpen = $state(false);
</script>

<div class="flex w-full items-center justify-end md:w-auto">
	<button
		type="button"
		class="text-content-secondary dark:text-content-dark-secondary my-auto p-2 md:hidden"
		onclick={() => (isMenuOpen = !isMenuOpen)}
		aria-label="Toggle menu"
	>
		{#if isMenuOpen}
			<MdiClose class="h-6 w-6" />
		{:else}
			<MdiMenu class="h-6 w-6" />
		{/if}
	</button>
</div>

<ul
	id="tabs"
	class="bg-surface-secondary dark:bg-surface-dark absolute left-0 top-full z-40 flex w-full origin-top flex-col overflow-hidden text-lg transition-all md:static md:w-auto md:transform-none md:flex-row md:space-x-2 md:bg-transparent lg:grow lg:justify-end xl:basis-0"
	class:scale-y-0={!isMenuOpen}
	class:scale-y-100={isMenuOpen}
>
	{#each links as link}
		<li class="flex w-full justify-center p-1 md:w-auto">
			<a
				class="text-content-secondary dark:text-content-dark-secondary hover:text-content dark:hover:text-content-dark relative inline-block px-2 py-1 text-center transition-colors duration-300"
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
