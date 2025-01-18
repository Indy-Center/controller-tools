import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export function useSessionStorage<T>(key: string, initialValue: T) {
	let storage = writable<T>(initialValue);

	if (browser) {
		const storedItem = sessionStorage.getItem(key);
		if (storedItem) {
			try {
				storage.set(JSON.parse(storedItem) as T);
			} catch (error) {
				console.error(`Error parsing sessionStorage key "${key}":`, error);
			}
		}
	}

	if (browser) {
		storage.subscribe((value) => {
			sessionStorage.setItem(key, JSON.stringify(value));
		});
	}

	return storage;
}
