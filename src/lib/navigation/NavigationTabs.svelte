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
		class="my-auto p-2 text-white md:hidden"
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
	class="primary absolute left-0 top-full z-40 flex w-full origin-top flex-col overflow-hidden bg-zinc-800 text-lg text-white transition-all md:static md:w-auto md:transform-none md:flex-row md:space-x-2 md:bg-transparent lg:grow lg:justify-end xl:basis-0"
	class:scale-y-0={!isMenuOpen}
	class:scale-y-100={isMenuOpen}
>
	{#each links as link}
		<li class="flex w-full justify-center p-1 md:w-auto">
			<a
				class="relative inline-block px-2 py-1 text-center transition-colors duration-300 hover:text-zinc-200"
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
				class:after:bg-white={link.href === '/'
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
