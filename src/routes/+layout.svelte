<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/navigation/Navigation.svelte';
	import { theme, setUserInfo } from '$lib/state.svelte';
	import MdiIcon from '$lib/components/MdiIcon.svelte';

	let { data, children } = $props();

	// Update userInfo state whenever data.user changes
	$effect(() => {
		setUserInfo(data.user);
	});

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
	<!-- Sticky Navbar -->
	<div class="sticky top-0 z-[900] bg-surface shadow-sm dark:bg-surface-dark">
		<Navigation user={data.user} />
	</div>

	<!-- Main Content Area -->
	<main class="flex flex-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="bg-surface py-4 dark:bg-surface-dark">
		<div class="px-4">
			<div class="flex flex-col gap-y-4">
				<div class="flex flex-col items-center justify-between lg:flex-row">
					<div class="text-sm text-content-secondary dark:text-content-dark-secondary">
						© {new Date().getFullYear()}
						<a
							href="https://flyindycenter.com"
							class="hover:text-content dark:hover:text-content-dark">Indy Center</a
						>
					</div>
					<!-- FAA Disclaimer -->
					<div class="text-center text-xs text-content-secondary dark:text-content-dark-secondary">
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
							<MdiIcon name="github" class="h-5 w-5" />
						</a>
						<span
							class="rounded-full bg-surface-tertiary px-2 py-1 text-xs font-medium text-content-secondary dark:bg-surface-dark-tertiary dark:text-content-dark-secondary"
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
