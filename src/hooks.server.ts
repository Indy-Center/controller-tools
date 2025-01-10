import {
	deleteSessionTokenCookie,
	setSessionTokenCookie,
	validateSessionToken
} from '$lib/server/session';

export async function handle({ event, resolve }: any) {
	console.log('SERVER HOOK');
	const token = event.cookies.get('session');
	console.log('here');
	console.log(token);
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
