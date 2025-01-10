<script lang="ts">
	let { data } = $props();

	let searchQuery = $state('');

	let filteredUsers = $derived.by(() => {
		return data.users.filter((u) => {
			// Ensure searchQuery isn't empty and perform the filtering
			if (searchQuery !== '') {
				return `${u.cid} ${u.firstName} ${u.lastName}`
					.toLowerCase()
					.includes(searchQuery.toLowerCase());
			}

			// If searchQuery is empty, return all users
			return true;
		});
	});
</script>

<div class="container mx-auto p-6">
	<h1 class="mb-4 text-2xl font-bold text-zinc-800">User Management</h1>
	<!-- Search Box -->
	<div class="mb-4">
		<input
			type="text"
			placeholder="Search by CID or name"
			bind:value={searchQuery}
			class="w-full rounded-md border border-zinc-400 p-2 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
		/>
	</div>

	<!-- User List -->
	<div class="divide-y divide-zinc-300 rounded-md border border-zinc-300">
		{#each filteredUsers as user}
			<div class="flex min-h-16 items-center justify-between p-4">
				<!-- User Details -->
				<div>
					<p class="text-sm font-semibold text-zinc-800">
						{user.firstName}
						{user.lastName} ({user.cid})
					</p>
				</div>

				<!-- Action Buttons -->
				<div class="flex space-x-2">
					{#if user.cid !== data.user.cid}
						{#if !user.isAdmin}
							<!-- Promote Button -->
							<form method="post" action="?/promote">
								<input type="hidden" name="cid" value={user.cid} />
								<button
									type="submit"
									class="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600 focus:ring focus:ring-green-300"
								>
									Promote to Admin
								</button>
							</form>
						{/if}

						{#if user.isAdmin}
							<!-- Demote Button -->
							<form method="post" action="?/demote">
								<input type="hidden" name="cid" value={user.cid} />
								<button
									type="submit"
									class="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 focus:ring focus:ring-red-300"
								>
									Remove Admin
								</button>
							</form>
						{/if}
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
