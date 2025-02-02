<script lang="ts">
	import SuperDebug, { fileProxy, superForm } from 'sveltekit-superforms';
	import Modal from '$lib/Modal.svelte';
	import MdiIcon from '$lib/components/MdiIcon.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import MdiIconSelect from '$lib/components/MdiIconSelect.svelte';

	let { data }: { data: any } = $props();

	let mode = $state('ADD');
	let modal: ReturnType<typeof Modal>;
	let fileInput: HTMLInputElement;

	type StaticElement = {
		name: string;
		color: string;
		geojson: any;
	};

	let components: StaticElement[] = $state([]);

	const { form, errors, constraints, message, enhance, reset } = superForm(data.form, {
		dataType: 'json',
		onUpdated({ form }) {
			if (form.valid) {
				modal.close();
			}
		}
	});

	export function create() {
		mode = 'ADD';
		reset();
		components = [];
		modal.open();
	}

	export function edit(data: any) {
		mode = 'EDIT';
		form.update(() => ({
			...$form,
			id: data.id,
			icon: data.icon,
			name: data.name
		}));

		components = data.components;
		modal.open();
	}

	function cancel() {
		reset();
		modal.close();
	}

	function addElements() {
		fileInput.click();
	}

	function removeElement(index: number) {
		components = components.filter((_, i) => i !== index);
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files?.length) {
			const newElements: StaticElement[] = [];

			for (const file of input.files) {
				try {
					const text = await file.text();
					const geojson = JSON.parse(text);
					newElements.push({
						name: file.name.replace(/\.(json|geojson)$/, ''),
						color: '#3B82F6',
						geojson
					});
				} catch (e) {
					console.error('Invalid JSON file:', file.name);
				}
			}

			components = [...components, ...newElements];
			input.value = ''; // Reset input for future selections
		}
	}

	$effect(() => {
		$form.components = components;
	});
</script>

<Modal
	title={mode === 'ADD' ? 'Add Static Element Group' : `Update ${$form.name} Static Element Group`}
	bind:this={modal}
>
	<form
		enctype="multipart/form-data"
		use:enhance
		method="POST"
		action="?/addUpdateStaticElements"
		class="flex flex-col space-y-4 p-4"
	>
		{#if mode === 'EDIT'}
			<input name="id" type="hidden" bind:value={$form.id} />
		{/if}

		<!-- Name Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="name" class="text-sm font-medium text-content dark:text-content-dark"
					>Group Name</label
				>
				{#if $errors.name}
					<span class="text-xs text-action-danger">{$errors.name}</span>
				{/if}
			</div>
			<input
				name="name"
				type="text"
				bind:value={$form.name}
				aria-invalid={$errors.name ? 'true' : undefined}
				class="mt-1 rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
				placeholder="Enter Group Name"
				{...$constraints.name}
			/>
		</div>

		<!-- Icon Field -->
		<div class="flex flex-col">
			<div class="flex items-center gap-x-2">
				<label for="icon" class="text-sm font-medium text-content dark:text-content-dark"
					>Material Design Icon Name</label
				>
				{#if $errors.icon}
					<span class="text-xs text-action-danger">{$errors.icon}</span>
				{/if}
			</div>
			<MdiIconSelect
				name="icon"
				bind:value={$form.icon}
				error={$errors.icon}
				placeholder="Search for an icon..."
				constraints={$constraints.icon}
			/>
		</div>

		<!-- Static Elements Section -->
		<div class="flex flex-col space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-medium text-content dark:text-content-dark">Static Elements</h3>
				<button
					type="button"
					onclick={addElements}
					class="rounded bg-action-primary px-3 py-1.5 text-sm text-white hover:bg-sky-600 focus:ring focus:ring-sky-300"
				>
					Add Elements
				</button>
			</div>

			<input
				type="file"
				accept=".json,.geojson"
				onchange={handleFileSelect}
				multiple
				class="hidden"
				bind:this={fileInput}
			/>

			{#if components.length === 0}
				<EmptyState
					icon="map-marker-plus"
					message="This group has no static elements. Click add to upload GeoJSON files."
				/>
			{:else}
				<div class="space-y-2">
					{#each components as element, i}
						<div
							class="flex items-center gap-x-4 rounded-md border border-surface-tertiary bg-surface p-3 dark:border-surface-dark-tertiary dark:bg-surface-dark"
						>
							<input
								type="text"
								bind:value={element.name}
								class="flex-1 rounded-md border border-surface-tertiary bg-surface p-1.5 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
							/>
							<input
								type="color"
								bind:value={element.color}
								class="h-8 w-14 rounded-md border border-surface-tertiary focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
							/>
							<span class="text-xs text-content-secondary dark:text-content-dark-secondary">
								({Object.keys(element.geojson.features || []).length} features)
							</span>
							<button
								type="button"
								class="text-action-danger hover:text-red-600"
								onclick={() => removeElement(i)}
							>
								<MdiIcon name="delete" class="h-5 w-5" />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Submit Button -->
		<div class="flex justify-end gap-x-2">
			<button
				type="submit"
				class="rounded bg-action-primary px-4 py-2 text-white hover:bg-sky-600 focus:ring focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={$form.components.length === 0}
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
