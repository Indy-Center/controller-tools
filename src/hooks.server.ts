import { fetchOnlineControllers } from '$lib/api';
import {
	deleteSessionTokenCookie,
	setSessionTokenCookie,
	validateSessionToken
} from '$lib/server/session';
import { error, redirect } from '@sveltejs/kit';

export async function handle({ event, resolve }: any) {
	const token = event.cookies.get('session');
	if (token === null) {
		event.locals.user = null;
		event.locals.session = null;

		return await resolve(event);
	}

	const { session, user } = await validateSessionToken(token);

	if (session === null) {
		deleteSessionTokenCookie(event);
	} else {
		setSessionTokenCookie(event, token, session.expiresAt);
	}

	event.locals.session = session;
	event.locals.user = user;

	// Check to see if the user is currently connected to VATSIM
	const controllers = await fetchOnlineControllers();
	if (controllers.find((c) => c.cid == user?.cid)) {
		event.locals.controllerInfo = controllers.find((c) => c.cid == user?.cid);
	}

	// Protected routes require admin access
	if (event.route?.id?.startsWith('/(protected)/')) {
		if (!user || !user.isAdmin) {
			throw error(401, 'You do not have access to view this resource.');
		}
	}

	return await resolve(event);
}
