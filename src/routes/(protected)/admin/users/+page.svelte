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

<div class="flex h-full flex-1 flex-col overflow-hidden">
	<div class="flex flex-col gap-4 p-6">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<h1 class="text-2xl font-bold text-content dark:text-content-dark">User Management</h1>
		</div>

		<!-- Search Box -->
		<div class="mb-6">
			<input
				type="text"
				placeholder="Search users..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-surface-tertiary bg-surface p-3 text-sm text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
			/>
		</div>

		<!-- Users List -->
		<div class="flex-1 space-y-4 overflow-auto">
			{#each filteredUsers as user}
				<div
					class="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-surface-tertiary bg-surface p-4 shadow-sm transition-all hover:border-accent/30 hover:shadow-md dark:border-surface-dark-tertiary dark:bg-surface-dark"
				>
					<div class="flex flex-col">
						<h3 class="font-semibold text-content dark:text-content-dark">
							{user.firstName}
							{user.lastName}
						</h3>
						<p class="text-sm text-content-secondary dark:text-content-dark-secondary">
							CID: {user.cid}
						</p>
						{#if user.isAdmin}
							<span
								class="mt-1 inline-flex w-fit rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent dark:bg-accent-dark/10 dark:text-accent-dark"
							>
								Admin
							</span>
						{/if}
					</div>
					<div class="flex gap-2">
						{#if user.cid !== data.user.cid}
							{#if !user.isAdmin}
								<form method="post" action="?/promote">
									<input type="hidden" name="cid" value={user.cid} />
									<button
										type="submit"
										class="rounded-md bg-action-success px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
									>
										Make Admin
									</button>
								</form>
							{/if}

							{#if user.isAdmin}
								<form method="post" action="?/demote">
									<input type="hidden" name="cid" value={user.cid} />
									<button
										type="submit"
										class="rounded-md bg-action-danger px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500/20"
									>
										Remove Admin
									</button>
								</form>
							{/if}
						{:else}
							<span
								class="rounded-md bg-accent-muted px-4 py-2 text-sm font-medium text-accent dark:bg-accent-dark-muted"
							>
								Current User
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
