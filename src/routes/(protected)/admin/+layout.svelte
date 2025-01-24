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

<div class="flex flex-grow">
	<!-- Sidebar -->
	<nav
		class="hidden h-full min-h-full w-60 shrink-0 bg-surface-tertiary text-content md:block lg:w-80 dark:bg-surface-dark dark:text-content-dark"
	>
		<ul class="sticky top-4 flex flex-col space-y-2 p-4">
			{#each adminRoutes as route}
				<li>
					<AdminMenuButton href={route.href} label={route.label} Icon={route.Icon} />
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Main Content -->
	<div class="flex-grow">
		<div class="mx-auto max-w-screen-xl p-6">
			{@render children()}
		</div>
	</div>
</div>
