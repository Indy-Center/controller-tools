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

<svelte:head>
	<title>ICCT - User Management</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="text-content dark:text-content-dark text-2xl font-bold">User Management</h1>

	<!-- Search Box -->
	<div>
		<input
			type="text"
			placeholder="Search by CID or name"
			bind:value={searchQuery}
			class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface dark:bg-surface-dark text-content dark:text-content-dark placeholder:text-content-tertiary dark:placeholder:text-content-dark-tertiary focus:ring-accent w-full rounded-md border p-2 text-sm focus:outline-none focus:ring dark:focus:ring-accent-dark"
		/>
	</div>

	<!-- User List -->
	<div
		class="divide-surface-tertiary dark:divide-surface-dark-tertiary border-surface-tertiary dark:border-surface-dark-tertiary divide-y rounded-md border"
	>
		{#each filteredUsers as user}
			<div class="bg-surface dark:bg-surface-dark flex min-h-16 items-center justify-between p-4">
				<!-- User Details -->
				<div>
					<p class="space-around flex flex-col text-sm md:flex-row">
						<span class="text-content dark:text-content-dark font-semibold"
							>{user.firstName} {user.lastName}</span
						>
						<span class="text-content-secondary dark:text-content-dark-secondary ml-1 font-light"
							>({user.cid})</span
						>
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
									class="bg-action-success rounded px-3 py-1 text-sm text-white hover:bg-green-700 focus:ring focus:ring-green-300"
								>
									Make Admin
								</button>
							</form>
						{/if}

						{#if user.isAdmin}
							<!-- Demote Button -->
							<form method="post" action="?/demote">
								<input type="hidden" name="cid" value={user.cid} />
								<button
									type="submit"
									class="bg-action-danger rounded px-3 py-1 text-sm text-white hover:bg-red-700 focus:ring focus:ring-red-300"
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
