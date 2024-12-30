import { numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const restriction = pgTable('restrictions', {
	id: uuid('id').primaryKey().defaultRandom(),
	airport: text('airport'),
	route: text('route'),
	from: text('from'),
	to: text('to'),
	restriction: text('restriction'),
	notes: text('notes'),
	priority: numeric('priority').default('0'),
	validAt: timestamp('valid_at').defaultNow(),
	validUntil: timestamp('valid_until'),
	createdAt: timestamp('created_at').defaultNow()
});
