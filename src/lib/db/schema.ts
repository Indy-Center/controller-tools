import { numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';

export const restriction = pgTable('restrictions', {
	id: uuid('id').primaryKey().defaultRandom(),
	airport: text('airport').notNull(),
	route: text('route').notNull(),
	from: text('from'),
	to: text('to'),
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
	category: text('category').notNull()
});

export type Restriction = InferSelectModel<typeof restriction> & {
	from: AreaMetadata;
	to: AreaMetadata;
};
export type AreaMetadata = InferSelectModel<typeof areaMetadata>;
