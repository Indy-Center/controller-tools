import fs from 'fs/promises';
import path from 'path';

async function splitGeoJson(inputFile: string, outputDir: string) {
	// Read and parse the input file
	const data = JSON.parse(await fs.readFile(inputFile, 'utf8'));

	// Group features by id
	const groups = new Map<string, any[]>();

	for (const feature of data.features) {
		console.log('Feature properties:', feature.properties);

		// Check if properties exist and has an ID
		if (!feature.properties) {
			console.warn('Feature missing properties:', feature);
			continue;
		}

		const id = feature.properties.ID || feature.properties.Id || feature.properties.id;
		if (!id) {
			console.warn('Feature missing ID:', feature.properties);
			continue;
		}

		if (!groups.has(id)) {
			groups.set(id, []);
		}
		groups.get(id)?.push(feature);
	}

	// Create output directory if it doesn't exist
	await fs.mkdir(outputDir, { recursive: true });

	// Write each group to a separate file
	for (const [id, features] of groups) {
		const output = {
			type: 'FeatureCollection',
			name: features[0].properties.name || features[0].properties.NAME || id,
			crs: data.crs,
			features: features
		};

		const filename = id.toLowerCase() + '.geojson';
		await fs.writeFile(path.join(outputDir, filename), JSON.stringify(output, null, 2));
		console.log(`Created ${filename} (${output.name})`);
	}
}

// Usage
splitGeoJson('static/data/tracon_boundaries.geojson', 'static/data/tracons');
