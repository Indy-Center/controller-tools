import { useLocalStorage } from './localStore.svelte';

export const restrictionFilters: RestrictionFilters = $state({
	areas: [],
	search: '',
	selectedSplit: ''
});

// This state should only be read from for UI styling and stuff
// it should not be used for auth purposes.
// This is populated from hooks.server.js -> +layout.svelte -> this.
let userInfo: User | null = $state(null);

export function getUserInfo() {
	return userInfo;
}

export function setUserInfo(user: User | null) {
	userInfo = user;
}

export const restrictionConfig = useLocalStorage('restrictionConfig', {
	includeIncoming: true,
	hideInternal: false,
	dimIncoming: true
});

// Theme uses local storage to persist between sessions
export const theme = useLocalStorage<'light' | 'dark'>('theme', 'light');
