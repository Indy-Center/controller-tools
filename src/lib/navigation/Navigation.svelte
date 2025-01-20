<script lang="ts">
	import type { User } from '$lib/server/session';
	import NavigationTabs from './NavigationTabs.svelte';
	import MdiMenu from 'virtual:icons/mdi/menu';
	import MdiClose from 'virtual:icons/mdi/close';
	import MdiLogout from 'virtual:icons/mdi/logout';
	import ToolsIcon from '$lib/ToolsIcon.svelte';

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

<nav class="primary relative flex h-16 min-h-16 w-full flex-row items-center justify-between px-4">
	<div class="flex items-center gap-x-4">
		<a
			href="/"
			class="group flex shrink-0 items-center gap-x-3 rounded-lg bg-zinc-600 p-1.5 hover:drop-shadow-lg"
		>
			<div class="h-5 w-5">
				<ToolsIcon />
			</div>
			<h1 class="text-xl tracking-tight group-hover:font-medium">
				<span class="text-white">IC</span><span class="text-zinc-300">CT</span>
			</h1>
		</a>

		{#if user}
			<div class="flex items-center gap-x-3 text-zinc-300">
				<form class="header-nav-item" action="/logout" method="POST">
					<button
						type="submit"
						class="rounded-md bg-red-500 p-1.5 text-white hover:bg-red-700 focus:outline-none focus:ring focus:ring-zinc-600"
						title="Logout"
					>
						<MdiLogout class="h-5 w-5" />
					</button>
				</form>
				<span class="">
					Hello, <span class="font-medium">{user.firstName} {user.lastName}</span>
				</span>
			</div>
		{:else}
			<a
				href="/login/connect"
				class="rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-600"
			>
				Connect VATSIM
			</a>
		{/if}
	</div>

	<div class="ml-auto">
		<NavigationTabs {links} />
	</div>
</nav>
