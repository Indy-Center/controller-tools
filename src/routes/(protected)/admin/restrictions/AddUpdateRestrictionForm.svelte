<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
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
		form.update(() => ({
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
		}));
		modal.open();
	}

	function cancel() {
		reset();
		modal.close();
	}
</script>

<Modal title={mode === 'ADD' ? 'Add Restriction' : `Update Restriction`} bind:this={modal}>
	<form use:enhance method="POST" action="?/upsert" class="flex flex-col space-y-4 p-4">
		{#if mode === 'EDIT'}
			<input name="id" type="hidden" bind:value={$form.id} />
		{/if}

		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="airport" class="text-content dark:text-content-dark text-sm font-medium"
					>Airport</label
				>
				{#if $errors.airport}
					<span class="text-action-danger text-xs">{$errors.airport}</span>
				{/if}
			</div>
			<input
				name="airport"
				type="text"
				bind:value={$form.airport}
				aria-invalid={$errors.airport ? 'true' : undefined}
				class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface dark:bg-surface-dark text-content dark:text-content-dark focus:border-accent focus:ring-accent/20 mt-1 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				placeholder="Enter Airport(s)"
				{...$constraints.airport}
			/>
		</div>

		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="route" class="text-content dark:text-content-dark text-sm font-medium"
					>Route (optional)</label
				>
				{#if $errors.route}
					<span class="text-action-danger text-xs">{$errors.route}</span>
				{/if}
			</div>
			<input
				name="route"
				type="text"
				bind:value={$form.route}
				aria-invalid={$errors.route ? 'true' : undefined}
				class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface dark:bg-surface-dark text-content dark:text-content-dark focus:border-accent focus:ring-accent/20 mt-1 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				placeholder="Enter route or leave blank for all"
				{...$constraints.route}
			/>
		</div>

		<div class="flex w-full gap-2">
			<div class="flex flex-grow flex-col">
				<div class="flex items-center gap-x-2">
					<label for="from" class="text-content dark:text-content-dark text-sm font-medium"
						>From</label
					>
					{#if $errors.from}
						<span class="text-action-danger text-xs">{$errors.from}</span>
					{/if}
				</div>
				<select
					name="from"
					bind:value={$form.from}
					aria-invalid={$errors.from ? 'true' : undefined}
					class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface dark:bg-surface-dark text-content dark:text-content-dark focus:border-accent focus:ring-accent/20 mt-1 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
					{...$constraints.from}
				>
					{#each areas as area}
						<option id={area.id} value={area.id}>{area.long}</option>
					{/each}
				</select>
			</div>
			<div class="flex flex-grow flex-col">
				<div class="flex items-center gap-x-2">
					<label for="to" class="text-content dark:text-content-dark text-sm font-medium">To</label>
					{#if $errors.to}
						<span class="text-action-danger text-xs">{$errors.to}</span>
					{/if}
				</div>
				<select
					name="to"
					bind:value={$form.to}
					aria-invalid={$errors.to ? 'true' : undefined}
					class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface dark:bg-surface-dark text-content dark:text-content-dark focus:border-accent focus:ring-accent/20 mt-1 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
					{...$constraints.to}
				>
					{#each areas as area}
						<option id={area.id} value={area.id}>{area.long}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="restriction" class="text-content dark:text-content-dark text-sm font-medium"
					>Restriction (optional)</label
				>
				{#if $errors.restriction}
					<span class="text-action-danger text-xs">{$errors.restriction}</span>
				{/if}
			</div>
			<input
				name="restriction"
				type="text"
				bind:value={$form.restriction}
				aria-invalid={$errors.restriction ? 'true' : undefined}
				class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface dark:bg-surface-dark text-content dark:text-content-dark focus:border-accent focus:ring-accent/20 mt-1 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				placeholder="Enter Restrictions"
				{...$constraints.restriction}
			/>
		</div>

		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="notes" class="text-content dark:text-content-dark text-sm font-medium"
					>Notes (optional)</label
				>
				{#if $errors.notes}
					<span class="text-action-danger text-xs">{$errors.notes}</span>
				{/if}
			</div>
			<input
				name="notes"
				type="text"
				bind:value={$form.notes}
				aria-invalid={$errors.notes ? 'true' : undefined}
				class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface dark:bg-surface-dark text-content dark:text-content-dark focus:border-accent focus:ring-accent/20 mt-1 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				placeholder="Enter Notes"
				{...$constraints.notes}
			/>
		</div>

		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="priority" class="text-content dark:text-content-dark text-sm font-medium"
					>Priority (optional)</label
				>
				{#if $errors.priority}
					<span class="text-action-danger text-xs">{$errors.priority}</span>
				{/if}
			</div>
			<input
				name="priority"
				type="text"
				bind:value={$form.priority}
				aria-invalid={$errors.priority ? 'true' : undefined}
				class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface dark:bg-surface-dark text-content dark:text-content-dark focus:border-accent focus:ring-accent/20 mt-1 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				placeholder="Enter Priority"
				{...$constraints.priority}
			/>
		</div>

		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="validAt" class="text-content dark:text-content-dark text-sm font-medium"
					>Valid Starting At (optional)</label
				>
				{#if $errors.validAt}
					<span class="text-action-danger text-xs">{$errors.validAt}</span>
				{/if}
			</div>
			<input
				name="validAt"
				type="date"
				bind:value={$form.validAt}
				aria-invalid={$errors.validAt ? 'true' : undefined}
				class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface dark:bg-surface-dark text-content dark:text-content-dark focus:border-accent focus:ring-accent/20 mt-1 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				{...$constraints.validAt}
			/>
		</div>

		<!-- Submit Button -->
		<div class="flex justify-end gap-x-2">
			<button
				type="submit"
				class="bg-action-primary rounded px-4 py-2 text-white hover:bg-sky-600 focus:ring focus:ring-sky-300"
			>
				Submit
			</button>
			<button
				type="button"
				onclick={() => cancel()}
				class="bg-action-danger rounded px-4 py-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
			>
				Cancel
			</button>
		</div>
	</form>
</Modal>
