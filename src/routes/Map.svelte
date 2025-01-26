<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import { browser } from '$app/environment';
	import { type Map, type GeoJSONOptions, type LatLngExpression, type LayerGroup } from 'leaflet';
	import { getFlightCategory } from '$lib/helpers';
	import type { AirportsResponse, ControllersResponse, OverflightsResponse } from '$lib/api';
	import Airplane from 'virtual:icons/mdi/airplane?raw';
	import AirplaneIcon from 'virtual:icons/mdi/airplane';
	import WeatherCloudyClockIcon from 'virtual:icons/mdi/weather-cloudy-clock';
	import TransmissionTowerIcon from 'virtual:icons/mdi/transmission-tower';
	import MapMenu from '$lib/components/map/MapMenu.svelte';
	let {
		airports,
		metars,
		planes,
		controllers
	}: {
		airports: AirportsResponse;
		metars: any[];
		planes: OverflightsResponse;
		controllers: ControllersResponse;
	} = $props();

	let L: typeof import('leaflet') | undefined;
	let map: Map | undefined;
	let airportLayer: LayerGroup | undefined;
	let planeLayer: LayerGroup | undefined;
	let controllerLayer: LayerGroup | undefined;

	let settings = $state({
		showPlanes: true,
		showWeather: true,
		showControllers: true
	});

	let menuActions = $derived([
		{
			icon: AirplaneIcon,
			active: settings.showPlanes,
			onClick: () => {
				settings.showPlanes = !settings.showPlanes;
			}
		},
		{
			icon: WeatherCloudyClockIcon,
			active: settings.showWeather,
			onClick: () => {
				settings.showWeather = !settings.showWeather;
			}
		},
		{
			icon: TransmissionTowerIcon,
			active: settings.showControllers,
			onClick: () => {
				settings.showControllers = !settings.showControllers;
			}
		}
	]);

	$effect(() => {
		if (metars || planes || controllers) {
			renderAirportLayer(settings.showWeather);
			renderPlaneLayer(settings.showPlanes);
			renderControllerLayer(settings.showControllers);
		}
	});

	function isDarkMode() {
		return document.documentElement.classList.contains('dark');
	}

	function initializeTileLayers() {
		const lightLayer = L!.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
		});

		const darkLayer = L!.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
		});

		// Set initial layer based on current theme
		const tileLayer = isDarkMode() ? darkLayer : lightLayer;
		tileLayer.addTo(map!);

		// Watch for theme changes
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === 'class' && map) {
					map.removeLayer(isDarkMode() ? lightLayer : darkLayer);
					(isDarkMode() ? darkLayer : lightLayer).addTo(map);
				}
			});
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});
	}

	onMount(async () => {
		if (browser) {
			L = await import('leaflet');
			const centerPoint: LatLngExpression = [38.65, -84.62];
			map = L.map('map', { zoomSnap: 0.5, zoomControl: false }).setView(centerPoint, 7);

			initializeTileLayers();
			renderPlaneLayer(true);
			renderAirportLayer(true);
			await loadGeoJSON();
			await renderControllerLayer(true);
		}
	});

	function renderPlaneLayer(showPlanes: boolean) {
		if (!L || !map || !planes) return;

		if (!planeLayer) {
			planeLayer = L.layerGroup();
			planeLayer.addTo(map);
		}

		planeLayer.clearLayers();

		if (showPlanes) {
			planes.forEach((p) => {
				// Create a custom div element with the SVG icon
				const iconHtml = `
				<div style="transform: rotate(${p.hdg - 45}deg);">
					${Airplane}
				</div>
			`;

				// Create a Leaflet DivIcon with the custom HTML
				const icon = L!.divIcon({
					html: iconHtml,
					className: 'plane-icon', // Custom CSS class for styling
					iconSize: [24, 24] // Adjust size to your needs
				});

				// Add the plane marker with the custom icon
				const marker = L!.marker([p.lat, p.lon], { icon });

				// Bind a tooltip to the marker
				marker.bindTooltip(
					`<strong>${p.callsign} (${p.cid}):</strong><br>${p.dep}-${p.arr}<br>${p.route}`,
					{
						permanent: false, // Tooltip is shown on hover
						className: 'leaflet-tooltip-custom'
					}
				);

				// Add the marker to the layer group
				marker.addTo(planeLayer!);
			});
		}
	}

	async function renderControllerLayer(showControllers: boolean) {
		if (!L || !map) return;

		if (!controllerLayer) {
			controllerLayer = L.layerGroup();
			controllerLayer.addTo(map);
		}

		controllerLayer.clearLayers();

		if (showControllers) {
			renderCabControllers();
			await renderTracons();
		}
	}

	function renderCabControllers() {
		const cabControllers = controllers
			.filter(
				(c) =>
					c.position.includes('GND') || c.position.includes('TWR') || c.position.includes('DEL')
			)
			.reduce(
				(acc, c) => {
					const prefix = c.position.split('_')[0];
					acc[prefix] = acc[prefix] || [];
					if (c.position.includes('GND') && !acc[prefix].includes('G')) {
						acc[prefix].push('G');
					}
					if (c.position.includes('TWR') && !acc[prefix].includes('T')) {
						acc[prefix].push('T');
					}

					if (c.position.includes('DEL') && !acc[prefix].includes('D')) {
						acc[prefix].push('D');
					}
					return acc;
				},
				{} as Record<string, string[]>
			);

		Object.entries(cabControllers).forEach(([prefix, types]) => {
			const airport = airports.find((a) => a.arpt_id === prefix);
			if (airport) {
				const iconsHtml = types
					.map((type) => `<div class="controller-badge">${type}</div>`)
					.join('');

				const divIcon = L!.divIcon({
					html: `<div class="controller-marker">${iconsHtml}</div>`,
					className: '', // Use an empty class to avoid Leaflet's default styling
					iconAnchor: [10, -10] // Shift icon down (positive y) or up (negative y)
				});

				const marker = L!.marker([airport.latitude, airport.longitude], { icon: divIcon });

				controllerLayer!.addLayer(marker);
			}
		});
	}

	async function renderTracons() {
		// Fetch the TRACON boundaries GeoJSON
		const response = await fetch('data/tracon_boundaries.geojson');
		const geojson = await response.json();

		// Extract the TRACON prefixes from controllers' positions
		const traconPrefixes = new Set(
			controllers
				.filter((c) => c.position.includes('_APP'))
				.map((controller) => controller.position.split('_')[0])
		);

		// Define GeoJSON options with filtering logic
		const geoJsonOptions: GeoJSONOptions = {
			filter: (feature) => {
				// Ensure properties exist
				if (!feature.properties || !feature.properties.prefix) {
					return false;
				}

				// Handle both array and string cases for `prefix`
				const prefixes = Array.isArray(feature.properties.prefix)
					? feature.properties.prefix
					: [feature.properties.prefix];

				// Check if any prefix matches a TRACON prefix
				return prefixes.some((prefix: string) => traconPrefixes.has(prefix));
			},
			style: {
				color: 'orange',
				weight: 2,
				fillOpacity: 0.1
			}
		};

		// Add or remove the layer based on `showControllers`
		controllerLayer!.addLayer(L!.geoJSON(geojson, geoJsonOptions));
	}

	function renderAirportLayer(showWeather: boolean) {
		if (!L || !map) return;

		if (!airportLayer) {
			airportLayer = L.layerGroup();
			airportLayer.addTo(map);
		}

		airportLayer.clearLayers();

		if (showWeather) {
			airports.forEach((a) => {
				const airportMetar = metars.find((m) => m.id === a.icao_id);

				if (airportMetar) {
					const flightCategory = getFlightCategory(airportMetar.metar);
					// Set circle color based on flight category
					let circleColor = '';
					switch (flightCategory) {
						case 'VFR':
							circleColor = 'green';
							break;
						case 'MVFR':
							circleColor = 'blue';
							break;
						case 'IFR':
							circleColor = 'red';
							break;
						case 'LIFR':
							circleColor = 'magenta';
							break;
					}

					// Create a circle marker with the color based on flight category
					const circle = L!.circleMarker([a.latitude, a.longitude], {
						radius: 3,
						color: circleColor,
						fillColor: circleColor,
						fillOpacity: 1,
						weight: 2
					});

					// Bind a tooltip to the circle marker that shows the METAR
					circle.bindTooltip(
						`<strong>${a.arpt_name} (${a.arpt_id}) [${flightCategory}]:</strong><br><span style="color:${circleColor}">${airportMetar.metar}</span>`,
						{
							permanent: false, // Tooltip is shown on hover
							className: 'leaflet-tooltip-custom' // You can customize the tooltip appearance
						}
					);

					// Add the circle marker to the map
					circle.addTo(airportLayer!);
				}
			});
		}
	}

	async function loadGeoJSON(): Promise<void> {
		if (!L || !map) return;

		const response = await fetch('data/airspace_boundary.geojson');
		const geojson = await response.json();

		const geoJsonOptions: GeoJSONOptions = {
			filter: (feature) =>
				feature.properties &&
				feature.properties.IDENT === 'ZID' &&
				feature.properties.LOCAL_TYPE === 'ARTCC_H',
			style: {
				color: 'gray',
				weight: 2,
				fillOpacity: 0.1
			},
			onEachFeature: (feature, layer) => {
				if (feature.properties && feature.properties.name) {
					layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
				}
			}
		};

		L.geoJSON(geojson, geoJsonOptions).addTo(map);
	}
</script>

<div class="relative z-0 h-full w-full">
	<!-- Map container -->
	<div id="map" class="h-full w-full"></div>
	<div class="absolute right-4 top-4 z-[450]">
		<MapMenu actions={menuActions} />
	</div>
</div>

<style lang="postcss">
	:global(.controller-marker) {
		display: flex;
		gap: 2px; /* Spacing between squares */
		align-items: center;
		justify-content: flex-start; /* Align items horizontally */
	}

	:global(.controller-badge) {
		/* Same as width for a perfect square */
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #2d3748; /* Dark background */
		color: white;
		border-radius: 3px; /* Slightly rounded corners */
		font-size: 12px; /* Text size */
		font-weight: bold; /* Bold text */
		box-sizing: border-box; /* Include borders in size calculation */
		line-height: 1; /* Ensures text doesn't stretch the height */
		padding: 4px; /* No additional padding */
	}

	:global(.leaflet-control-attribution) {
		@apply text-xs text-content-secondary;
		background: transparent !important;
	}

	:global(.leaflet-control-attribution a) {
		@apply text-content-secondary hover:text-content;
	}

	:global(:is(.dark) .leaflet-control-attribution) {
		@apply text-content-dark-secondary;
	}

	:global(:is(.dark) .leaflet-control-attribution a) {
		@apply text-content-dark-secondary hover:text-content-dark;
	}
</style>
