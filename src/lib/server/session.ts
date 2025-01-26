import { authUserTable, userSessionTable } from '$lib/db/schema';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

export function generateSessionToken(): string {
	return encodeBase32LowerCaseNoPadding(crypto.getRandomValues(new Uint8Array(20)));
}

export async function createSession(token: string, id: string): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const session = {
		id: sessionId,
		userId: id,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};

	await db.insert(userSessionTable).values({
		id: session.id,
		userId: session.userId,
		expiresAt: session.expiresAt
	});

	return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const [row] = await db
		.select()
		.from(userSessionTable)
		.where(eq(userSessionTable.id, sessionId))
		.innerJoin(authUserTable, eq(authUserTable.cid, userSessionTable.userId));
	if (!row) {
		return { session: null, user: null };
	}

	const session = {
		id: row.user_session.id,
		userId: row.user_session.userId,
		expiresAt: row.user_session.expiresAt
	};

	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(userSessionTable).where(eq(userSessionTable.id, sessionId));
		return { session: null, user: null };
	}

	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

		await db
			.update(userSessionTable)
			.set({
				expiresAt: session.expiresAt
			})
			.where(eq(userSessionTable.id, sessionId));
	}

	return { session, user: row.auth_user };
}

export async function invalidateSession(sessionId: string) {
	await db.delete(userSessionTable).where(eq(userSessionTable.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set('session', token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set('session', '', {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0,
		path: '/'
	});
}

export type Session = {
	id: string;
	userId: string;
	expiresAt: Date;
};

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };
