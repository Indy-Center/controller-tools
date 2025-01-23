<script lang="ts">
	import type { User } from '$lib/server/session';
	import NavigationTabs from './NavigationTabs.svelte';
	import MdiMenu from 'virtual:icons/mdi/menu';
	import MdiClose from 'virtual:icons/mdi/close';
	import MdiLogout from 'virtual:icons/mdi/logout';
	import ToolsIcon from '$lib/ToolsIcon.svelte';
	import Search from '$lib/components/Search.svelte';
	import InfoPopup from '$lib/InfoPopup.svelte';

	type NavigationProps = {
		user: User;
		controllerInfo: any;
	};

	let { user, controllerInfo }: NavigationProps = $props();

	const links = $derived.by(() => {
		const links = [
			{ displayName: 'Home', href: '/' },
			{ displayName: 'Restrictions', href: '/restrictions' },
			{ displayName: 'Airspace', href: '/airspace' },
			{ displayName: 'Charts', href: '/charts' }
		];

		if (user && user.isAdmin) {
			links.push({ displayName: 'Admin', href: '/admin' });
		}

		return links;
	});
</script>

<nav
	class="relative flex h-16 min-h-16 w-full flex-row items-center justify-between bg-surface px-4 dark:bg-surface-dark"
>
	<div class="flex items-center gap-x-4">
		<a
			href="/"
			class="group flex shrink-0 items-center gap-x-1 rounded-lg border border-accent bg-surface p-1.5 text-accent hover:drop-shadow-lg dark:border-accent-dark dark:bg-surface-dark dark:text-accent-dark"
		>
			<div class="h-5 w-5">
				<ToolsIcon />
			</div>
			<h1 class="text-xl group-hover:font-medium">ICT</h1>
		</a>

		{#if user}
			<div
				class="hidden items-center gap-x-3 text-content-secondary md:flex dark:text-content-dark-secondary"
			>
				<form class="header-nav-item" action="/logout" method="POST">
					<button
						type="submit"
						class="rounded-md bg-action-danger p-1.5 text-white hover:bg-red-600 focus:outline-none focus:ring focus:ring-surface-dark"
						title="Logout"
					>
						<MdiLogout class="h-5 w-5" />
					</button>
				</form>
				<span class="">
					<span class="font-medium">{user.firstName} {user.lastName}</span>
					{#if controllerInfo}
						<span
							class="flex items-center gap-1 text-sm text-content-secondary dark:text-content-dark-secondary"
						>
							<div class="h-2 w-2 rounded-full bg-green-500"></div>
							{controllerInfo.position}
						</span>
					{/if}
				</span>
			</div>
		{:else}
			<a
				href="/login/connect"
				class="hidden rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-medium text-white hover:drop-shadow-lg md:block"
			>
				Connect VATSIM
			</a>
		{/if}
	</div>

	<div class="flex flex-1 justify-center">
		<Search />
	</div>

	<div class="ml-auto flex items-center gap-x-4">
		<NavigationTabs {links} />
		<InfoPopup />
	</div>
</nav>
