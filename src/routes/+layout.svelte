<script lang="ts">
	import '../app.css';
	import GithubIcon from 'virtual:icons/mdi/github';
	import Navigation from '$lib/navigation/Navigation.svelte';
	import { theme } from '$lib/state.svelte';

	let { data, children } = $props();

	// Apply dark mode class to document based on theme store
	$effect(() => {
		if ($theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});
</script>

<div class="flex min-h-screen flex-col">
	<!-- Navbar -->
	<Navigation user={data.user} controllerInfo={data.controllerInfo} />

	<!-- Main Content Area -->
	<main class="flex flex-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="bg-surface dark:bg-surface-dark py-4">
		<div class="px-4">
			<div class="flex flex-col gap-y-4">
				<div class="flex flex-col items-center justify-between lg:flex-row">
					<div class="text-content-secondary dark:text-content-dark-secondary text-sm">
						© {new Date().getFullYear()}
						<a href="https://zidartcc.org" class="hover:text-content dark:hover:text-content-dark"
							>Indy Center</a
						>
					</div>
					<!-- FAA Disclaimer -->
					<div class="text-content-secondary dark:text-content-dark-secondary text-center text-xs">
						This is not an official FAA website. No affiliation with the FAA, NATCA, or any other
						government agency is expressed or implied.
					</div>
					<div class="flex items-center gap-x-4">
						<a
							href="https://github.com/indy-center/controller-tools"
							target="_blank"
							rel="noopener noreferrer"
							class="text-content-secondary hover:text-content dark:text-content-dark-secondary dark:hover:text-content-dark"
						>
							<GithubIcon class="h-5 w-5" />
						</a>
						<span
							class="bg-surface-tertiary dark:bg-surface-dark-tertiary text-content-secondary dark:text-content-dark-secondary rounded-full px-2 py-1 text-xs font-medium"
						>
							Build {data.buildNumber}
						</span>
					</div>
				</div>
			</div>
		</div>
	</footer>
</div>

<style>
</style>
