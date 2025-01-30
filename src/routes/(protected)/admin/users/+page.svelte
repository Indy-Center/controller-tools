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
		<div>
			<input
				type="text"
				placeholder="Search by CID or name"
				bind:value={searchQuery}
				class="w-full rounded-lg border border-surface-tertiary bg-surface p-3 text-sm text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
			/>
		</div>
	</div>

	<!-- User Grid -->
	<div class="flex-1 overflow-auto px-6">
		<div
			class="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{#each filteredUsers as user}
				<div
					class="flex flex-col rounded-lg border border-surface-tertiary bg-surface p-4 shadow-sm transition-all hover:shadow-md dark:border-surface-dark-tertiary dark:bg-surface-dark"
				>
					<div class="mb-3">
						<h3 class="text-lg font-semibold text-content dark:text-content-dark">
							{user.firstName}
							{user.lastName}
						</h3>
						<p class="text-sm text-content-secondary dark:text-content-dark-secondary">
							CID: {user.cid}
						</p>
					</div>

					<div class="mt-auto flex flex-wrap gap-2">
						{#if user.cid !== data.user.cid}
							{#if !user.isAdmin}
								<!-- Promote Button -->
								<form method="post" action="?/promote" class="flex-1">
									<input type="hidden" name="cid" value={user.cid} />
									<button
										type="submit"
										class="w-full rounded-md bg-action-success px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
									>
										Make Admin
									</button>
								</form>
							{/if}

							{#if user.isAdmin}
								<!-- Demote Button -->
								<form method="post" action="?/demote" class="flex-1">
									<input type="hidden" name="cid" value={user.cid} />
									<button
										type="submit"
										class="w-full rounded-md bg-action-danger px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500/20"
									>
										Remove Admin
									</button>
								</form>
							{/if}
						{:else}
							<span
								class="w-full rounded-md bg-accent-muted px-4 py-2 text-center text-sm font-medium text-accent dark:bg-accent-dark-muted"
							>
								Current User
							</span>
						{/if}
					</div>

					<!-- Admin Badge -->
					{#if user.isAdmin}
						<div class="mt-2 flex justify-end">
							<span
								class="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent dark:bg-accent-dark/10 dark:text-accent-dark"
							>
								Admin
							</span>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
