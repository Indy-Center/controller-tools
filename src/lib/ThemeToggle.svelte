<script lang="ts">
	import MdiLightbulb from 'virtual:icons/mdi/lightbulb';
	import MdiLightbulbOff from 'virtual:icons/mdi/lightbulb-off';

  // Initialize theme state
  let theme = $state('light');

  function toggleTheme() {
    console.log('toggling theme');
  }
</script>

<svelte:window />
<button onclick={toggleTheme}>
  {#if theme === 'light'}
    <MdiLightbulb />
  {:else}
    <MdiLightbulbOff />
  {/if}
</button>