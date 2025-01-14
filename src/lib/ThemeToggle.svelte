<script lang="ts">
	import MdiLightbulb from 'virtual:icons/mdi/lightbulb';
	import MdiLightbulbOff from 'virtual:icons/mdi/lightbulb-off';
	import { useLocalStorage } from './localStore.svelte';
	import { browser } from '$app/environment';

	//init the store with value new
	let themeStore = useLocalStorage('theme', getInitialTheme());

	//get the theme preference from the user's browser to set the initial theme
	function getInitialTheme() {
		let initialTheme: 'light' | 'dark' = 'light';

		if (browser) {
			initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}

		return initialTheme;
	}

	//toggle the theme
	function toggleTheme() {
		$themeStore = $themeStore === 'light' ? 'dark' : 'light';
		applyTheme();
	}

	//apply the theme
	function applyTheme() {
		document.documentElement.classList.remove('light', 'dark');
		document.documentElement.classList.add($themeStore);
	}

	// TODO: Maybe we go with the Dark/Light/Browser type setting in case people just want to force it.
	if (browser) {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			if (e.matches) {
				$themeStore = 'dark';
				applyTheme();
			} else {
				$themeStore = 'light';
				applyTheme();
			}
		});

		applyTheme();
	}
</script>

<button onclick={() => toggleTheme()}>
	{#if $themeStore === 'light'}
		<MdiLightbulb />
	{:else}
		<MdiLightbulbOff />
	{/if}
</button>
