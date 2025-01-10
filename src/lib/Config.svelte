<script lang="ts">
	import ModalPopup from './ModalPopup.svelte';
	import MdiCog from 'virtual:icons/mdi/cog';
	import ThemeToggle from './ThemeToggle.svelte';
	let modal: any;
</script>

<div class="align-center flex justify-end">
	<button class="text-xl text-white" onclick={() => modal.openModal()}>
		<MdiCog />
	</button>
</div>

<ModalPopup closeButton={true} bind:this={modal}>
	<div class="flex flex-col items-center gap-4 text-xl">
		<h3 class="mb-4 text-2xl font-bold">Settings</h3>
		<div class="flex items-center gap-2">
			<span>Toggle Theme:</span>
			<ThemeToggle />
		</div>
		<a
			href="http://wiki.zidartcc.org/docs/icct"
			target="_blank"
			rel="noopener noreferrer"
			class="underline hover:no-underline"
		>
			Read the user manual
		</a>
		<a
			href="https://github.com/Indy-Center/controller-tools/issues"
			target="_blank"
			rel="noopener noreferrer"
			class="underline hover:no-underline"
		>
			Report Issues on GitHub
		</a>
	</div>
</ModalPopup>
