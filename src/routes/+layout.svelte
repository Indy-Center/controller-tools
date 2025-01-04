<script lang="ts">
	import '../app.css';
	import NavTabs from '$lib/NavTabs.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<!-- Navbar -->
	<NavTabs
		links={[
			{ displayName: 'Restrictions', href: '/restrictions' },
		]}
	/>

	<!-- Main Content Area -->
	<div class="flex-grow bg text p-6">
		{@render children()}
	</div>

	<!-- Footer -->
	<footer
		class="flex w-full flex-col items-center justify-center primary py-4"
	>
		<span class="p-2 text-center text-sm text-white">
			This site is not affiliated with the Federal Aviation Administration or any governing aviation
			body. All content is approved only for use on the VATSIM network.
		</span>
	</footer>
</div>

<style>


</style>
