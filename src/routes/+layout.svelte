<script lang="ts">
	import '../app.css';
	import GithubIcon from 'virtual:icons/mdi/github';
	import Navigation from '$lib/navigation/Navigation.svelte';

	let { data, children } = $props();
</script>

<div class="flex h-full flex-col">
	<!-- Navbar -->
	<Navigation user={data.user} />

	<!-- Main Content Area -->
	<main class="relative flex-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="bg-zinc-800 py-4">
		<div class="px-4">
			<div class="flex flex-col gap-y-4">
				<div class="flex flex-col items-center justify-between lg:flex-row">
					<div class="text-sm text-zinc-300">
						© {new Date().getFullYear()}
						<a href="https://zidartcc.org" class="hover:text-zinc-100">Indy Center</a>
					</div>
					<!-- FAA Disclaimer -->
					<div class="text-center text-xs text-zinc-300">
						This is not an official FAA website. No affiliation with the FAA, NATCA, or any other
						government agency is expressed or implied.
					</div>
					<div class="flex items-center gap-x-4">
						<a
							href="https://github.com/indy-center/controller-tools"
							target="_blank"
							rel="noopener noreferrer"
							class="text-zinc-300 hover:text-zinc-100"
						>
							<GithubIcon class="h-5 w-5" />
						</a>
						<span class="rounded-full bg-zinc-700 px-2 py-1 text-xs font-medium text-zinc-300">
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
