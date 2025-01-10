import type { RequestEvent } from '@sveltejs/kit';
import { generateCodeVerifier, generateState } from 'arctic';
import { client } from '$lib/server/oauth';

export async function GET(event: RequestEvent): Promise<Response> {
	const state = generateState();

	const url = client.createAuthorizationURL('https://auth-dev.vatsim.net/oauth/authorize', state, [
		'full_name',
		'vatsim_details'
	]);

	event.cookies.set('connect_oauth_state', state, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
}
