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

	// Group results by static element groups and their components
	const staticElements = Object.values(
		results.reduce((acc: Record<string, any>, row) => {
			const group = row.airspace_static_element_groups;

			if (!acc[group.id]) {
				acc[group.id] = {
					...group,
					components: []
				};
			}

			if (row.airspace_static_element_components) {
				acc[group.id].components.push(row.airspace_static_element_components);
			}

			return acc;
		}, {})
	);

	return { staticElements };
}
