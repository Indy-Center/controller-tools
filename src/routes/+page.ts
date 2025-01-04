export async function load({ fetch }) {
	return await fetch('/api/data').then((res) => res.json());
}
