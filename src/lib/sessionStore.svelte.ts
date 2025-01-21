import { browser } from '$app/environment';

export function useSessionStorage<T>(key: string, initialValue: T) {
	// Load from sessionStorage first if available
	let storedValue: T | null = null;
	if (browser) {
		const stored = sessionStorage.getItem(key);
		if (stored) {
			try {
				storedValue = JSON.parse(stored);
			} catch (error) {
				console.error(`Error parsing sessionStorage key "${key}":`, error);
			}
		}
	}

	// Initialize state with stored value if it exists, otherwise use initial value
	let value = $state(storedValue ?? initialValue);

	// Save to sessionStorage whenever value changes
	$effect(() => {
		if (browser) {
			sessionStorage.setItem(key, JSON.stringify($state.snapshot(value)));
		}
	});

	return value;
}
