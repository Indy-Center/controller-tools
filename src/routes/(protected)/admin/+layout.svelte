<script lang="ts">
	import { page } from '$app/state';
	import AdminMenuButton from './AdminMenuButton.svelte';
	import MdiMap from 'virtual:icons/mdi/map';
	import MdiHome from 'virtual:icons/mdi/home';
	import MdiAccountGroup from 'virtual:icons/mdi/account-group';
	import MdiAirplaneEdit from 'virtual:icons/mdi/airplane-edit';
	import MdiTableEdit from 'virtual:icons/mdi/table-edit';
	import MdiTextureBox from 'virtual:icons/mdi/texture-box';

	let { children } = $props();

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
	<!-- Sticky Sidebar -->
	<nav
		class="hidden w-60 shrink-0 bg-surface-tertiary text-content md:block lg:w-80 dark:bg-surface-dark dark:text-content-dark"
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
		{@render children()}
	</div>
</div>
