import { redirect } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.user) {
		return redirect(307, '/');
	}

	console.log(locals.user);

	return {
		user: locals.user
	};
}
