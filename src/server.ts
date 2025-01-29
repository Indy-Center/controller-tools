import { handler } from '../build/handler.js';
import express from 'express';
import type { Express } from 'express';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const app: Express = express();
const port: number = Number(process.env.PORT) || 3000;

async function start(): Promise<void> {
	// Run migrations
	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set');
	}

	console.log('Running database migrations...');
	const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
	const db: PostgresJsDatabase = drizzle(migrationClient);

	try {
		await migrate(db, { migrationsFolder: 'drizzle' });
		console.log('Migrations completed successfully');
	} catch (error) {
		console.error('Error running migrations:', error);
		process.exit(1);
	} finally {
		await migrationClient.end();
	}

	// Start server
	app.use(handler);

	app.listen(port, () => {
		console.log(`Server listening on port ${port}`);
	});
}

start().catch((error: Error) => {
	console.error('Failed to start server:', error);
	process.exit(1);
});
