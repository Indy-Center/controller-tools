<script lang="ts">
	import Modal from '$lib/Modal.svelte';

	let { message, action }: { message: string; action: string } = $props();

	let modal: ReturnType<typeof Modal>;
	let formData: Record<string, any> | null = $state(null);

	/**
	 * Opens the confirmation modal and sets the form data.
	 * @param data - An object containing key-value pairs for hidden fields.
	 */
	export function prompt(data: Record<string, string>) {
		formData = data;
		modal.open();
	}
</script>

<Modal title="Are you sure?" bind:this={modal}>
	<div class="text-content dark:text-content-dark p-4">
		<p class="mb-4">{message}</p>
		<form method="POST" {action}>
			<!-- Generate hidden fields dynamically -->
			{#if formData}
				{#each Object.entries(formData) as [key, value]}
					<input type="hidden" name={key} {value} />
				{/each}
			{/if}

			<!-- Action Buttons -->
			<div class="flex justify-end gap-x-2">
				<button
					type="submit"
					class="bg-action-primary rounded px-4 py-2 text-white hover:bg-sky-600 focus:ring focus:ring-sky-300"
				>
					Confirm
				</button>
				<button
					type="button"
					onclick={() => modal.close()}
					class="bg-action-danger rounded px-4 py-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
				>
					Cancel
				</button>
			</div>
		</form>
	</div>
</Modal>
