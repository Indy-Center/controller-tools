<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>ICT - Admin</title>
</svelte:head>

<div class="flex h-full w-full flex-col p-6">
	<h1 class="mb-6 text-2xl font-bold text-content dark:text-content-dark">Administration Center</h1>
	<a
		href="http://wiki.zidarcc.org/facilities/icct"
		target="_blank"
		rel="noopener noreferrer"
		class="mb-6 block text-accent hover:text-accent/80 dark:text-accent-dark dark:hover:text-accent-dark/80"
		>Read the administration guide</a
	>
	<div class="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		<div
			class="rounded-lg bg-surface-secondary p-6 shadow-sm transition-all hover:shadow-md dark:bg-surface-dark-secondary"
		>
			<a href="/admin/users" class="block">
				<h2
					class="mb-2 text-lg font-bold text-content hover:text-accent dark:text-content-dark dark:hover:text-accent-dark"
				>
					Users
				</h2>
				<p class="text-3xl font-semibold text-content dark:text-content-dark">
					{data.counts.users}
				</p>
			</a>
		</div>
		<div
			class="rounded-lg bg-surface-secondary p-6 shadow-sm transition-all hover:shadow-md dark:bg-surface-dark-secondary"
		>
			<a href="/admin/areas" class="block">
				<h2
					class="mb-2 text-lg font-bold text-content hover:text-accent dark:text-content-dark dark:hover:text-accent-dark"
				>
					Areas
				</h2>
				<p class="text-3xl font-semibold text-content dark:text-content-dark">
					{data.counts.areas}
				</p>
			</a>
		</div>
		<div
			class="rounded-lg bg-surface-secondary p-6 shadow-sm transition-all hover:shadow-md dark:bg-surface-dark-secondary"
		>
			<a href="/admin/restrictions" class="block">
				<h2
					class="mb-2 text-lg font-bold text-content hover:text-accent dark:text-content-dark dark:hover:text-accent-dark"
				>
					Restrictions
				</h2>
				<p class="text-3xl font-semibold text-content dark:text-content-dark">
					{data.counts.restrictions}
				</p>
			</a>
		</div>
	</div>
</div>
