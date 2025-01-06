<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import { browser } from '$app/environment';
	import { type Map, type GeoJSONOptions, type LatLngExpression, type LayerGroup } from 'leaflet';
	import { getFlightCategory } from '$lib/helpers';
	import type { AirportsResponse, OverflightsResponse } from '$lib/api';
	import Airplane from 'virtual:icons/mdi/airplane?raw';
	import AirplaneIcon from 'virtual:icons/mdi/airplane';
	import WeatherCloudyClockIcon from 'virtual:icons/mdi/weather-cloudy-clock';

	let {
		airports,
		metars,
		planes
	}: { airports: AirportsResponse; metars: any[]; planes: OverflightsResponse } = $props();

	let L: typeof import('leaflet') | undefined;
	let map: Map | undefined;
	let airportLayer: LayerGroup | undefined;
	let planeLayer: LayerGroup | undefined;

	let settings = $state({
		showPlanes: true,
		showWeather: true
	});

	$effect(() => {
		if (metars || planes) {
			renderAirportLayer(settings.showWeather);
			renderPlaneLayer(settings.showPlanes);
		}
	});

	onMount(async () => {
		if (browser) {
			L = await import('leaflet');
			const centerPoint: LatLngExpression = [38.65, -84.62];
			map = L.map('map', { zoomSnap: 0.5, zoomControl: false }).setView(centerPoint, 7);

			// Light and dark map layers
			const lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© OpenStreetMap contributors'
			});

			const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
				attribution: '© CartoDB'
			});

			// Detect system theme preference using the media query
			const isDarkMode =
				window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

			// Set the map layer based on the system's color scheme
			if (isDarkMode) {
				darkLayer.addTo(map);
			} else {
				lightLayer.addTo(map);
			}

			// Listen for changes in the system theme and switch the map layer accordingly
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
				if (e.matches) {
					// Dark mode activated, switch to dark layer
					map!.removeLayer(lightLayer);
					darkLayer.addTo(map!);
				} else {
					// Light mode activated, switch to light layer
					map!.removeLayer(darkLayer);
					lightLayer.addTo(map!);
				}
			});

			renderPlaneLayer(true);
			renderAirportLayer(true);
			await loadGeoJSON();
		}
	});

	function renderPlaneLayer(showPlanes: boolean) {
		if (!L || !map) return;

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
				const icon = L.divIcon({
					html: iconHtml,
					className: 'plane-icon', // Custom CSS class for styling
					iconSize: [24, 24] // Adjust size to your needs
				});

				// Add the plane marker with the custom icon
				const marker = L.marker([p.lat, p.lon], { icon });

				// Bind a tooltip to the marker
				marker.bindTooltip(`<strong>${p.callsign} (${p.cid}):</strong><br>${p.route}`, {
					permanent: false, // Tooltip is shown on hover
					className: 'leaflet-tooltip-custom'
				});

				// Add the marker to the layer group
				marker.addTo(planeLayer!);
			});
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
</div>

<!-- Control panel overlay -->
<div
	class="absolute right-4 top-4 z-10 flex w-auto items-center justify-center gap-x-2 rounded-2xl bg-white bg-opacity-80 p-2 shadow-lg dark:bg-gray-800 dark:bg-opacity-90"
>
	<button
		type="button"
		id="airplane-toggle"
		class="rounded-lg px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none"
		class:bg-zinc-700={settings.showPlanes}
		class:bg-zinc-300={!settings.showPlanes}
		class:text-white={settings.showPlanes}
		class:text-zinc-700={!settings.showPlanes}
		class:dark:text-zinc-200={settings.showPlanes}
		class:hover:bg-zinc-600={settings.showPlanes}
		class:hover:bg-zinc-400={!settings.showPlanes}
		onclick={() => {
			settings.showPlanes = !settings.showPlanes;
		}}
	>
		<AirplaneIcon />
	</button>

	<button
		type="button"
		id="weather-toggle"
		class="rounded-lg px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none"
		class:bg-zinc-700={settings.showWeather}
		class:bg-zinc-300={!settings.showWeather}
		class:text-white={settings.showWeather}
		class:text-zinc-700={!settings.showWeather}
		class:dark:text-zinc-200={settings.showWeather}
		class:hover:bg-zinc-600={settings.showWeather}
		class:hover:bg-zinc-400={!settings.showWeather}
		onclick={() => {
			settings.showWeather = !settings.showWeather;
		}}
	>
		<WeatherCloudyClockIcon />
	</button>
</div>
