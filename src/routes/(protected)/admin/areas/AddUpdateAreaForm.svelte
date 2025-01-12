<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import Modal from '$lib/Modal.svelte';

	let { data }: { data: any } = $props();

	let mode = $state('ADD');
	let modal: ReturnType<typeof Modal>;

	const { form, errors, constraints, message, enhance, reset } = superForm(data.form, {
		onUpdated() {
			modal.close();
		}
	});

	export function create() {
		mode = 'ADD';
		reset();
		modal.open();
	}

	export function edit(data: any) {
		mode = 'EDIT';

		// Update the form with incoming data
		form.update(() => {
			return {
				...$form,
				id: data.id,
				short: data.short,
				long: data.long,
				category: data.category,
				color: data.color
			};
		});

		modal.open();
	}

	function cancel() {
		reset();
		modal.close();
	}
</script>

<Modal title={mode === "ADD" ? "Add Area" : `Update ${$form.id} Area`} bind:this={modal}>
	<form use:enhance method="POST" action={mode === "ADD" ? "?/add" : "?/update"} class="flex flex-col space-y-4 p-4">
		<!-- ID Field -->
		{#if mode === "ADD"}
			<div class="flex flex-col">
				<div class="flex gap-x-2 items-center">
					<label for="id" class="text-sm font-medium text-gray-700">ID</label>
					{#if $errors.id}
						<span class="text-xs text-red-400">{$errors.id}</span>
					{/if}
				</div>
				<input
					name="id"
					type="text"
					bind:value={$form.id}
					aria-invalid={$errors.id ? 'true' : undefined}
					class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
					placeholder="Enter ID"
					{...$constraints.id}
				/>
			</div>
		{:else}
			<input name="id"
						 type="hidden"
						 bind:value={$form.id}
						 {...$constraints.id} />
		{/if}

		<!-- Short Field -->
		<div class="flex flex-col">
			<div class="flex gap-x-2 items-center">
				<label for="short" class="text-sm font-medium text-gray-700">Short</label>
				{#if $errors.short}
					<span class="text-xs text-red-400">{$errors.short}</span>
				{/if}
			</div>
			<input
				name="short"
				type="text"
				bind:value={$form.short}
				aria-invalid={$errors.short ? 'true' : undefined}
				class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
				placeholder="Enter Short Name"
				{...$constraints.short}
			/>
		</div>

		<!-- Long Field -->
		<div class="flex flex-col">
			<div class="flex gap-x-2 items-center">
				<label for="long" class="text-sm font-medium text-gray-700">Long</label>
				{#if $errors.long}
					<span class="text-xs text-red-400">{$errors.long}</span>
				{/if}
			</div>
			<input
				name="long"
				type="text"
				bind:value={$form.long}
				aria-invalid={$errors.long ? 'true' : undefined}
				class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
				placeholder="Enter Long Name"
				{...$constraints.long}
			/>
		</div>

		<!-- Category Field -->
		<div class="flex flex-col">
			<div class="flex gap-x-2 items-center">
				<label for="category" class="text-sm font-medium text-gray-700">Category</label>
				{#if $errors.category}
					<span class="text-xs text-red-400">{$errors.category}</span>
				{/if}
			</div>
			<input
				name="category"
				type="text"
				bind:value={$form.category}
				aria-invalid={$errors.category ? 'true' : undefined}
				class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
				placeholder="Enter Category"
				{...$constraints.category}
			/>
		</div>

		<!-- Color Field -->
		<div class="flex flex-col">
			<div class="flex gap-x-2 items-center">
				<label for="color" class="text-sm font-medium text-gray-700">Color</label>
				{#if $errors.color}
					<span class="text-xs text-red-400">{$errors.color}</span>
				{/if}
			</div>
			<input
				name="color"
				type="color"
				bind:value={$form.color}
				aria-invalid={$errors.color ? 'true' : undefined}
				class="mt-1 h-10 w-20 rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
				{...$constraints.color}
			/>
		</div>

		<!-- Submit Button -->
		<div class="flex justify-end gap-x-2">
			<button
				type="submit"
				class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:ring focus:ring-blue-300"
			>
				Submit
			</button>
			<button
				onclick={() => cancel()}
				class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
			>
				Cancel
			</button>
		</div>
	</form>
</Modal>