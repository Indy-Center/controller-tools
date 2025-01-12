<script lang="ts">
	import IndyLogo from '$lib/IndyLogo.svelte';
	import { page } from '$app/state';
	import logo from '$lib/assets/vnas-logo.png';
	import MdiDotsVertical from 'virtual:icons/mdi/dots-vertical';
	import MdiBookOpenVariant from 'virtual:icons/mdi/book-open-variant';
	import MdiAccountConvert from 'virtual:icons/mdi/account-convert';
	import ControllerChangeDiag from './ControllerChangeDiag.svelte';
	import PopupModal from './ModalPopup.svelte';
	import Config from './Config.svelte';
	import type { User } from '$lib/server/session';

	let { links, user }: { links: { href: string; displayName: string }[]; user: User } = $props();

	// state for mobile menu
	let menuActive = $state(false);
	let controllerPopup: any;
</script>

<nav
	class="primary relative flex h-14 w-full flex-row items-center justify-between px-4 shadow-md md:h-16 xl:justify-center"
>
	<PopupModal closeButton={true} bind:this={controllerPopup}>
		<ControllerChangeDiag />
	</PopupModal>
	<button
		class="ml-[-14px] text-3xl text-white md:hidden"
		aria-label="mobile nav menu"
		onclick={() => (menuActive = !menuActive)}>
		<MdiDotsVertical />
	</button
	>
	<a href="/" class="text-2xl font-medium text-white hover:text-zinc-200 lg:pr-4">
		<h1>ICCT</h1>
	</a>
	{#if user}
		<div class="flex items-center space-x-4 lg:flex-grow">
			<span class="text-zinc-50">
				Hello <strong>{user.firstName} {user.lastName}</strong>
			</span>
			<form class="header-nav-item" action="/logout" method="POST">
				<button
					type="submit"
					class="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:outline-none focus:ring focus:ring-red-300"
				>
					Logout
				</button>
			</form>
		</div>
	{:else}
		<div class="lg:flex-grow">
			<a
				href="/login/connect"
				class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
			>
				Login with VATSIM
			</a>
		</div>
	{/if}
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
					href="https://wiki.zidartcc.org/docs/home"
					target="_blank"
					class="text-3xl text-white"
					aria-label="Controller Procedures"
				>
					<MdiBookOpenVariant />
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
					onclick={() => controllerPopup.openModal()}
					aria-label="controller change popup"
					class="block text-3xl text-white"
				>
					<MdiAccountConvert />
					<span class="tooltip-text bg-zinc-900 text-sm">Controller Change Procedures</span>
				</button>
			</div>
		</div>
	</div>
	<ul
		id="tabs"
		class:scale-y-100={menuActive}
		class="primary absolute top-full z-40 flex w-full origin-top translate-x-[-16px] scale-y-0 flex-col overflow-hidden rounded-b-md px-1 pb-2 text-lg text-white shadow-md transition-all md:static md:w-auto md:transform-none md:flex-row md:space-x-2 md:bg-transparent lg:grow lg:justify-end xl:basis-0"
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
				<div class="tab-line"
						 class:current-tab={link.href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(link.href)}>
				</div>
			</li>
		{/each}
	</ul>
</nav>
{page?.route?.id?.replace(/\(.*?\)\//, '')}
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
