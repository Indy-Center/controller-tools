<script lang="ts">
	import IndyLogo from '$lib/IndyLogo.svelte';
	import { page } from '$app/state';
	import logo from '$lib/assets/vnas-logo.png';
	import MdiDotsVertical from 'virtual:icons/mdi/dots-vertical';
	import MdiBookOpenVariant from 'virtual:icons/mdi/book-open-variant';
	import MdiAccountConvert from 'virtual:icons/mdi/account-convert';
	import ControllerChangeDiag from './ControllerChangeDiag.svelte';

	let { links }: { links: { href: string; displayName: string }[] } = $props();

	// state for mobile menu
	let menuActive = $state(false);

	//state and a setter for the controller brief popup
	let controllerPopupOpen = $state(false);
	const closeControllerPopup = (): void => {
		controllerPopupOpen = false;
	};
</script>

<nav
	class="relative flex h-14 w-full flex-row items-center justify-between  px-4 shadow-md md:h-16 xl:justify-center primary"
>
	<ControllerChangeDiag onClose={closeControllerPopup} status={controllerPopupOpen} />
	<button
		class="ml-[-14px] text-3xl text-white md:hidden"
		aria-label="mobile nav menu"
		onclick={() => (menuActive = !menuActive)}><MdiDotsVertical /></button
	>
	<a href="/" class="text-2xl font-medium text-white hover:text-zinc-200 lg:flex-grow">
		<h1>ICCT</h1>
	</a>
	<div class="hidden md:flex xl:basis-0">
		<div id="buttons" class="align-center ml-6 flex gap-3">
		<div class="tooltip w-8">
			<a class="text-3xl text-white" href="https://zidartcc.org" target="_blank">
					<IndyLogo />
					<span class="tooltip-text primary text-sm">Indy Center Website</span>
			</a>
		</div>
			<div class="tooltip">
				<a
					href="https://wiki.zidartcc.org"
					target="_blank"
					class="text-3xl text-white"
					aria-label="Controller Procedures"
					><MdiBookOpenVariant />
					<span class="tooltip-text primary text-sm">vZID Controller Documents</span>
				</a>
			</div>
			<div class="tooltip w-8">
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
				<button
					onclick={() => (controllerPopupOpen = true)}
					aria-label="controller change popup"
					class="block text-3xl text-white"
					><MdiAccountConvert />
					<span class="tooltip-text bg-zinc-900 text-sm">Controller Change Procedures</span>
				</button>
			</div>
		</div>
	</div>
	<ul
		id="tabs"
		class:scale-y-100={menuActive}
		class="primary absolute flex w-full origin-top translate-x-[-16px] translate-y-[53px] scale-y-0 list-none flex-col overflow-hidden rounded-b-lg pb-1 text-lg text-white transition-all md:relative md:w-auto md:transform-none md:flex-row md:space-x-2 lg:grow lg:justify-end xl:basis-0"
		class="primary absolute flex w-full origin-top translate-x-[-16px] translate-y-[53px] scale-y-0 list-none flex-col overflow-hidden rounded-b-lg pb-1 text-lg text-white transition-all md:relative md:w-auto md:transform-none md:flex-row md:space-x-2 lg:grow lg:justify-end xl:basis-0"
	>
		{#each links as link}
			<li class="p-2 hover:text-zinc-200">
				<a
					onclick={() => (menuActive = false)}
					class=" block h-full w-full text-center"
					href={link.href}
				>
					{link.displayName}
				</a>
				<div class="tab-line" class:current-tab={page.url.pathname === link.href}></div>
			</li>
		{/each}
	</ul>
</nav>

<style>
	#tabs .tab-line.current-tab {
		width: 90%;
		@media (max-width: 765px) {
			width: 45%;
		}
	}

	#tabs li:hover .tab-line:not(.current-tab) {
		width: 30%;
	}

	#tabs li:active .tab-line:not(.current-tab) {
		width: 80%;
	}

	#tabs .tab-line {
		width: 0%;
		height: 3px;
		background-color: currentColor;
		border-radius: 2px;
		transition: width 0.3s ease;
		margin: 0 auto;
	}

	#buttons .tooltip {
		position: relative;
		display: inline-block;
	}

	#buttons .tooltip .tooltip-text {
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
		z-index: 40;
		opacity: 91%;
	}

	#buttons .tooltip:hover .tooltip-text {
		visibility: visible;
	}
</style>
