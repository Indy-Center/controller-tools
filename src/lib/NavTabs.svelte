<script lang="ts">
	import IndyLogo from '$lib/IndyLogo.svelte';
	import { page } from '$app/state';
	import logo from '$lib/assets/vnas-logo.png';
	import MdiDotsVertical from 'virtual:icons/mdi/dots-vertical';
	import MdiBookOpenVariant from 'virtual:icons/mdi/book-open-variant';
	import MdiAccountConvert from 'virtual:icons/mdi/account-convert';

	let { links }: { links: { href: string; displayName: string }[] } = $props();
	let menuActive = $state(false);
</script>

<nav
	class="relative flex w-full flex-row items-center justify-between bg-zinc-700 px-4 shadow-md md:h-16 dark:bg-zinc-900"
>
	<button
		class="ml-[-12px] text-3xl text-white md:hidden"
		aria-label="mobile nav menu"
		onclick={() => (menuActive = !menuActive)}><MdiDotsVertical /></button
	>
	<div class="hidden lg:flex">
		<a class="" href="https://zidartcc.org" target="_blank">
			<div class="flex items-center gap-x-2 text-2xl font-medium text-white hover:text-zinc-200">
				<div class="w-32"><IndyLogo /></div>
			</div>
		</a>
		<div class="align-center ml-6 flex gap-3">
			<div class="tooltip">
				<a
					href="https://wiki.zidartcc.org"
					target="_blank"
					class="text-3xl text-white"
					aria-label="Controller Procedures"
					><MdiBookOpenVariant />
					<span class="tooltip-text bg-zinc-900 text-sm">vZID Controller Documents</span>
				</a>
			</div>
			<div class="tooltip">
				<a
					href="https://crc.virtualnas.net/docs/#/"
					target="_blank"
					aria-label="CRC Documentation"
					class=""
				>
					<img src={logo} alt="vNAS Logo" width="30px" class="pt-1" />
					<span class="tooltip-text bg-zinc-900 text-sm">CRC Documentation</span>
				</a>
			</div>
			<div class="tooltip">
				<a
					href="#controller-change"
					aria-label="controller change popup"
					class="text-3xl text-white"
					><MdiAccountConvert />
					<span class=" tooltip-text bg-zinc-900 text-sm">Controller Change Procedures</span>
				</a>
			</div>
		</div>
	</div>
	<a href="/">
		<div class="flex items-center gap-x-2 text-2xl font-medium text-white hover:text-zinc-200">
			<h1>Controller Tools</h1>
		</div>
	</a>
	<ul
		class:scale-y-100={menuActive}
		class="absolute z-50 flex w-4/5 origin-top translate-x-[-19px] translate-y-[149px] scale-y-0 list-none flex-col overflow-hidden rounded-lg bg-zinc-700 pb-1 text-lg text-white transition-all md:relative md:w-auto md:transform-none md:flex-row md:space-x-2 dark:bg-zinc-900"
	>
		{#each links as link}
			<li class="p-2 hover:text-zinc-200" class:active={page.url.pathname === link.href}>
				<a
					onclick={() => (menuActive = false)}
					class="block h-full w-full text-center"
					href={link.href}
				>
					{link.displayName}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	li {
		position: relative;
	}

	li.active::after {
		left: 3%;
		right: 3%;
	}

	li:hover::after {
		left: 33%;
		right: 33%;
	}

	li:active::after {
		left: 6%;
		right: 6%;
	}

	li::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 100%;
		right: 100%;
		height: 3px;
		background-color: currentColor;
		border-radius: 2px;
		transform: translateY(6px);
		transform: translateX(1px);
		transition: all 0.3s ease;
		transform-origin: left;
	}

	.tooltip {
		position: relative;
		display: inline-block;
	}

	.tooltip .tooltip-text {
		visibility: hidden;
		width: 120px;
		background-color: black;
		color: #fff;
		text-align: center;
		border-radius: 0.5rem;
		padding: 3px 0;
		top: 107%;
		left: 50%;
		margin-left: -60px;
		position: absolute;
		z-index: 1;
		opacity: 91%;
	}

	.tooltip:hover .tooltip-text {
		visibility: visible;
	}
</style>
