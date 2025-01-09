<script lang="ts">
	import ModalPopup from "./ModalPopup.svelte";
	import ThemeToggle from "./ThemeToggle.svelte";
	import MdiCog from 'virtual:icons/mdi/cog';
  let modal: any;

</script>

<div class="flex align-center justify-end">
  <button class="text-xl" onclick={modal.openModal()}>
    <MdiCog />
  </button>
</div>

<ModalPopup closeButton={true} bind:this={modal}>
  <div class="text-xl flex flex-col items-center gap-4">
    <h3 class="font-bold text-2xl mb-4">Settings</h3>
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
