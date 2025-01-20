<script lang="ts">
	import type { User } from '$lib/server/session';
	import NavigationTabs from './NavigationTabs.svelte';
	import MdiMenu from 'virtual:icons/mdi/menu';
	import MdiClose from 'virtual:icons/mdi/close';
	import MdiLogout from 'virtual:icons/mdi/logout';
	import ToolsIcon from '$lib/ToolsIcon.svelte';
	import InfoPopup from '$lib/InfoPopup.svelte';

	type NavigationProps = {
		user: User;
	};

	let { user }: NavigationProps = $props();
	let isMenuOpen = $state(false);

	const links = $derived.by(() => {
		const links = [
			{ displayName: 'Home', href: '/' },
			{ displayName: 'Restrictions', href: '/restrictions' },
			{ displayName: 'Airspace', href: '/airspace' }
		];

		if (user && user.isAdmin) {
			links.push({ displayName: 'Admin', href: '/admin' });
		}

		return links;
	});
</script>

<nav
	class="bg-surface dark:bg-surface-dark relative flex h-16 min-h-16 w-full flex-row items-center justify-between px-4"
>
	<div class="flex items-center gap-x-4">
		<a
			href="/"
			class="bg-surface-secondary dark:bg-surface-dark-secondary group flex shrink-0 items-center gap-x-3 rounded-lg p-1.5 hover:drop-shadow-lg"
		>
			<div class="text-accent-secondary dark:text-accent-dark-secondary h-5 w-5">
				<ToolsIcon />
			</div>
			<h1 class="text-xl group-hover:font-medium">
				<span class="text-accent dark:text-accent-dark">IC</span><span
					class="text-accent-secondary dark:text-accent-dark-secondary">CT</span
				>
			</h1>
		</a>

		{#if user}
			<div
				class="text-content-secondary dark:text-content-dark-secondary flex items-center gap-x-3"
			>
				<form action="/logout" method="POST">
					<button
						type="submit"
						class="bg-action-danger focus:ring-surface-dark rounded-md p-1.5 text-white hover:bg-red-700 focus:outline-none focus:ring"
						title="Logout"
					>
						<MdiLogout class="h-5 w-5" />
					</button>
				</form>
				<span>
					Hello, <span class="font-medium">{user.firstName} {user.lastName}</span>
				</span>
			</div>
		{:else}
			<a
				href="/login/connect"
				class="bg-accent hover:bg-accent-secondary dark:hover:bg-accent-dark-secondary rounded-lg px-4 py-2 text-sm font-medium text-white dark:bg-accent-dark"
			>
				Connect VATSIM
			</a>
		{/if}
	</div>

	<div class="ml-auto flex items-center gap-x-4">
		<NavigationTabs {links} />
		<InfoPopup />
	</div>
</nav>
