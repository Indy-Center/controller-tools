<!--
This is a modal that displays its children as a popup in the center of the viewport

passing closeButton as a prop will display a close button in the top right corner of the modal

  <PopupModal closeButton bind:this={modal}>
		Content...
	</PopupModal>
-->
<script lang="ts">
	import MdiCloseBoxOutline from 'virtual:icons/mdi/close-box-outline';

	let { children, closeButton = false }: { children: any; closeButton: boolean } = $props();

	let isOpen = $state(false);

	export function openModal() {
		isOpen = true;
	}

	export function closeModal() {
		isOpen = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:document onkeydown={handleKeyDown} />

<div
	class:hidden={!isOpen}
	class="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/50 backdrop-blur-sm"
>
	<div
		class="relative max-h-[90vh] overflow-y-auto rounded-lg bg-surface p-6 shadow-lg dark:bg-surface-dark"
		role="dialog"
		aria-modal="true"
	>
		{#if closeButton}
			<button
				onclick={() => closeModal()}
				class="absolute right-6 top-6 text-2xl text-content hover:text-content-secondary dark:text-content-dark dark:hover:text-content-dark-secondary"
			>
				<MdiCloseBoxOutline />
			</button>
		{/if}
		{@render children()}
	</div>
</div>
