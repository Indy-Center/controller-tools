import { db } from '$lib/server/db';
import {
	airspaceOverlayComponentsTable,
	airspaceOverlayGroupsTable,
	airspaceStaticElementComponentsTable,
	airspaceStaticElementGroupsTable,
	splitsTable
} from '$lib/db/schema';
import { eq, or, and } from 'drizzle-orm';

type StaticElementGroup = {
	id: string;
	name: string;
	components: {
		name: string;
		color: string;
		geojson: string;
	}[];
};

type OverlayGroups = {
	id: string;
	name: string;
	components: {
		name: string;
		color: string;
		geojson: string;
	};
};

export async function load({ locals }) {
	const splits = await db
		.select()
		.from(splitsTable)
		.where(or(eq(splitsTable.isPublished, true), locals.user && locals.user.isAdmin));

	const staticElementGroups = await loadStaticElementGroups(locals);
	const overlayGroups = await loadOverlayGroups(locals);

	return { splits, staticElementGroups, overlayGroups };
}

async function loadStaticElementGroups(locals: App.Locals): Promise<StaticElementGroup[]> {
	const staticElementsResults = await db
		.select()
		.from(airspaceStaticElementGroupsTable)
		.leftJoin(
			airspaceStaticElementComponentsTable,
			eq(airspaceStaticElementGroupsTable.id, airspaceStaticElementComponentsTable.groupId)
		)
		.where(
			or(
				eq(airspaceStaticElementGroupsTable.isPublished, true),
				locals.user && locals.user?.isAdmin === true
			)
		);

	// Group results by static element groups and their components
	return Object.values(
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
}

async function loadOverlayGroups(locals: App.Locals): Promise<OverlayGroups[]> {
	const overlayGroupsResult = await db
		.select()
		.from(airspaceOverlayGroupsTable)
		.leftJoin(
			airspaceOverlayComponentsTable,
			eq(airspaceOverlayGroupsTable.id, airspaceOverlayComponentsTable.groupId)
		)
		.where(
			or(
				eq(airspaceOverlayGroupsTable.isPublished, true),
				locals.user && locals.user?.isAdmin === true
			)
		);

	// Group results by static element groups and their components
	return Object.values(
		overlayGroupsResult.reduce((acc: Record<string, any>, row) => {
			const group = row.airspace_overlay_groups;

			if (!acc[group.id]) {
				acc[group.id] = {
					...group,
					components: []
				};
			}

			if (row.airspace_overlay_components) {
				acc[group.id].components.push(row.airspace_overlay_components);
			}

			return acc;
		}, {})
	);
}
