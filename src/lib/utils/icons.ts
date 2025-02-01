import type { SvelteComponent } from 'svelte';

// Cache for loaded icon paths
const iconPathCache: Record<string, string> = {};

/**
 * Converts a kebab-case icon name to the MDI camelCase format
 * e.g., 'vector-line' -> 'mdiVectorLine'
 */
function formatIconName(iconName: string): string {
	return (
		'mdi' +
		iconName
			.split('-')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join('')
	);
}

/**
 * Loads an MDI icon path by name
 * @param iconName The kebab-case name of the icon (e.g., 'vector-line')
 * @returns The SVG path for the icon
 */
export async function loadMdiIconPath(iconName: string): Promise<string | undefined> {
	if (!iconName) return undefined;
	if (iconPathCache[iconName]) return iconPathCache[iconName];

	try {
		const formattedName = formatIconName(iconName);
		const module = await import('@mdi/js');
		// Exclude the default export and only use string values
		const paths = Object.fromEntries(
			Object.entries(module).filter(
				([key, value]) => key !== 'default' && typeof value === 'string'
			)
		);
		const path = paths[formattedName];
		if (path) {
			iconPathCache[iconName] = path;
			return path;
		}
	} catch (error) {
		console.error(`Failed to load icon: ${iconName}`, error);
	}
	return undefined;
}

/**
 * Loads multiple MDI icon paths by name
 * @param iconNames Array of kebab-case icon names
 * @returns Record of icon names to their SVG paths
 */
export async function loadMdiIconPaths(iconNames: string[]): Promise<Record<string, string>> {
	const paths: Record<string, string> = {};
	await Promise.all(
		iconNames.map(async (name) => {
			const path = await loadMdiIconPath(name);
			if (path) paths[name] = path;
		})
	);
	return paths;
}
