<script lang="ts">
	import Modal from '$lib/Modal.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import MdiIcon from '$lib/components/MdiIcon.svelte';
	import { superForm } from 'sveltekit-superforms';
	import type { SuperValidated } from 'sveltekit-superforms';

	let { data }: { data: SuperValidated<any> } = $props();

	let mode = $state('ADD');
	let modal: ReturnType<typeof Modal>;
	let fileInput: HTMLInputElement;

	type OverlayComponent = {
		name: string;
		color: string;
		geojson: any;
		settings: {
			weight?: number;
			opacity?: number;
			lineCap?: string;
			lineJoin?: string;
			radius?: number;
			fillOpacity?: number;
		};
	};

	let components: OverlayComponent[] = $state([]);
	let activeElement: OverlayComponent | null = $state(null);
	let fileUploadError = $state<string | undefined>();

	const { form, errors, constraints, message, enhance, reset } = superForm(data, {
		dataType: 'json',
		onUpdated({ form }) {
			if (form.valid) {
				modal.close();
			}
		}
	});

	const defaultSettings = {
		weight: 1,
		opacity: 0.8,
		lineCap: 'round',
		lineJoin: 'round',
		radius: 2,
		fillOpacity: 0.8
	};

	export function create() {
		mode = 'ADD';
		reset();
		components = [];
		fileUploadError = undefined;
		modal.open();
	}

	export function edit(data: any) {
		mode = 'EDIT';
		fileUploadError = undefined;
		form.update((f) => ({
			...f,
			id: data.id,
			name: data.name,
			isPublished: data.isPublished
		}));

		// Ensure each component has the required settings
		components = data.components.map((component: any) => ({
			...component,
			settings: {
				...defaultSettings,
				...component.settings
			}
		}));
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
			const newElements: OverlayComponent[] = [];
			const errors: string[] = [];

			for (const file of input.files) {
				try {
					const text = await file.text();
					const geojson = JSON.parse(text);

					// Validate it has features array
					if (!geojson.features || !Array.isArray(geojson.features)) {
						throw new Error('Invalid GeoJSON: Missing features array');
					}

					newElements.push({
						name: file.name.replace(/\.(json|geojson)$/, ''),
						color: '#3B82F6',
						geojson,
						settings: { ...defaultSettings }
					});
				} catch (e) {
					errors.push(`${file.name}: ${e instanceof Error ? e.message : 'Invalid JSON format'}`);
				}
			}

			if (errors.length > 0) {
				fileUploadError = errors.join('\n');
			} else {
				fileUploadError = undefined;
			}

			components = [...components, ...newElements];
			input.value = ''; // Reset input for future selections
		}
	}

	$effect(() => {
		$form.components = components;
	});

	function toggleSettings(element: OverlayComponent, event: MouseEvent) {
		if (activeElement === element) {
			activeElement = null;
		} else {
			activeElement = element;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.settings-dropdown') && !target.closest('.settings-button')) {
			activeElement = null;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && activeElement) {
			event.preventDefault();
			activeElement = null;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<Modal
	title={mode === 'ADD' ? 'Add Overlay Group' : `Update ${$form.name} Overlay Group`}
	bind:this={modal}
>
	<form
		enctype="multipart/form-data"
		use:enhance
		method="POST"
		action="?/addUpdateOverlays"
		class="flex flex-col space-y-4 p-4"
		onsubmit={(e) => {
			if (activeElement) {
				e.preventDefault();
				activeElement = null;
			}
		}}
	>
		{#if mode === 'EDIT'}
			<input name="id" type="hidden" bind:value={$form.id} />
		{/if}
		{#if fileUploadError}
			<div class="rounded-md bg-action-danger/10 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<MdiIcon name="alert-circle" class="h-5 w-5 text-action-danger" />
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-action-danger">File Upload Error</h3>
						<div class="mt-2 text-sm text-action-danger/90">
							<ul class="list-inside list-disc space-y-1">
								{#each fileUploadError.split('\n') as error}
									<li>{error}</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			</div>
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

		<!-- Overlay Elements Section -->
		<div class="flex flex-col space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-medium text-content dark:text-content-dark">Overlay Elements</h3>
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
					message="This group has no overlay elements. Click add to upload GeoJSON files."
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
							<div class="flex items-center gap-2">
								<input
									type="color"
									bind:value={element.color}
									class="h-8 w-14 rounded-md border border-surface-tertiary focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
								/>
								<input
									type="text"
									bind:value={element.color}
									placeholder="#000000"
									class="mt-1 rounded-md border border-surface-tertiary bg-surface p-2 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
									pattern="^#[0-9A-Fa-f]{6}$"
								/>
							</div>
							<div class="relative">
								<button
									type="button"
									class="settings-button flex items-center gap-x-1 rounded-md bg-surface-secondary px-2 py-1 text-xs text-content hover:bg-surface-tertiary dark:bg-surface-dark-secondary dark:text-content-dark dark:hover:bg-surface-dark-tertiary"
									onclick={(e) => toggleSettings(element, e)}
								>
									<MdiIcon name="cog" class="h-4 w-4" />
									Settings
								</button>
								{#if activeElement === element}
									<div
										class="settings-dropdown absolute right-0 top-full z-[1002] mt-2 w-[300px] rounded-md border border-surface-tertiary bg-surface p-4 shadow-lg dark:border-surface-dark-tertiary dark:bg-surface-dark"
									>
										<div class="mb-4 flex items-center justify-between">
											<h3 class="text-sm font-medium">Element Settings</h3>
											<div class="flex gap-x-2">
												<button
													type="button"
													class="flex items-center gap-x-1 rounded-md bg-surface-secondary px-2 py-1 text-xs text-content hover:bg-surface-tertiary dark:bg-surface-dark-secondary dark:text-content-dark dark:hover:bg-surface-dark-tertiary"
													onclick={() => {
														if (activeElement) {
															activeElement.settings = defaultSettings;
															activeElement = null;
														}
													}}
												>
													<MdiIcon name="refresh" class="h-4 w-4" />
													Reset
												</button>
												<button
													type="button"
													class="flex items-center gap-x-1 rounded-md bg-surface-secondary px-2 py-1 text-xs text-content hover:bg-surface-tertiary dark:bg-surface-dark-secondary dark:text-content-dark dark:hover:bg-surface-dark-tertiary"
													onclick={() => (activeElement = null)}
												>
													<MdiIcon name="close" class="h-4 w-4" />
												</button>
											</div>
										</div>

										<div class="grid grid-cols-2 gap-4">
											<div>
												<label class="mb-1 block text-xs" for="weight">Weight</label>
												<input
													type="number"
													name="weight"
													bind:value={element.settings.weight}
													step="0.1"
													min="0"
													max="10"
													class="w-full rounded-md border border-surface-tertiary bg-surface p-1.5 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
												/>
											</div>
											<div>
												<label class="mb-1 block text-xs" for="opacity">Opacity</label>
												<input
													type="number"
													name="opacity"
													bind:value={element.settings.opacity}
													step="0.1"
													min="0"
													max="1"
													class="w-full rounded-md border border-surface-tertiary bg-surface p-1.5 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
												/>
											</div>
											<div>
												<label class="mb-1 block text-xs" for="line-cap">Line Cap</label>
												<select
													name="line-cap"
													bind:value={element.settings.lineCap}
													class="w-full rounded-md border border-surface-tertiary bg-surface p-1.5 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
												>
													<option value="round">Round</option>
													<option value="butt">Butt</option>
													<option value="square">Square</option>
												</select>
											</div>
											<div>
												<label class="mb-1 block text-xs" for="line-join">Line Join</label>
												<select
													name="line-join"
													bind:value={element.settings.lineJoin}
													class="w-full rounded-md border border-surface-tertiary bg-surface p-1.5 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
												>
													<option value="round">Round</option>
													<option value="bevel">Bevel</option>
													<option value="miter">Miter</option>
												</select>
											</div>
											<div>
												<label class="mb-1 block text-xs" for="radius">Radius</label>
												<input
													name="radius"
													type="number"
													bind:value={element.settings.radius}
													step="0.5"
													min="0"
													max="20"
													class="w-full rounded-md border border-surface-tertiary bg-surface p-1.5 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
												/>
											</div>
											<div>
												<label class="mb-1 block text-xs" for="fill-opacity">Fill Opacity</label>
												<input
													name="fill-opacity"
													type="number"
													bind:value={element.settings.fillOpacity}
													step="0.1"
													min="0"
													max="1"
													class="w-full rounded-md border border-surface-tertiary bg-surface p-1.5 text-sm text-content focus:border-accent focus:outline-none focus:ring focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
												/>
											</div>
										</div>
									</div>
								{/if}
							</div>
							<span class="text-xs text-content-secondary dark:text-content-dark-secondary">
								({Object.keys(element.geojson.features || []).length} features)
							</span>
							<button
								type="button"
								onclick={() => removeElement(i)}
								class="text-action-danger hover:text-red-600"
							>
								<MdiIcon name="delete" class="h-5 w-5" />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Form Actions -->
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
