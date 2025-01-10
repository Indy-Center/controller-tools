<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();
</script>

<div class="flex flex-grow">
	<nav class="flex min-h-[calc(100dvh-96px)] w-80 flex-col bg-zinc-600 text-white">
		<!-- Brand or Header -->
		<div class="border-b border-zinc-400 p-4 text-xl font-bold">Administration</div>

		<!-- Navigation Links -->
		<ul class="mt-4 flex flex-col space-y-2 px-4">
			<li>
				<a
					href="/admin/users"
					class="block rounded px-4 py-2 hover:bg-zinc-700 focus:bg-zinc-700 focus:outline-none"
					class:bg-zinc-800={page.url.pathname === '/admin/users'}
				>
					Users
				</a>
			</li>
			<li>
				<a
					href="/admin/areas"
					class="block rounded px-4 py-2 hover:bg-zinc-700 focus:bg-zinc-700 focus:outline-none"
					class:bg-zinc-800={page.url.pathname === '/admin/areas'}
				>
					Areas
				</a>
			</li>
		</ul>
	</nav>

	<!-- Main Content -->
	<div class="flex-grow bg-gray-100 p-6">
		{@render children()}
	</div>
</div>
