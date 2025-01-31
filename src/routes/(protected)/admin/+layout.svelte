<script lang="ts">
	import { page } from '$app/state';
	import AdminMenuButton from './AdminMenuButton.svelte';
	import MdiMap from 'virtual:icons/mdi/map';
	import MdiHome from 'virtual:icons/mdi/home';
	import MdiAccountGroup from 'virtual:icons/mdi/account-group';
	import MdiAirplaneEdit from 'virtual:icons/mdi/airplane-edit';
	import MdiTableEdit from 'virtual:icons/mdi/table-edit';
	import MdiTextureBox from 'virtual:icons/mdi/texture-box';
	import MdiMenu from 'virtual:icons/mdi/menu';
	import MdiDotsVertical from 'virtual:icons/mdi/dots-vertical';

	let { children } = $props();
	let showMobileMenu = $state(false);

	const adminRoutes = [
		{ label: 'Administration', href: '/admin', Icon: MdiHome },
		{ label: 'Users', href: '/admin/users', Icon: MdiAccountGroup },
		{ label: 'Areas', href: '/admin/areas', Icon: MdiMap },
		{ label: 'Splits', href: '/admin/splits', Icon: MdiTextureBox },
		{ label: 'Restrictions', href: '/admin/restrictions', Icon: MdiAirplaneEdit },
		{ label: 'Table Export', href: '/admin/restrictions/table-maker', Icon: MdiTableEdit }
	];
</script>

<div class="flex min-h-full w-full">
	<!-- Mobile Menu Button -->
	<button
		class="fixed left-4 top-20 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-secondary text-content-secondary transition-colors hover:bg-surface-tertiary md:hidden dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-surface-dark-tertiary"
		onclick={() => (showMobileMenu = !showMobileMenu)}
	>
		<MdiDotsVertical class="h-5 w-5" />
	</button>

	<!-- Mobile Menu Overlay -->
	{#if showMobileMenu}
		<button
			type="button"
			class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
			aria-label="Close mobile menu"
			onclick={() => (showMobileMenu = false)}
		></button>
	{/if}

	<!-- Mobile Sidebar -->
	<nav
		class={`fixed inset-y-0 left-0 z-50 w-64 transform bg-surface-tertiary text-content transition-transform md:hidden dark:bg-surface-dark-tertiary dark:text-content-dark ${
			showMobileMenu ? 'translate-x-0' : '-translate-x-full'
		}`}
	>
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-y-auto pt-20">
				<ul class="flex flex-col space-y-2 p-4">
					{#each adminRoutes as route}
						<li>
							<AdminMenuButton
								href={route.href}
								label={route.label}
								Icon={route.Icon}
								onclick={() => (showMobileMenu = false)}
							/>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</nav>

	<!-- Desktop Sidebar -->
	<nav
		class="hidden w-60 shrink-0 bg-surface-tertiary text-content md:block lg:w-80 dark:bg-surface-dark-tertiary dark:text-content-dark"
	>
		<div class="sticky top-16">
			<ul class="flex flex-col space-y-2 p-4">
				{#each adminRoutes as route}
					<li>
						<AdminMenuButton href={route.href} label={route.label} Icon={route.Icon} />
					</li>
				{/each}
			</ul>
		</div>
	</nav>

	<!-- Main Content -->
	<div class="min-w-0 flex-1">
		<div class="h-16 md:hidden"></div>
		{@render children()}
	</div>
</div>
