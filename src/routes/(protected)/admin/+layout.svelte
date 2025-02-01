<script lang="ts">
	import MdiIcon from '$lib/components/MdiIcon.svelte';
	import { type MdiIconName } from '$lib/types/mdi';
	import AdminMenuButton from './AdminMenuButton.svelte';

	let { children } = $props();
	let showMobileMenu = $state(false);

	const adminRoutes: {
		label: string;
		href: string;
		icon: MdiIconName;
	}[] = [
		{ label: 'Administration', href: '/admin', icon: 'home' },
		{ label: 'Users', href: '/admin/users', icon: 'account-group' },
		{ label: 'Airspace', href: '/admin/airspace', icon: 'layers-edit' },
		{ label: 'Areas', href: '/admin/areas', icon: 'map' },
		{ label: 'Splits', href: '/admin/splits', icon: 'texture-box' },
		{ label: 'Restrictions', href: '/admin/restrictions', icon: 'airplane-edit' },
		{ label: 'Table Export', href: '/admin/restrictions/table-maker', icon: 'table-edit' }
	];
</script>

<div class="flex min-h-full w-full">
	<!-- Mobile Menu Button -->
	<button
		class="fixed left-4 top-20 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-secondary text-content-secondary transition-colors hover:bg-surface-tertiary md:hidden dark:bg-surface-dark-secondary dark:text-content-dark-secondary dark:hover:bg-surface-dark-tertiary"
		onclick={() => (showMobileMenu = !showMobileMenu)}
	>
		<MdiIcon name="dots-vertical" class="h-5 w-5" />
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
		class={`fixed inset-y-0 left-0 z-50 w-64 transform bg-surface text-content transition-transform md:hidden dark:bg-surface-dark dark:text-content-dark ${
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
								icon={route.icon}
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
		class="hidden w-60 shrink-0 bg-surface text-content md:block lg:w-80 dark:bg-surface-dark dark:text-content-dark"
	>
		<div class="sticky top-16">
			<ul class="flex flex-col space-y-2 p-4">
				{#each adminRoutes as route}
					<li>
						<AdminMenuButton href={route.href} label={route.label} icon={route.icon} />
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
