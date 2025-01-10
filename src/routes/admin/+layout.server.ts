import { redirect } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.user) {
		return redirect(307, '/');
	}

	return {
		user: locals.user
	};
}
