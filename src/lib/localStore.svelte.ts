import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export function useLocalStorage<T>(key: string, initialValue: T) {
	let storage = writable<T>(initialValue);

	if (browser) {
		const storedItem = localStorage.getItem(key);
		if (storedItem) {
			try {
				storage.set(JSON.parse(storedItem) as T);
			} catch (error) {
				console.error(`Error parsing localStorage key "${key}":`, error);
			}
		}
	}

	if (browser) {
		storage.subscribe((value) => {
			localStorage.setItem(key, JSON.stringify(value));
		});
	}

	return storage;
}
