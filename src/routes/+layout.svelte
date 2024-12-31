<script lang="ts">
	import '../app.css';
	import NavTabs from '$lib/NavTabs.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<!-- Navbar -->
	<NavTabs
		links={[
			{ displayName: 'ASI', href: '/' },
			{ displayName: 'Charts', href: '/charts' },
			{ displayName: 'ADR', href: '/adr' },
			{ displayName: 'Restrictions', href: '/restrictions' },
			{ displayName: 'Airspace', href: '/airspace' },
			{ displayName: 'Lookup', href: '/lookup' }
		]}
	/>

	<!-- Main Content Area -->
	<div class="flex-grow bg-zinc-50 p-6 dark:bg-zinc-800">
		{@render children()}
	</div>

	<!-- Footer -->
	<footer
		class="flex w-full flex-col items-center justify-center bg-zinc-700 py-4 dark:bg-zinc-900"
	>
		<span class="p-2 text-center text-sm text-zinc-300 dark:text-zinc-400">
			This site is not affiliated with the Federal Aviation Administration or any governing aviation
			body. All content is approved only for use on the VATSIM network.
		</span>
	</footer>
</div>

<style>
	:global(body) {
		@apply bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200;
	}
</style>
