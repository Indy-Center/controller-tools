import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';

export const restrictionsTable = pgTable('restrictions', {
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

export const areaMetadataTable = pgTable('area_metadata', {
	id: text('id').primaryKey(),
	short: text('short').notNull(),
	long: text('long').notNull(),
	category: text('category').notNull(),
	color: text('color').notNull(),
	tag: text('tag'),
	geojson: jsonb('geojson')
});

export const splitsTable = pgTable('splits', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	isPublished: boolean('is_published').notNull().default(false),
	isDefault: boolean('is_default').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow()
});

export const splitGroupsTable = pgTable('split_groups', {
	id: uuid('id').primaryKey().defaultRandom(),
	splitId: uuid('split_id')
		.references(() => splitsTable.id, { onDelete: 'cascade' })
		.notNull(),
	name: text('name').notNull(),
	color: text('color').notNull(),
	createdAt: timestamp('created_at').defaultNow()
});

export const splitGroupAreasTable = pgTable('split_group_areas', {
	id: uuid('id').primaryKey().defaultRandom(),
	groupId: uuid('group_id')
		.references(() => splitGroupsTable.id, { onDelete: 'cascade' })
		.notNull(),
	areaId: text('area_id')
		.references(() => areaMetadataTable.id, { onDelete: 'cascade' })
		.notNull(),
	createdAt: timestamp('created_at').defaultNow()
});

export const authUserTable = pgTable('auth_user', {
	cid: text('id').primaryKey(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	isAdmin: boolean('is_admin').default(false).notNull()
});

export const userSessionTable = pgTable('user_session', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	expiresAt: timestamp('expires_at').notNull()
});

export type Restriction = InferSelectModel<typeof restrictionsTable> & {
	from: AreaMetadata;
	to: AreaMetadata;
};

// Stats Items

// Airline Codes
// Company	Country	Telephony	3Ltr
export const airlinesTable = pgTable(
	'airlines',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		company: text('company').notNull(),
		country: text('country').notNull(),
		telephony: text('telephony'),
		code: text('code').notNull()
	},
	(table) => ({
		codeIdx: index('airline_code_index').on(table.code)
	})
);

export const aircraftTable = pgTable(
	'aircraft',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		code: text('code').notNull(),
		class: text('class'),
		numberOfEngines: integer('number_of_engines'),
		engineType: text('engine_type'),
		manufacturer: text('manufacturer'),
		model: text('model')
	},
	(table) => ({
		codeIdx: index('aircraft_code_index').on(table.code)
	})
);

export type RestrictionInsertModel = InferInsertModel<typeof restrictionsTable>;

export type AreaMetadata = InferSelectModel<typeof areaMetadataTable>;

export type Split = InferSelectModel<typeof splitsTable>;
export type SplitGroup = InferSelectModel<typeof splitGroupsTable>;
export type SplitGroupArea = InferSelectModel<typeof splitGroupAreasTable>;

export type Airline = InferSelectModel<typeof airlinesTable>;
