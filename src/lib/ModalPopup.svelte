<!--
This is a modal that displays its children as a popup in the center of the viewport

passing closeButton as a prop will display a close button in the top right corner of the modal

  <PopupModal closeButton bind:this={modal}>
		Content...
	</PopupModal>
-->
<script lang="ts">
	import MdiCloseBoxOutline from 'virtual:icons/mdi/close-box-outline.svelte';
	let { children, closeButton = false } = $props();

	let isOpen = $state(false);

	const toggleModal = (): void => {
		isOpen = !isOpen;
	};

	const openModal = () => {
		isOpen = true;
	};

	const closeModal = () => {
		isOpen = false;
	};

	export { toggleModal, openModal, closeModal };
</script>

<div
	class:hidden={!isOpen}
	class=" fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50"
>
	<div class="bg relative max-h-[90vh] overflow-y-auto rounded-lg p-6 shadow-lg">
		{#if closeButton}
			<button
				onclick={() => closeModal()}
				class=" absolute right-6 top-6 text-2xl text-white hover:text-zinc-200"
			>
				<MdiCloseBoxOutline class="h-6 w-6" />
			</button>
		{/if}
		{@render children()}
	</div>
</div>
