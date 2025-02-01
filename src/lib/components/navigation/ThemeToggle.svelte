<script lang="ts">
	import { theme } from '../../state.svelte';
	import MdiIcon from '../MdiIcon.svelte';

	function toggleTheme() {
		theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
	}
</script>

<button
	type="button"
	class="rounded-lg p-1 text-2xl text-content-secondary transition-colors duration-300 hover:text-content dark:text-content-dark-secondary dark:hover:text-content-dark"
	onclick={toggleTheme}
>
	{#if $theme === 'dark'}
		<MdiIcon name="weather-night" />
	{:else}
		<MdiIcon name="white-balance-sunny" />
	{/if}
</button>
