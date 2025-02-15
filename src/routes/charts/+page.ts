import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const airport = url.searchParams.get('airport');
	const chart = url.searchParams.get('chart');
	const name = url.searchParams.get('name');
	const filter = url.searchParams.get('filter');

	return {
		airport,
		chart,
		name,
		filter: filter ? filter.split(',') : undefined
	};
};
