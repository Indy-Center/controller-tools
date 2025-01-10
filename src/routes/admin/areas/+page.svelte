<script lang="ts">
	let { data } = $props();

	// Track which row is being edited
	let editingRow: string | null = $state(null);

	// Search query for filtering areas
	let searchQuery = $state('');

	// Filtered areas derived from the search query
	let filteredAreas = $derived.by(() => {
		return data.areas.filter((a) => {
			if (searchQuery !== '') {
				return `${a.short} ${a.long} ${a.id} ${a.category}`
					.toLowerCase()
					.includes(searchQuery.toLowerCase());
			}
			return true; // Return all areas if no search query
		});
	});
</script>

<svelte:head>
	<title>ICCT - Area Management</title>
</svelte:head>

<div class="container mx-auto p-6">
	<h1 class="mb-4 text-2xl font-bold text-zinc-800">Area Management</h1>

	<!-- Search Box -->
	<div class="mb-4">
		<input
			type="text"
			placeholder="Search by ID, name, or category"
			bind:value={searchQuery}
			class="w-full rounded-md border border-zinc-400 p-2 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
		/>
	</div>

	<!-- Header Row -->
	<div class="grid grid-cols-6 items-center p-4 font-semibold text-zinc-800">
		<div>ID</div>
		<div>Short Name</div>
		<div>Long Name</div>
		<div>Category</div>
		<div>Color</div>
		<div>Actions</div>
	</div>

	<!-- Areas List -->
	<div class="divide-y divide-zinc-300 rounded-md border border-zinc-300">
		{#each filteredAreas as area}
			<div class="grid grid-cols-6 items-center gap-x-1 p-4">
				{#if editingRow === area.id}
					<!-- Editable Row -->
					<form method="post" action="?/update" class="contents">
						<!-- ID (Non-editable) -->
						<div>{area.id}</div>
						<input type="hidden" name="id" value={area.id} />
						<!-- Short Name -->
						<input
							type="text"
							name="short"
							class="rounded-md border border-zinc-400 p-2 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
							value={area.short}
						/>

						<!-- Long Name -->
						<input
							type="text"
							name="long"
							class="rounded-md border border-zinc-400 p-2 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
							value={area.long}
						/>

						<!-- Category -->
						<input
							type="text"
							name="category"
							class="rounded-md border border-zinc-400 p-2 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
							value={area.category}
						/>

						<!-- Color -->
						<input
							type="color"
							name="color"
							class="h-10 w-16 border border-zinc-400"
							value={area.color}
						/>

						<!-- Actions -->
						<div class="flex space-x-2">
							<button
								type="submit"
								class="rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600 focus:ring focus:ring-green-300"
							>
								Save
							</button>
							<button
								type="button"
								class="rounded bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600 focus:ring focus:ring-red-300"
								onclick={() => (editingRow = null)}
							>
								Cancel
							</button>
						</div>
					</form>
				{:else}
					<!-- Static Row -->
					<div>{area.id}</div>
					<div>{area.short}</div>
					<div>{area.long}</div>
					<div>{area.category}</div>
					<div>
						<div
							class="h-10 w-16 border border-zinc-400"
							style="background-color: {area.color};"
						></div>
					</div>
					<div class="flex space-x-2">
						<button
							type="button"
							class="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 focus:ring focus:ring-blue-300"
							onclick={() => (editingRow = area.id)}
						>
							Edit
						</button>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
