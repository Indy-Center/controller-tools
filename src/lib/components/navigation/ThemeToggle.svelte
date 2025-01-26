<script lang="ts">
	import MdiWeatherNight from 'virtual:icons/mdi/weather-night';
	import MdiWhiteBalanceSunny from 'virtual:icons/mdi/white-balance-sunny';
	import { theme } from '../../state.svelte';

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
		<MdiWeatherNight />
	{:else}
		<MdiWhiteBalanceSunny />
	{/if}
</button>
