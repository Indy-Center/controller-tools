<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>ICCT - Admin</title>
</svelte:head>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
	<div class="rounded bg-blue-500 p-4 text-white shadow">
		<h2 class="text-lg font-bold">Users</h2>
		<p class="text-2xl">{data.counts.users}</p>
	</div>
	<div class="rounded bg-green-500 p-4 text-white shadow">
		<h2 class="text-lg font-bold">Total Areas</h2>
		<p class="text-2xl">{data.counts.areas}</p>
	</div>
	<div class="rounded bg-yellow-500 p-4 text-white shadow">
		<h2 class="text-lg font-bold">Total Restrictions</h2>
		<p class="text-2xl">{data.counts.restrictions}</p>
	</div>
</div>
