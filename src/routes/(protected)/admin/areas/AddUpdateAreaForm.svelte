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

		form.update(() => {
			return {
				...$form,
				id: data.id,
				short: data.short,
				long: data.long,
				category: data.category,
				color: data.color,
				tag: data.tag,
				geojson: data.geojson
			};
		});

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
			<input name="id" type="hidden" bind:value={$form.id} {...$constraints.id} />
		{/if}

		<!-- Short Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
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
			<div class="flex items-center gap-x-2">
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
			<div class="flex items-center gap-x-2">
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
			<div class="flex items-center gap-x-2">
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

		<!-- Tag Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="tag" class="text-sm font-medium text-gray-700">Tag</label>
				{#if $errors.tag}
					<span class="text-xs text-red-400">{$errors.tag}</span>
				{/if}
			</div>
			<input
				name="tag"
				type="text"
				bind:value={$form.tag}
				aria-invalid={$errors.tag ? 'true' : undefined}
				class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
			/>
		</div>

		<!-- GeoJSON Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="geojson" class="text-sm font-medium text-gray-700">GeoJSON</label>
				{#if $errors.geojson}
					<span class="text-xs text-red-400">{$errors.geojson}</span>
				{/if}
			</div>
			<input
				type="file"
				name="geojsonFile"
				accept=".json,.geojson"
				bind:files={$geojsonFile}
				class="mt-1 rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
			/>
			<!-- Existing GeoJSON Preview -->
			{#if mode === 'EDIT' && $form.geojson}
				<div
					class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
				>
					<button
						type="button"
						class="flex w-full items-center justify-between text-left"
						onclick={() => (isPreviewOpen = !isPreviewOpen)}
					>
						<div class="flex items-center gap-x-2 text-sm">
							<span class="font-medium text-gray-700 dark:text-gray-300">Current GeoJSON</span>
							<span class="text-xs text-gray-500"
								>({Object.keys($form.geojson.features || []).length} features)</span
							>
						</div>
						<ChevronDown
							class="h-5 w-5 text-gray-500 transition-transform duration-200 ease-in-out {isPreviewOpen
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
								class="absolute inset-0 h-48 overflow-auto rounded-md bg-white p-3 font-mono text-xs text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-300">{JSON.stringify(
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
				class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:ring focus:ring-blue-300"
			>
				Submit
			</button>
			<button
				type="button"
				onclick={cancel}
				class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
			>
				Cancel
			</button>
		</div>
	</form>
</Modal>
