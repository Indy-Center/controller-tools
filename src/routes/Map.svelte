<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import { browser } from '$app/environment';
	import type { Map, GeoJSONOptions, LatLngExpression } from 'leaflet';
	import { getFlightCategory } from '$lib/helpers';
	import type { AirportsResponse } from '$lib/api';

	let { airports, metars }: { airports: AirportsResponse; metars: any[] } = $props();

	let L: typeof import('leaflet') | undefined;
	let map: Map | undefined;

	onMount(async () => {
		if (browser) {
			L = await import('leaflet');
			const centerPoint: LatLngExpression = [38.65, -84.62];
			map = L.map('map').setView(centerPoint, 7);

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

			await loadGeoJSON();

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
						`<strong>${a.arpt_name} (${a.arpt_id}):</strong><br><span style="color:${circleColor}">${airportMetar.metar}</span>`,
						{
							permanent: false, // Tooltip is shown on hover
							className: 'leaflet-tooltip-custom' // You can customize the tooltip appearance
						}
					);

					// Add the circle marker to the map
					circle.addTo(map!);
				}
			});
		}
	});

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

<div id="map" class="h-full w-full"></div>
