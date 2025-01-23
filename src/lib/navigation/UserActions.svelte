<script lang="ts">
	import MdiLogout from 'virtual:icons/mdi/logout';
	import MdiChevronDown from 'virtual:icons/mdi/chevron-down';
	import MdiLink from 'virtual:icons/mdi/link';
	import MdiBookOpenVariant from 'virtual:icons/mdi/book-open-variant';
	import MdiRadar from 'virtual:icons/mdi/radar';
	import MdiAccountConvert from 'virtual:icons/mdi/account-convert';
	import MdiAccountPlus from 'virtual:icons/mdi/account-plus';
	import { theme } from '$lib/state.svelte';
	import Modal from '$lib/Modal.svelte';
	import ControllerChangeDiag from '$lib/ControllerChangeDiag.svelte';

	let { user } = $props();
	let controllerPopup: ReturnType<typeof Modal>;

	const quickLinks = [
		{
			title: 'Indy Center Website',
			link: 'https://zidartcc.org',
			Icon: MdiLink
		},
		{
			title: 'vZID Controller Documents',
			link: 'https://wiki.zidartcc.org/docs/home',
			Icon: MdiBookOpenVariant
		},
		{
			title: 'CRC Documentation',
			link: 'https://crc.virtualnas.net/docs/#/',
			Icon: MdiRadar
		}
	];

	function toggleTheme() {
		theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
	}
</script>

<div
	class="group relative flex items-center gap-x-3 text-content-secondary dark:text-content-dark-secondary"
>
	<div class="flex cursor-pointer items-center gap-1 font-medium">
		<span class="font-normal">Hello, </span>
		{#if user}
			<span>{user.firstName}!</span>
		{:else}
			<span>Guest!</span>
		{/if}
		<MdiChevronDown class="h-5 w-5 transition-transform group-hover:rotate-180" />
	</div>

	<div
		class="pointer-events-none absolute left-0 top-[calc(100%+0.5rem)] z-50 hidden min-w-[280px] translate-x-[0%] flex-col gap-2 rounded-md border border-surface-tertiary bg-surface p-3 shadow-lg before:absolute before:top-[-12px] before:h-3 before:w-full before:content-[''] group-hover:pointer-events-auto group-hover:flex dark:border-surface-dark-tertiary dark:bg-surface-dark"
	>
		{#if user}
			<form action="/logout" method="POST" class="w-full">
				<button
					type="submit"
					class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-content-secondary hover:bg-surface-secondary hover:text-content focus:outline-none focus:ring focus:ring-surface-tertiary dark:text-content-dark-secondary dark:hover:bg-surface-dark-secondary dark:hover:text-content-dark dark:focus:ring-surface-dark-tertiary"
				>
					<MdiLogout class="h-5 w-5" />
					<span>Logout</span>
				</button>
			</form>
		{:else}
			<a
				href="/login/connect"
				class="flex w-full items-center gap-2 rounded-md bg-accent px-3 py-2 text-left text-sm text-white hover:bg-accent/90 focus:outline-none focus:ring focus:ring-surface-tertiary"
			>
				<MdiAccountPlus class="h-5 w-5" />
				<span>Connect VATSIM</span>
			</a>
		{/if}

		<div class="my-1 h-px bg-surface-tertiary dark:bg-surface-dark-tertiary"></div>

		<div class="flex items-center justify-between px-3 py-2">
			<span class="text-sm text-content-secondary dark:text-content-dark-secondary">Dark Mode</span>
			<label class="relative inline-flex cursor-pointer items-center">
				<input
					type="checkbox"
					class="peer sr-only"
					checked={$theme === 'dark'}
					onchange={toggleTheme}
				/>
				<div
					class="peer h-6 w-11 rounded-full bg-surface-tertiary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent peer-checked:after:translate-x-full peer-focus:ring-surface-tertiary dark:bg-surface-dark-tertiary"
				></div>
			</label>
		</div>

		<div class="my-1 h-px bg-surface-tertiary dark:bg-surface-dark-tertiary"></div>

		<div class="px-3 text-sm font-medium text-content-secondary dark:text-content-dark-secondary">
			Quick Links
		</div>

		{#each quickLinks as { link, title, Icon }}
			<a
				href={link}
				target="_blank"
				class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-content-secondary hover:bg-surface-secondary hover:text-content dark:text-content-dark-secondary dark:hover:bg-surface-dark-secondary dark:hover:text-content-dark"
			>
				<Icon class="h-5 w-5" />
				<span>{title}</span>
			</a>
		{/each}

		<button
			onclick={() => controllerPopup.open()}
			class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-content-secondary hover:bg-surface-secondary hover:text-content dark:text-content-dark-secondary dark:hover:bg-surface-dark-secondary dark:hover:text-content-dark"
		>
			<MdiAccountConvert class="h-5 w-5" />
			<span>Controller Change Procedures</span>
		</button>

		<div class="my-1 h-px bg-surface-tertiary dark:bg-surface-dark-tertiary"></div>

		<div class="flex flex-col gap-1 px-3 py-1">
			<a
				href="http://wiki.zidartcc.org/docs/icct"
				target="_blank"
				class="text-xs text-content-secondary hover:text-content dark:text-content-dark-secondary dark:hover:text-content-dark"
				>Read the user manual</a
			>
			<a
				href="https://github.com/Indy-Center/controller-tools/issues"
				target="_blank"
				class="text-xs text-content-secondary hover:text-content dark:text-content-dark-secondary dark:hover:text-content-dark"
				>Report Issues on GitHub</a
			>
		</div>
	</div>
</div>

<Modal title="Controller Change Procedures" bind:this={controllerPopup}>
	<ControllerChangeDiag />
</Modal>
