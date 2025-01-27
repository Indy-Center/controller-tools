<script lang="ts">
	import NavigationTabs from './NavigationTabs.svelte';
	import ToolsIcon from '$lib/components/navigation/ToolsIcon.svelte';
	import Search from '$lib/components/search/Search.svelte';
	import UserActions from './UserActions.svelte';

	type NavigationProps = {
		user: User | null;
	};

	let { user }: NavigationProps = $props();

	const links = $derived.by(() => {
		const links = [
			{ displayName: 'Home', href: '/' },
			{ displayName: 'Restrictions', href: '/restrictions' },
			{ displayName: 'Airspace', href: '/airspace' },
			{ displayName: 'Routing', href: '/routing' },
			{ displayName: 'Charts', href: '/charts' }
		];

		if (user?.isAdmin) {
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

		<UserActions {user} />
	</div>

	<!-- Center Search on larger screens -->
	<div class="">
		<Search />
	</div>

	<div class="ml-auto">
		<NavigationTabs {links} />
	</div>
</nav>
