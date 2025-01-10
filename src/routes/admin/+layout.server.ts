import { redirect } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.user || !locals.user.isAdmin) {
		return redirect(307, '/');
	}
}
