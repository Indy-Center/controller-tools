import { type Actions, fail, redirect } from '@sveltejs/kit';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/session';

export async function load({ locals }) {
	// redirect user if not logged in
	if (!locals.user) {
		throw redirect(302, `/`);
	}
}

export const actions: Actions = {
	default: async (event: any) => {
		if (event.locals.session === null) {
			return fail(401);
		}
		await invalidateSession(event.locals.session.id);
		deleteSessionTokenCookie(event);
		return redirect(302, '/');
	}
};
