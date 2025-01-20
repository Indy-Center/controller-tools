<script lang="ts">
	import MdiWeatherNight from 'virtual:icons/mdi/weather-night';
	import MdiWhiteBalanceSunny from 'virtual:icons/mdi/white-balance-sunny';
	import { theme } from './state.svelte';

	function toggleTheme() {
		theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
	}
</script>

<button
	type="button"
	class="text-content-secondary dark:text-content-dark-secondary hover:text-content dark:hover:text-content-dark rounded-lg p-1 text-2xl transition-colors duration-300"
	onclick={toggleTheme}
>
	{#if $theme === 'dark'}
		<MdiWeatherNight />
	{:else}
		<MdiWhiteBalanceSunny />
	{/if}
</button>
