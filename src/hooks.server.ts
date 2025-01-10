import {
	deleteSessionTokenCookie,
	setSessionTokenCookie,
	validateSessionToken
} from '$lib/server/session';

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

	return await resolve(event);
}
