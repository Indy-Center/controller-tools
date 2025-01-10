import { OAuth2Client } from 'arctic';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

if (
	!building &&
	(!env.CONNECT_CLIENT_ID || !env.CONNECT_CLIENT_SECRET || !env.CONNECT_CALLBACK_URL)
)
	throw new Error('DATABASE_URL is not set');

export const client = new OAuth2Client(
	env.CONNECT_CLIENT_ID!,
	env.CONNECT_CLIENT_SECRET!,
	env.CONNECT_CALLBACK_URL!
);
