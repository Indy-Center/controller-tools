export async function load({ fetch }) {
	const restrictions = await fetch('/api/restrictions');

	return {
		restrictions: await restrictions.json()
	};
}
