import { db } from '$lib/server/db';
import {
	airspaceStaticElementComponentsTable,
	airspaceStaticElementGroupsTable,
	splitsTable
} from '$lib/db/schema';
import { eq, or } from 'drizzle-orm';

type StaticElementGroup = {
	id: string;
	name: string;
	components: {
		name: string;
		color: string;
		geojson: string;
	}[];
};

export async function load({ locals }) {
	const splits = await db
		.select()
		.from(splitsTable)
		.where(or(eq(splitsTable.isPublished, true), locals.user && locals.user.isAdmin));

	const staticElementsResults = await db
		.select()
		.from(airspaceStaticElementGroupsTable)
		.leftJoin(
			airspaceStaticElementComponentsTable,
			eq(airspaceStaticElementGroupsTable.id, airspaceStaticElementComponentsTable.groupId)
		);

	// Group results by static element groups and their components
	const staticElementGroups: StaticElementGroup[] = Object.values(
		staticElementsResults.reduce((acc: Record<string, any>, row) => {
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

	return { splits, staticElementGroups };
}
