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
					`
					<div class="flex flex-col gap-2 min-w-[200px]">
						<div class="flex items-center justify-between">
							<div class="font-medium text-zinc-900 dark:text-zinc-100">${p.callsign}</div>
							<div class="text-zinc-500 dark:text-zinc-400 text-sm">${p.cid}</div>
						</div>
						<div class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
							<span class="font-medium">${p.dep}</span>
							<span class="text-xs">→</span>
							<span class="font-medium">${p.arr}</span>
						</div>
						<div class="text-xs text-zinc-500 dark:text-zinc-400 font-mono">${p.route}</div>
					</div>
					`,
					{
						permanent: false,
						className: 'modern-tooltip'
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
					acc[prefix] = acc[prefix] || { badges: [], controllers: [] };

					if (c.position.includes('GND') && !acc[prefix].badges.includes('G')) {
						acc[prefix].badges.push('G');
						acc[prefix].controllers.push({
							type: 'G',
							name: `${c.controller.first_name} ${c.controller.last_name}`,
							position: c.position,
							frequency: c.frequency
						});
					}
					if (c.position.includes('TWR') && !acc[prefix].badges.includes('T')) {
						acc[prefix].badges.push('T');
						acc[prefix].controllers.push({
							type: 'T',
							name: `${c.controller.first_name} ${c.controller.last_name}`,
							position: c.position,
							frequency: c.frequency
						});
					}
					if (c.position.includes('DEL') && !acc[prefix].badges.includes('D')) {
						acc[prefix].badges.push('D');
						acc[prefix].controllers.push({
							type: 'D',
							name: `${c.controller.first_name} ${c.controller.last_name}`,
							position: c.position,
							frequency: c.frequency
						});
					}
					return acc;
				},
				{} as Record<
					string,
					{
						badges: string[];
						controllers: Array<{ type: string; name: string; position: string; frequency: string }>;
					}
				>
			);

		Object.entries(cabControllers).forEach(([prefix, data]) => {
			const airport = airports.find((a) => a.arpt_id === prefix);
			if (airport) {
				const iconsHtml = data.badges
					.map((type) => {
						const badgeColor =
							{
								T: 'bg-blue-500/90 hover:bg-blue-500 dark:bg-blue-500/80 dark:hover:bg-blue-500/90',
								G: 'bg-emerald-500/90 hover:bg-emerald-500 dark:bg-emerald-500/80 dark:hover:bg-emerald-500/90',
								D: 'bg-purple-500/90 hover:bg-purple-500 dark:bg-purple-500/80 dark:hover:bg-purple-500/90'
							}[type] || 'bg-zinc-500';
						return `<div class="controller-badge ${badgeColor}">${type}</div>`;
					})
					.join('');

				const divIcon = L!.divIcon({
					html: `<div class="controller-marker">${iconsHtml}</div>`,
					className: 'leaflet-div-icon-custom',
					iconAnchor: [30, 0]
				});

				const marker = L!.marker([airport.latitude, airport.longitude], { icon: divIcon });

				// Create tooltip content with controller info
				const tooltipContent = data.controllers
					.map(
						(c) => `
						<div class="flex items-center gap-4 min-w-[280px]">
							<div class="flex-1">
								<div class="font-medium text-zinc-900 dark:text-zinc-100">${c.position}</div>
								<div class="text-zinc-500 dark:text-zinc-400 text-sm">${c.name}</div>
							</div>
							<div class="text-zinc-500 dark:text-zinc-400 text-sm font-mono">${c.frequency}</div>
						</div>
					`
					)
					.join('<div class="my-2 h-px bg-zinc-200 dark:bg-zinc-700"></div>');

				marker.bindTooltip(tooltipContent, {
					permanent: false,
					className: 'controller-tooltip',
					direction: 'top',
					offset: [0, -10]
				});

				// Add global styles for the tooltip if not already present
				if (!document.getElementById('controller-tooltip-styles')) {
					const style = document.createElement('style');
					style.id = 'controller-tooltip-styles';
					style.textContent = `
						.leaflet-div-icon-custom {
							background: transparent !important;
							border: none !important;
						}
						.controller-tooltip,
						.modern-tooltip {
							background-color: rgb(255 255 255 / 0.95) !important;
							backdrop-filter: blur(8px);
							border: none !important;
							border-radius: 0.5rem !important;
							box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
							padding: 0.75rem !important;
							white-space: normal !important;
						}
						.dark .controller-tooltip,
						.dark .modern-tooltip {
							background-color: rgb(39 39 42 / 0.95) !important; /* zinc-800 */
							box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3) !important;
							border: 1px solid rgb(63 63 70 / 0.5) !important; /* zinc-700 */
						}
						.controller-badge {
							display: inline-flex;
							align-items: center;
							justify-content: center;
							width: 22px;
							height: 22px;
							border-radius: 6px;
							color: white;
							font-weight: 600;
							font-size: 13px;
							transition: all 0.2s;
						}
						.controller-marker {
							display: inline-flex;
							gap: 2px;
							padding: 1px;
							background: transparent !important;
						}
						.controller-tooltip .leaflet-tooltip-tip,
						.modern-tooltip .leaflet-tooltip-tip {
							display: none;
						}
					`;
					document.head.appendChild(style);
				}

				controllerLayer!.addLayer(marker);
			}
		});
	}

	type Area = {
		id: string;
		short: string;
		color?: string;
		geojson: any; // GeoJSON type
	};

	let areas: Area[] = [];

	async function renderTracons() {
		// Extract the TRACON prefixes from controllers' positions
		const traconPrefixes = controllers
			.filter((c) => c.position.includes('_APP'))
			.map((controller) => controller.position.split('_')[0]);

		if (traconPrefixes.length === 0) return;

		try {
			// Fetch areas only once
			if (areas.length === 0) {
				const response = await fetch('/api/areas');
				if (!response.ok) throw new Error('Failed to fetch area data');
				areas = await response.json();
			}

			// Keep track of which areas we've already drawn
			const drawnAreas = new Set<string>();

			// Map facility prefixes to their ATCT short IDs
			const facilityToShort: Record<string, string> = {
				CVG: 'CVG ATCT',
				CMH: 'CMH ATCT'
			};

			// Draw areas for each TRACON prefix
			traconPrefixes.forEach((prefix) => {
				const shortId = facilityToShort[prefix];
				if (!shortId || drawnAreas.has(shortId)) return;

				const area = areas.find((a) => a.short === shortId);
				if (!area) return;

				const geoJsonLayer = L!.geoJSON(area.geojson, {
					style: {
						fillColor: area.color || '#FF1744',
						fillOpacity: 0.2,
						color: area.color || '#FF1744',
						weight: 2,
						opacity: 0.8
					}
				});

				// Add the area to the layer
				controllerLayer!.addLayer(geoJsonLayer);
				drawnAreas.add(shortId);

				// Calculate a position for the label near the border
				const bounds = geoJsonLayer.getBounds();
				const labelPosition = L!.latLng(
					bounds.getNorth() - (bounds.getNorth() - bounds.getSouth()) * 0.1, // Move closer to the top
					bounds.getEast() - (bounds.getEast() - bounds.getWest()) * 0.3 // Move more towards the center
				);

				// Create a label with a colored background matching the border
				const labelIcon = L!.divIcon({
					html: `
						<div class="tracon-label" style="background-color: ${area.color || '#FF1744'}">
							<div class="tracon-label-text">${prefix}</div>
						</div>
					`,
					className: 'tracon-label-container',
					iconSize: [60, 26], // More compact size
					iconAnchor: [30, 13]
				});

				// Add the label marker
				const labelMarker = L!.marker(labelPosition, {
					icon: labelIcon,
					interactive: false
				});
				controllerLayer!.addLayer(labelMarker);
			});
		} catch (error) {
			console.error('Error rendering TRACON areas:', error);
		}
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
					const categoryColors = {
						VFR: 'rgb(34 197 94)', // emerald-500
						MVFR: 'rgb(59 130 246)', // blue-500
						IFR: 'rgb(239 68 68)', // red-500
						LIFR: 'rgb(168 85 247)' // purple-500
					};
					const circleColor = categoryColors[flightCategory] || 'gray';

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
						`
						<div class="flex flex-col gap-2 min-w-[240px]">
							<div class="flex items-center justify-between">
								<div class="font-medium text-zinc-900 dark:text-zinc-100">
									${a.arpt_name} (${a.arpt_id})
								</div>
								<div class="text-sm font-medium" style="color: ${circleColor}">
									${flightCategory}
								</div>
							</div>
							<div class="text-xs text-zinc-500 dark:text-zinc-400 font-mono break-all">
								${airportMetar.metar}
							</div>
						</div>
						`,
						{
							permanent: false,
							className: 'modern-tooltip'
						}
					);

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
	:global(.leaflet-div-icon-custom) {
		background: transparent !important;
		border: none !important;
	}

	:global(.controller-tooltip),
	:global(.modern-tooltip) {
		background-color: rgb(255 255 255 / 0.95) !important;
		backdrop-filter: blur(8px);
		border: none !important;
		border-radius: 0.5rem !important;
		box-shadow:
			0 4px 6px -1px rgb(0 0 0 / 0.1),
			0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
		padding: 0.75rem !important;
		white-space: normal !important;
	}

	:global(.dark .controller-tooltip),
	:global(.dark .modern-tooltip) {
		background-color: rgb(39 39 42 / 0.95) !important;
		box-shadow:
			0 4px 6px -1px rgb(0 0 0 / 0.3),
			0 2px 4px -2px rgb(0 0 0 / 0.3) !important;
		border: 1px solid rgb(63 63 70 / 0.5) !important;
	}

	:global(.controller-badge) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 6px;
		color: white;
		font-weight: 600;
		font-size: 13px;
		transition: all 0.15s;
		line-height: 1;
		padding: 4px;
		box-sizing: border-box;
		box-shadow:
			0 1px 3px 0 rgb(0 0 0 / 0.1),
			0 1px 2px -1px rgb(0 0 0 / 0.1);
		backdrop-filter: blur(4px);
	}

	:global(.controller-marker) {
		display: flex;
		gap: 3px;
		padding: 1px;
		background: transparent !important;
		align-items: center;
		justify-content: flex-start;
	}

	:global(.controller-tooltip .leaflet-tooltip-tip),
	:global(.modern-tooltip .leaflet-tooltip-tip) {
		display: none;
	}

	:global(.tracon-label-container) {
		background: transparent !important;
		border: none !important;
	}

	:global(.tracon-label) {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem 0.75rem;
		border-radius: 3px;
		box-shadow:
			0 1px 3px 0 rgb(0 0 0 / 0.1),
			0 1px 2px -1px rgb(0 0 0 / 0.1);
		opacity: 0.95;
		min-width: 50px;
		height: 26px;
		box-sizing: border-box;
		backdrop-filter: blur(4px);
	}

	:global(.tracon-label-text) {
		font-size: 12px;
		font-weight: 600;
		color: white;
		white-space: nowrap;
		letter-spacing: 0.25px;
		line-height: 1;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.1);
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
