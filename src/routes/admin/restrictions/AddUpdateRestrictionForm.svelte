<script lang="ts">
	import SuperDebug, { superForm } from 'sveltekit-superforms';
	import Modal from '$lib/Modal.svelte';
	import type { AreaMetadata } from '$lib/db/schema';

	let { data, areas }: { data: any; areas: AreaMetadata[] } = $props();

	let mode = $state('ADD');
	let modal: ReturnType<typeof Modal>;

	const { form, errors, constraints, message, enhance, reset } = superForm(data.form, {
		onUpdated({ form }) {
			if (form.valid) {
				modal.close();
			}
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
				airport: data.airport,
				route: data.route,
				from: data.from,
				to: data.to,
				restriction: data.restriction,
				notes: data.notes,
				priority: data.priority,
				validAt: data.validAt
			};
		});

		modal.open();
	}

	function cancel() {
		reset();
		modal.close();
	}
</script>

<Modal title={mode === "ADD" ? "Add Restriction" : `Update Restriction`} bind:this={modal}>
	<form use:enhance method="POST" action="?/upsert" class="flex flex-col space-y-4 p-4">
		{#if mode === "EDIT"}
			<input name="id" type="hidden" bind:value={$form.id} />
		{/if}

		<div class="flex flex-col">
			<div class="flex gap-x-2 items-center">
				<label for="airport" class="text-sm font-medium text-gray-700">Airport</label>
				{#if $errors.airport}
					<span class="text-xs text-red-400">{$errors.airport}</span>
				{/if}
			</div>
			<input
				name="airport"
				type="text"
				bind:value={$form.airport}
				aria-invalid={$errors.airport ? 'true' : undefined}
				class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
				placeholder="Enter Airport(s)"
				{...$constraints.airport}
			/>
		</div>

		<div class="flex flex-col">
			<div class="flex gap-x-2 items-center">
				<label for="route" class="text-sm font-medium text-gray-700">Route (optional)</label>
				{#if $errors.route}
					<span class="text-xs text-red-400">{$errors.route}</span>
				{/if}
			</div>
			<input
				name="route"
				type="text"
				bind:value={$form.route}
				aria-invalid={$errors.route ? 'true' : undefined}
				class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
				placeholder="Enter route or leave blank for all"
				{...$constraints.route}
			/>
		</div>

		<div class="flex w-full">
			<div class="flex flex-col flex-grow">
				<div class="flex gap-x-2 items-center">
					<label for="from" class="text-sm font-medium text-gray-700">From</label>
					{#if $errors.from}
						<span class="text-xs text-red-400">{$errors.from}</span>
					{/if}
				</div>
				<select
					name="from"
					bind:value={$form.from}
					aria-invalid={$errors.from ? 'true' : undefined}
					class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
					{...$constraints.from}
				>
					{#each areas as area}
						<option id={area.id} value={area.id}>{area.long}</option>
					{/each}
				</select>
			</div>
			<div class="flex flex-col flex-grow">
				<div class="flex gap-x-2 items-center">
					<label for="to" class="text-sm font-medium text-gray-700">To</label>
					{#if $errors.to}
						<span class="text-xs text-red-400">{$errors.to}</span>
					{/if}
				</div>
				<select
					name="to"
					bind:value={$form.to}
					aria-invalid={$errors.to ? 'true' : undefined}
					class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
					{...$constraints.to}
				>
					{#each areas as area}
						<option id={area.id} value={area.id}>{area.long}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="flex flex-col">
			<div class="flex gap-x-2 items-center">
				<label for="restriction" class="text-sm font-medium text-gray-700">Restriction (optional)</label>
				{#if $errors.restriction}
					<span class="text-xs text-red-400">{$errors.restriction}</span>
				{/if}
			</div>
			<input
				name="restriction"
				type="text"
				bind:value={$form.restriction}
				aria-invalid={$errors.restriction ? 'true' : undefined}
				class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
				placeholder="Enter Restrictions"
				{...$constraints.restriction}
			/>
		</div>

		<div class="flex flex-col">
			<div class="flex gap-x-2 items-center">
				<label for="notes" class="text-sm font-medium text-gray-700">Notes (optional)</label>
				{#if $errors.notes}
					<span class="text-xs text-red-400">{$errors.notes}</span>
				{/if}
			</div>
			<input
				name="notes"
				type="text"
				bind:value={$form.notes}
				aria-invalid={$errors.notes ? 'true' : undefined}
				class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
				placeholder="Enter Notes"
				{...$constraints.notes}
			/>
		</div>

		<div class="flex flex-col">
			<div class="flex gap-x-2 items-center">
				<label for="priority" class="text-sm font-medium text-gray-700">Priority (optional)</label>
				{#if $errors.priority}
					<span class="text-xs text-red-400">{$errors.priority}</span>
				{/if}
			</div>
			<input
				name="priority"
				type="text"
				bind:value={$form.priority}
				aria-invalid={$errors.priority ? 'true' : undefined}
				class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
				placeholder="Enter Priority"
				{...$constraints.priority}
			/>
		</div>

		<div class="flex flex-col">
			<div class="flex gap-x-2 items-center">
				<label for="validAt" class="text-sm font-medium text-gray-700">Valid Starting At (optional)</label>
				{#if $errors.validAt}
					<span class="text-xs text-red-400">{$errors.validAt}</span>
				{/if}
			</div>
			<input
				name="validAt"
				type="date"
				bind:value={$form.validAt}
				aria-invalid={$errors.validAt ? 'true' : undefined}
				class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
				{...$constraints.validAt}
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

	<SuperDebug data={$form} />
</Modal>