<script lang="ts">
	import { fileProxy, superForm } from 'sveltekit-superforms';
	import Modal from '$lib/Modal.svelte';
	import ChevronDown from 'virtual:icons/mdi/chevron-down';

	let { data }: { data: any } = $props();

	let mode = $state('ADD');
	let modal: ReturnType<typeof Modal>;
	let isPreviewOpen = $state(false);

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
			short: data.short,
			long: data.long,
			category: data.category,
			color: data.color,
			tag: data.tag,
			geojson: data.geojson,
			frequency: data.frequency
		}));
		modal.open();
	}

	function cancel() {
		reset();
		modal.close();
	}

	const geojsonFile = fileProxy(form, 'geojsonFile');
</script>

<Modal title={mode === 'ADD' ? 'Add Area' : `Update ${$form.id} Area`} bind:this={modal}>
	<form
		enctype="multipart/form-data"
		use:enhance
		method="POST"
		action={mode === 'ADD' ? '?/add' : '?/update'}
		class="flex flex-col space-y-4 p-4"
	>
		<!-- ID Field -->
		{#if mode === 'ADD'}
			<div class="flex flex-col">
				<div class="flex items-center gap-x-2">
					<label for="id" class="text-sm font-medium text-content dark:text-content-dark">ID</label>
					{#if $errors.id}
						<span class="text-xs text-action-danger">{$errors.id}</span>
					{/if}
				</div>
				<input
					name="id"
					type="text"
					bind:value={$form.id}
					aria-invalid={$errors.id ? 'true' : undefined}
					class="mt-1 rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
					placeholder="Enter ID"
					{...$constraints.id}
				/>
			</div>
		{:else}
			<input name="id" type="hidden" bind:value={$form.id} {...$constraints.id} />
		{/if}

		<!-- Short Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="short" class="text-sm font-medium text-content dark:text-content-dark"
					>Short</label
				>
				{#if $errors.short}
					<span class="text-xs text-action-danger">{$errors.short}</span>
				{/if}
			</div>
			<input
				name="short"
				type="text"
				bind:value={$form.short}
				aria-invalid={$errors.short ? 'true' : undefined}
				class="mt-1 rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				placeholder="Enter Short Name"
				{...$constraints.short}
			/>
		</div>

		<!-- Long Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="long" class="text-sm font-medium text-content dark:text-content-dark"
					>Long</label
				>
				{#if $errors.long}
					<span class="text-xs text-action-danger">{$errors.long}</span>
				{/if}
			</div>
			<input
				name="long"
				type="text"
				bind:value={$form.long}
				aria-invalid={$errors.long ? 'true' : undefined}
				class="mt-1 rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				placeholder="Enter Long Name"
				{...$constraints.long}
			/>
		</div>

		<!-- Category Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="category" class="text-sm font-medium text-content dark:text-content-dark"
					>Category</label
				>
				{#if $errors.category}
					<span class="text-xs text-action-danger">{$errors.category}</span>
				{/if}
			</div>
			<input
				name="category"
				type="text"
				bind:value={$form.category}
				aria-invalid={$errors.category ? 'true' : undefined}
				class="mt-1 rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				placeholder="Enter Category"
				{...$constraints.category}
			/>
		</div>

		<!-- Color Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="color" class="text-sm font-medium text-content dark:text-content-dark"
					>Color</label
				>
				{#if $errors.color}
					<span class="text-xs text-action-danger">{$errors.color}</span>
				{/if}
			</div>
			<input
				name="color"
				type="color"
				bind:value={$form.color}
				aria-invalid={$errors.color ? 'true' : undefined}
				class="mt-1 h-10 w-20 rounded-md border border-surface-tertiary focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				{...$constraints.color}
			/>
		</div>

		<!-- Tag Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="tag" class="text-sm font-medium text-content dark:text-content-dark">Tag</label>
				{#if $errors.tag}
					<span class="text-xs text-action-danger">{$errors.tag}</span>
				{/if}
			</div>
			<input
				name="tag"
				type="text"
				bind:value={$form.tag}
				aria-invalid={$errors.tag ? 'true' : undefined}
				class="mt-1 rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
			/>
		</div>

		<!-- Frequency Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="frequency" class="text-sm font-medium text-content dark:text-content-dark"
					>Frequency</label
				>
				{#if $errors.frequency}
					<span class="text-xs text-action-danger">{$errors.frequency}</span>
				{/if}
			</div>
			<input
				name="frequency"
				type="text"
				bind:value={$form.frequency}
				aria-invalid={$errors.frequency ? 'true' : undefined}
				class="mt-1 rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
			/>
		</div>

		<!-- GeoJSON Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="geojson" class="text-sm font-medium text-content dark:text-content-dark"
					>GeoJSON</label
				>
				{#if $errors.geojson}
					<span class="text-xs text-action-danger">{$errors.geojson}</span>
				{/if}
			</div>
			<input
				type="file"
				name="geojsonFile"
				accept=".json,.geojson"
				bind:files={$geojsonFile}
				class="mt-1 rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
			/>
			<!-- Existing GeoJSON Preview -->
			{#if mode === 'EDIT' && $form.geojson}
				<div
					class="mt-4 rounded-lg border border-surface-tertiary bg-surface-secondary p-3 dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary"
				>
					<button
						type="button"
						class="flex w-full items-center justify-between text-left"
						onclick={() => (isPreviewOpen = !isPreviewOpen)}
					>
						<div class="flex items-center gap-x-2 text-sm">
							<span class="font-medium text-content dark:text-content-dark">Current GeoJSON</span>
							<span class="text-xs text-content-tertiary dark:text-content-dark-tertiary"
								>({Object.keys($form.geojson.features || []).length} features)</span
							>
						</div>
						<ChevronDown
							class="h-5 w-5 text-content-tertiary transition-transform duration-200 ease-in-out dark:text-content-dark-tertiary {isPreviewOpen
								? 'rotate-180'
								: ''}"
						/>
					</button>
					<div
						class="transition-all duration-200 ease-in-out {isPreviewOpen
							? 'h-48 max-h-48 opacity-100'
							: 'max-h-0 overflow-hidden opacity-0'}"
					>
						<div class="relative mt-2">
							<pre
								class="absolute inset-0 h-48 overflow-auto rounded-md bg-surface p-3 font-mono text-xs text-content shadow-sm dark:bg-surface-dark dark:text-content-dark">{JSON.stringify(
									$form.geojson,
									null,
									2
								)}</pre>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Submit Button -->
		<div class="flex justify-end gap-x-2">
			<button
				type="submit"
				class="rounded bg-action-primary px-4 py-2 text-white hover:bg-sky-600 focus:ring focus:ring-sky-300"
			>
				Submit
			</button>
			<button
				type="button"
				onclick={cancel}
				class="rounded bg-action-danger px-4 py-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
			>
				Cancel
			</button>
		</div>
	</form>
</Modal>
