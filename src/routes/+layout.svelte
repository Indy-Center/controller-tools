<script lang="ts">
	import '../app.css';
	import IndyLogo from '$lib/IndyLogo.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>ICCT - Indy Center Controller Tools</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<!-- Navbar -->
	<nav
		class="flex h-16 w-full items-center justify-between bg-gray-700 px-4 shadow-md dark:bg-gray-900"
	>
		<a href="/">
			<div class="flex gap-x-2 items-center text-xl font-medium text-white hover:text-gray-200">
				<div class="w-32"><IndyLogo/></div><div>Controller Tools</div>
			</div>
		</a>
		<ul
			class="flex list-none flex-row space-x-2 text-white hover:text-gray-200"
		>
			<li><a href="/restrictions">Restrictions</a></li>
		</ul>
	</nav>

	<!-- Main Content Area -->
	<div class="flex-grow bg-gray-50 p-6 dark:bg-gray-800">
		{@render children()}
	</div>

	<!-- Footer -->
	<footer
		class="flex w-full flex-col items-center justify-center bg-gray-700 py-4 dark:bg-gray-900"
	>
    <span class="p-2 text-center text-sm text-gray-300 dark:text-gray-400">
      This site is not affiliated with the Federal Aviation Administration or
      any governing aviation body. All content is approved only for use on the
      VATSIM network.
    </span>
	</footer>
</div>

<style>
    :global(body) {
        @apply bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200;
    }
</style>
