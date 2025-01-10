import type { RequestEvent } from '@sveltejs/kit';
import { decodeIdToken, OAuth2Tokens } from 'arctic';
import { client } from '$lib/server/oauth';
import { db } from '$lib/server/db';
import { user } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';
import { env } from '$env/dynamic/private';

export async function GET(event: RequestEvent): Promise<Response> {
	// Extract query parameters
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('connect_oauth_state');

	// Validate parameters
	if (!code || !state || !storedState) {
		console.error('Missing required query parameters or cookies', { code, state, storedState });
		return new Response(JSON.stringify({ error: 'Invalid request' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (state !== storedState) {
		console.error('State mismatch', { received: state, expected: storedState });
		return new Response(JSON.stringify({ error: 'State mismatch' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	let tokens: OAuth2Tokens;
	try {
		// Exchange the authorization code for tokens
		tokens = await client.validateAuthorizationCode(
			`${env.CONNECT_BASE_URL!}/oauth/token`,
			code,
			null
		);
	} catch (error) {
		console.error('Error during token exchange', error);
		return new Response(JSON.stringify({ error: 'Failed to validate authorization code' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Fetch user details
	let userDetails: { data: { cid: string; personal: { name_first: string; name_last: string } } };
	try {
		const response = await fetch(`${env.CONNECT_BASE_URL!}/api/user`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokens.accessToken()}`
			}
		});

		console.log(response);

		if (!response.ok) {
			console.error('Failed to fetch user details', { status: response.status });
			return new Response(JSON.stringify({ error: 'Failed to fetch user details' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		userDetails = await response.json();
	} catch (error) {
		console.error('Error during user details fetch', error);
		return new Response(JSON.stringify({ error: 'Error fetching user details' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Decode the ID token to extract claims
	let claims;
	try {
		claims = decodeIdToken(tokens.accessToken());
	} catch (error) {
		console.error('Error decoding ID token', error);
		return new Response(JSON.stringify({ error: 'Invalid ID token' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	console.log('User details:', userDetails);
	console.log('Decoded claims:', claims);

	const users = await db.select().from(user).where(eq(user.id, userDetails.data.cid));

	// Check if user exists (array will be empty if not found)
	if (users.length === 0) {
		// Insert new user
		await db.insert(user).values({
			id: userDetails.data.cid
		});
	}

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, userDetails.data.cid);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);

	return new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
}
