import {
	bigint,
	boolean,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

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
	color: text('color').notNull(),
	tag: text('tag'),
	geojson: jsonb('geojson')
});

export const splits = pgTable('splits', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at').defaultNow()
});

export const splitGroups = pgTable('split_groups', {
	id: uuid('id').primaryKey().defaultRandom(),
	splitId: uuid('split_id')
		.references(() => splits.id)
		.notNull(),
	name: text('name').notNull(),
	color: text('color').notNull(),
	createdAt: timestamp('created_at').defaultNow()
});

export const splitGroupAreas = pgTable('split_group_areas', {
	id: uuid('id').primaryKey().defaultRandom(),
	groupId: uuid('group_id')
		.references(() => splitGroups.id)
		.notNull(),
	areaId: text('area_id')
		.references(() => areaMetadata.id)
		.notNull(),
	createdAt: timestamp('created_at').defaultNow()
});

export const authUser = pgTable('auth_user', {
	cid: text('id').primaryKey(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	isAdmin: boolean('is_admin').default(false).notNull()
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

export type RestrictionInsertModel = InferInsertModel<typeof restriction>;

export type AreaMetadata = InferSelectModel<typeof areaMetadata>;

export type Split = InferSelectModel<typeof splits>;
export type SplitGroup = InferSelectModel<typeof splitGroups>;
export type SplitGroupArea = InferSelectModel<typeof splitGroupAreas>;
