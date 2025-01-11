<script lang="ts">
	import MdiContentSave from 'virtual:icons/mdi/content-save';
	import MdiPencil from 'virtual:icons/mdi/pencil';
	import MdiPencilOff from 'virtual:icons/mdi/pencil-off';
	import MdiDelete from 'virtual:icons/mdi/delete';
	import MdiPlusThick from 'virtual:icons/mdi/plus-thick';

	let { data } = $props();

	// Track which row is being edited
	let editingRow: string | null = $state(null);

	// Track if a row is being added
	let addingRow: boolean = $state(false);

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

<h1 class="mb-4 text-2xl font-bold text-zinc-800">Area Management</h1>

<!-- Search Box -->
<div class="mb-4 flex gap-2">
	<input
		type="text"
		placeholder="Search by ID, name, or category"
		bind:value={searchQuery}
		class="w-full rounded-md border border-zinc-400 p-2 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
	/>
	
	<div class="flex gap-2 items-center justify-end rounded-md border border-zinc-400 p-2">
		<span class='text-nowrap'>New Area</span>
		<button
			type="button"
			class="text-md rounded bg-green-500 p-2 text-white hover:bg-green-600 focus:ring focus:ring-green-300"
			onclick={() => (addingRow = true)}
		>
			<MdiPlusThick />
		</button>
	</div>
</div>

<!-- Header Row -->
<div class="hidden grid-cols-5 items-center p-4 font-semibold text-zinc-800 md:grid lg:grid-cols-6">
	<div>ID</div>
	<div>Short Name</div>
	<div class="md:hidden lg:block">Long Name</div>
	<div>Category</div>
	<div>Color</div>
	<div>Actions</div>
</div>

<!-- Areas List -->
<div class="divide-y divide-zinc-300 rounded-md border border-zinc-300">
	<!-- Adding a Row-->
	{#if addingRow}
		<div class="flex grid-cols-5 flex-col items-start gap-1 p-2 md:grid lg:grid-cols-6 lg:p-4">
			<form
				method="post"
				action="?/add"
				class="flex auto-cols-auto grid-cols-6 flex-col gap-1 lg:contents"
			>
				<!-- ID -->
				<label for="id" class="font-bold flex items-center text-sm">
					<span class="lg:hidden">ID:</span>
					<input
						id="id"
						type="text"
						name="id"
						class="ml-1 rounded-md border border-zinc-400 p-1 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
					/>
				</label>

				<!-- Short Name -->
				<label for="short" class="flex items-center text-sm font-medium">
					<span class="lg:hidden">Short Name:</span>
					<input
						id="short"
						type="text"
						name="short"
						class="ml-1 rounded-md border border-zinc-400 p-1 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
					/>
				</label>

				<!-- Long Name -->
				<label for="long" class="flex items-center text-sm font-medium">
					<span class="lg:hidden">Long Name:</span>
					<input
						id="long"
						type="text"
						name="long"
						class="ml-1 rounded-md border border-zinc-400 p-1 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
					/>
				</label>

				<!-- Category -->
				<label for="category" class="flex items-center text-sm font-medium">
					<span class="lg:hidden">Category:</span>
					<input
						id="category"
						type="text"
						name="category"
						class="ml-1 rounded-md border border-zinc-400 p-1 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
					/>
				</label>

				<!-- Color -->
				<label for="color" class=" flex items-center text-sm font-medium">
					<span class="mr-1 lg:hidden">Color:</span>
					<input
						id="color"
						type="color"
						name="color"
						class="ml-1 size-8 border border-zinc-400 md:size-10 lg:size-12"
					/>
				</label>

				<!-- Actions -->
				<div class="flex space-x-2">
					<button
						type="submit"
						class="rounded bg-green-500 p-2 text-sm text-white hover:bg-green-600 focus:ring focus:ring-green-300"
					>
						<MdiContentSave />
					</button>
					<button
						type="button"
						class="rounded bg-red-500 p-2 text-sm text-white hover:bg-red-600 focus:ring focus:ring-red-300"
						onclick={() => (addingRow = false)}
					>
						<MdiPencilOff />
					</button>
				</div>
			</form>
		</div>
	{/if}
	{#each filteredAreas as area}
	<div class="flex grid-cols-5 flex-col items-start gap-1 p-2 md:grid lg:grid-cols-6 lg:p-4">	
			{#if editingRow === area.id}
				<!-- Editable Row -->
				<form
					method="post"
					action="?/update"
					class="flex auto-cols-auto grid-cols-6 flex-col gap-1 lg:contents"
				>
					<!-- ID (Non-editable) -->
					<div class="bg-primary font-bold">{area.id}</div>
					<input type="hidden" name="id" value={area.id} />

					<!-- Short Name -->
					<label for="short" class="flex items-center text-sm font-medium">
						<span class="lg:hidden">Short Name:</span>
						<input
							id="short"
							type="text"
							name="short"
							class="ml-1 rounded-md border border-zinc-400 p-1 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
							value={area.short}
						/>
					</label>

					<!-- Long Name -->
					<label for="long" class="flex items-center text-sm font-medium">
						<span class="lg:hidden">Long Name:</span>
						<input
							id="long"
							type="text"
							name="long"
							class="ml-1 rounded-md border border-zinc-400 p-1 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
							value={area.long}
						/>
					</label>

					<!-- Category -->
					<label for="category" class="flex items-center text-sm font-medium">
						<span class="lg:hidden">Category:</span>
						<input
							id="category"
							type="text"
							name="category"
							class="ml-1 rounded-md border border-zinc-400 p-1 text-sm focus:outline-none focus:ring focus:ring-zinc-300"
							value={area.category}
						/>
					</label>

					<!-- Color -->
					<label for="color" class=" flex items-center text-sm font-medium">
						<span class="mr-1 lg:hidden">Color:</span>
						<input
							id="color"
							type="color"
							name="color"
							class="ml-1 size-8 border border-zinc-400 md:size-10 lg:size-12"
							value={area.color}
						/>
					</label>

					<!-- Actions -->
					<div class="flex space-x-2">
						<button
							type="submit"
							class="rounded bg-green-500 p-2 text-sm text-white hover:bg-green-600 focus:ring focus:ring-green-300"
						>
							<MdiContentSave />
						</button>
						<button
							type="button"
							class="rounded bg-red-500 p-2 text-sm text-white hover:bg-red-600 focus:ring focus:ring-red-300"
							onclick={() => (editingRow = null)}
						>
							<MdiPencilOff />
						</button>
					</div>
				</form>
			{:else}
				<!-- Static Row -->
				<div class="font-bold">
					{area.id}
				</div>
				<div><span class="font-thin md:hidden">Short Name:{' '}</span>{area.short}</div>
				<div class="md:hidden lg:block">
					<span class="font-thin md:hidden">Long Name:{' '}</span>{area.long}
				</div>
				<div><span class="font-thin md:hidden">Category:{' '}</span>{area.category}</div>
				<div class="justify-content-middle flex gap-1">
					<span class="font-thin md:hidden">Color: {' '}</span>
					<div
						class="size-8 border border-zinc-400 md:size-10 lg:size-12"
						style="background-color: {area.color};"
					></div>
				</div>
				<div class="flex space-x-2">
					
					<button
						type="button"
						class="text-md rounded bg-blue-500 p-2 text-white hover:bg-blue-600 focus:ring focus:ring-blue-300"
						onclick={() => (editingRow = area.id)}
					>
						<MdiPencil />
					</button>
						<form
							method="post"
							action="?/delete"
						>
						<input type="hidden" name="id" value={area.id} />
							<button
							type="submit"
							class="text-md rounded bg-red-500 p-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
						>
							<MdiDelete />
						</button>
					</form>
				</div>
			{/if}
		</div>
	{/each}
</div>
