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
	<title>ICT - User Management</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="text-2xl font-bold text-content dark:text-content-dark">User Management</h1>

	<!-- Search Box -->
	<div>
		<input
			type="text"
			placeholder="Search by CID or name"
			bind:value={searchQuery}
			class="w-full rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content placeholder:text-content-tertiary focus:outline-none focus:ring focus:ring-accent dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:ring-accent-dark"
		/>
	</div>

	<!-- User List -->
	<div
		class="divide-y divide-surface-tertiary rounded-md border border-surface-tertiary dark:divide-surface-dark-tertiary dark:border-surface-dark-tertiary"
	>
		{#each filteredUsers as user}
			<div class="flex min-h-16 items-center justify-between bg-surface p-4 dark:bg-surface-dark">
				<!-- User Details -->
				<div>
					<p class="space-around flex flex-col text-sm md:flex-row">
						<span class="font-semibold text-content dark:text-content-dark"
							>{user.firstName} {user.lastName}</span
						>
						<span class="ml-1 font-light text-content-secondary dark:text-content-dark-secondary"
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
									class="rounded bg-action-success px-3 py-1 text-sm text-white hover:bg-green-700 focus:ring focus:ring-green-300"
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
									class="rounded bg-action-danger px-3 py-1 text-sm text-white hover:bg-red-700 focus:ring focus:ring-red-300"
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
