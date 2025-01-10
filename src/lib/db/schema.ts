import { bigint, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';

export const restriction = pgTable('restrictions', {
	id: uuid('id').primaryKey().defaultRandom(),
	airport: text('airport').notNull(),
	route: text('route'),
	from: text('from').notNull(),
	to: text('to').notNull(),
	restriction: text('restriction'),
	notes: text('notes'),
	priority: numeric('priority').default('0'),
	validAt: timestamp('valid_at').defaultNow(),
	validUntil: timestamp('valid_until'),
	createdAt: timestamp('created_at').defaultNow()
});

export const areaMetadata = pgTable('area_metadata', {
	id: text('id').primaryKey(),
	short: text('short').notNull(),
	long: text('long').notNull(),
	category: text('category').notNull(),
	color: text('color').notNull()
});

export const user = pgTable('auth_user', {
	id: text('id').primaryKey()
});

export const userSession = pgTable('user_session', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	expiresAt: timestamp('expires_at').notNull()
});

export type Restriction = InferSelectModel<typeof restriction> & {
	from: AreaMetadata;
	to: AreaMetadata;
};
export type AreaMetadata = InferSelectModel<typeof areaMetadata>;

export type User = InferSelectModel<typeof user>;
