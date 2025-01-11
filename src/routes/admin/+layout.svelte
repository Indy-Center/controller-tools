<script lang="ts">
	import { page } from '$app/state';
	import AdminMenuButton from './AdminMenuButton.svelte';
	import MdiMap from 'virtual:icons/mdi/map';
	import MdiHome from 'virtual:icons/mdi/home';
	import MdiAccountGroup from 'virtual:icons/mdi/account-group';
	import MdiAirplaneEdit from 'virtual:icons/mdi/airplane-edit';

	let { children } = $props();

	const adminRoutes = [
		{ label: 'Administration', href: '/admin', Icon: MdiHome },
		{ label: 'Users', href: '/admin/users', Icon: MdiAccountGroup },
		{ label: 'Areas', href: '/admin/areas', Icon: MdiMap },
		{ label: 'Restrictions', href: '/admin/restrictions', Icon: MdiAirplaneEdit }
	];
</script>

<div class="flex flex-grow">
	{#if page.url.pathname !== '/admin'}
		<nav
			class="hidden min-h-[calc(100dvh-96px)] flex-col bg-zinc-600 pt-20 text-white md:flex md:w-60 lg:w-80"
		>
			<ul class="mt-2 flex flex-col space-y-2 px-2 lg:px-4">
				{#each adminRoutes as route}
					<li>
						<AdminMenuButton href={route.href} label={route.label} Icon={route.Icon} />
					</li>
				{/each}
			</ul>
		</nav>
	{/if}

	<!-- Main Content -->
	<div class="mx-auto max-w-screen-xl flex-grow p-6">
		{@render children()}
	</div>
</div>
