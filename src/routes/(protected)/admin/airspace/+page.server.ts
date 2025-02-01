import {
	airspaceStaticElementGroupsTable,
	airspaceStaticElementComponentsTable
} from '$lib/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export async function load() {
	const results = await db
		.select()
		.from(airspaceStaticElementGroupsTable)
		.leftJoin(
			airspaceStaticElementComponentsTable,
			eq(airspaceStaticElementGroupsTable.id, airspaceStaticElementComponentsTable.groupId)
		);

	const groups = results.map((r) => r.airspace_static_element_groups);
	const components = results
		.filter((r) => r.airspace_static_element_components !== null)
		.map((r) => r.airspace_static_element_components);

	const staticElements = groups.map((g) => ({
		...g,
		components: components.filter((c) => c.groupId === g.id)
	}));

	return {
		staticElements
	};
}
