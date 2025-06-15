export async function load({ fetch, data }) {
	const response = await fetch('/api/routing');
	const { recommendations } = await response.json();

	return {
		...data,
		recommendations
	};
}
