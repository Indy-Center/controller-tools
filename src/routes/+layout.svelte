<script lang="ts">
	import '../app.css';
	import NavTabs from '$lib/NavTabs.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<!-- Navbar -->
	<NavTabs
		links={[
			{ displayName: 'Home', href: '/' },
			{ displayName: 'Restrictions', href: '/restrictions' }
		]}
	/>

	<!-- Main Content Area -->
	<div class="z-0 w-full flex-grow">
		{@render children()}
	</div>

	<!-- Footer -->
	<footer class="primary flex h-20 w-full flex-col items-center justify-center py-4 text-xs lg:h-8">
		<span class="text-center text-xs font-light text-white">
			This site is not affiliated with the Federal Aviation Administration or any governing aviation
			body. All content is approved only for use on the VATSIM network.
		</span>
	</footer>
</div>

<style>
</style>
