import { browser } from '$app/environment';

export function useLocalStorage<T>(key: string, initialValue: T) {
	let storage = $state<{ value: T }>({ value: initialValue });

	if (browser) {
		const storedItem = localStorage.getItem(key);
		if (storedItem) {
			try {
				storage.value = JSON.parse(storedItem) as T;
			} catch (error) {
				console.error(`Error parsing localStorage key "${key}":`, error);
			}
		}
	}

	$effect(() => {
		if (browser) {
			localStorage.setItem(key, JSON.stringify(storage.value));
		}
	});

	return storage;
}
