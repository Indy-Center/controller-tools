<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>ICCT - Admin</title>
</svelte:head>

<div>
	<h1 class="mb-1 text-center text-xl font-bold">Administration Center</h1>
	<a
		href="http://wiki.zidarcc.org/facilities/icct"
		target="_blank"
		rel="noopener noreferrer"
		class="mb-2 block text-center text-blue-500 underline hover:no-underline"
		>Read the administration guide</a
	>
</div>
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
	<div class="rounded bg-blue-500 p-4 text-white shadow">
		<a href="/admin/users">
			<h2 class="text-lg font-bold underline hover:no-underline">Users</h2>
		</a>
		<p class="text-2xl">{data.counts.users}</p>
	</div>
	<div class="rounded bg-green-500 p-4 text-white shadow">
		<a href="/admin/areas">
			<h2 class="text-lg font-bold underline hover:no-underline">Areas</h2>
		</a>
		<p class="text-2xl">{data.counts.areas}</p>
	</div>
	<div class="rounded bg-yellow-500 p-4 text-white shadow">
		<a href="/admin/restrictions">
			<h2 class="text-lg font-bold underline hover:no-underline">Restrictions</h2>
		</a>
		<p class="text-2xl">{data.counts.restrictions}</p>
	</div>
</div>
