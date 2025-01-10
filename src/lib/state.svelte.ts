import { useLocalStorage } from './localStore.svelte';

export const restrictionFilters: RestrictionFilters = $state({
	areas: [],
	search: ''
});

export const restrictionConfig = useLocalStorage('restrictionConfig', {
	includeIncoming: true,
	hideInternal: false,
	dimIncoming: true
});
