<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import { browser } from '$app/environment';
	import type { LayerGroup, Map as LeafletMap } from 'leaflet';
	import * as turf from '@turf/turf';
	import RadioTower from 'virtual:icons/mdi/radio-tower';
	import VectorLine from 'virtual:icons/mdi/vector-line';
	import ChevronDoubleUp from 'virtual:icons/mdi/chevron-double-up';
	import ChevronDoubleDown from 'virtual:icons/mdi/chevron-double-down';
	import Layers from 'virtual:icons/mdi/layers';
	import { useSessionStorage } from '$lib/sessionStore.svelte';

	let { areas = [] } = $props();

	let L: typeof import('leaflet') | undefined;
	let map: LeafletMap | undefined;

	let highSectorLayers: LayerGroup | undefined;
	let lowSectorLayers: LayerGroup | undefined;
	let highAirwayLines: LayerGroup | undefined;
	let highAirwaySymbols: LayerGroup | undefined;
	let lowAirwayLines: LayerGroup | undefined;
	let lowAirwaySymbols: LayerGroup | undefined;
	let navaidLayers: LayerGroup | undefined;

	// Initialize settings with session storage
	let mapSettings = useSessionStorage('mapSettings', {
		showTiles: true,
		showHigh: true,
		showLow: false,
		showLines: true,
		showNavaids: true
	});

	// Create a reactive settings object that updates storage
	let settings = $state({
		get showTiles() {
			return $mapSettings.showTiles;
		},
		set showTiles(value) {
			$mapSettings.showTiles = value;
		},
		get showHigh() {
			return $mapSettings.showHigh;
		},
		set showHigh(value) {
			$mapSettings.showHigh = value;
		},
		get showLow() {
			return $mapSettings.showLow;
		},
		set showLow(value) {
			$mapSettings.showLow = value;
		},
		get showLines() {
			return $mapSettings.showLines;
		},
		set showLines(value) {
			$mapSettings.showLines = value;
		},
		get showNavaids() {
			return $mapSettings.showNavaids;
		},
		set showNavaids(value) {
			$mapSettings.showNavaids = value;
		}
	});

	let tileLayer: L.TileLayer | undefined;

	const highSectors = [
		'APE 87',
		'BKW 86',
		'CRW 85',
		'DAY 88',
		'FLM 83',
		'LOU 82',
		'MAD 66',
		'PXV 81',
		'RBL 84',
		'RSH 75',
		'UNI 77'
	];

	const lowSectors = [
		'ABB 18',
		'AZQ 25',
		'CMH 30',
		'CVG 22',
		'EVV 17',
		'EWO 19',
		'HUF 35',
		'LEX 20',
		'LOZ 21',
		'LTL 31',
		'MIE 33',
		'PIK 69',
		'PKB 24',
		'RIV 26',
		'ROD 32',
		'SHB 34'
	];

	// Store GeoJSON data
	let highSectorData: { [key: string]: any } = {};
	let lowSectorData: { [key: string]: any } = {};
	let highAirwayLinesData: any;
	let highAirwaySymbolsData: any;
	let lowAirwayLinesData: any;
	let lowAirwaySymbolsData: any;
	let navaidData: any;

	// Prefetch all GeoJSON data
	async function prefetchData() {
		// Fetch sector data
		await Promise.all([
			...highSectors.map(async (sector) => {
				const response = await fetch(`/data/sectors/high/${sector}.geojson`);
				highSectorData[sector] = await response.json();
			}),
			...lowSectors.map(async (sector) => {
				const response = await fetch(`/data/sectors/low/${sector}.geojson`);
				lowSectorData[sector] = await response.json();
			})
		]);

		// Fetch airways and navaids
		[
			highAirwayLinesData,
			highAirwaySymbolsData,
			lowAirwayLinesData,
			lowAirwaySymbolsData,
			navaidData
		] = await Promise.all([
			fetch('/data/map/High Airway Lines.geojson').then((r) => r.json()),
			fetch('/data/map/High Airway Symbols.geojson').then((r) => r.json()),
			fetch('/data/map/Low Airway Lines.geojson').then((r) => r.json()),
			fetch('/data/map/Low Airway Symbols.geojson').then((r) => r.json()),
			fetch('/data/map/Filter 4 - Navaids.geojson').then((r) => r.json())
		]);
	}

	function isDarkMode() {
		return document.documentElement.classList.contains('dark');
	}

	function getColors() {
		return {
			high: '#FF80AB', // Pink for high sectors
			low: '#90CAF9', // Light blue for low sectors
			navaid: '#FF8A80' // Coral/red for navaids
		};
	}

	// Map initialization
	onMount(async () => {
		if (browser) {
			L = await import('leaflet');
			const centerPoint = [38.65, -84.62] as [number, number];
			map = L.map('map', {
				zoomControl: false,
				zoomSnap: 0.25,
				minZoom: 5,
				maxZoom: 11,
				maxBounds: [
					[34.0, -90.0],
					[43.0, -79.0]
				],
				maxBoundsViscosity: 1.0
			}).setView(centerPoint, 7.3);

			// Create both tile layers
			const lightTiles = L.tileLayer(
				'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
				{
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
					subdomains: 'abcd',
					maxZoom: 11,
					minZoom: 7
				}
			);

			const darkTiles = L.tileLayer(
				'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
				{
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
					subdomains: 'abcd',
					maxZoom: 11,
					minZoom: 7
				}
			);

			// Set initial tile layer based on theme
			tileLayer = isDarkMode() ? darkTiles : lightTiles;
			if (settings.showTiles) {
				tileLayer.addTo(map);
			}

			// Create layer groups
			highSectorLayers = L.layerGroup().addTo(map);
			lowSectorLayers = L.layerGroup().addTo(map);
			highAirwayLines = L.layerGroup().addTo(map);
			highAirwaySymbols = L.layerGroup().addTo(map);
			lowAirwayLines = L.layerGroup().addTo(map);
			lowAirwaySymbols = L.layerGroup().addTo(map);
			navaidLayers = L.layerGroup().addTo(map);

			// Watch for theme changes
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.attributeName === 'class' && map && settings.showTiles) {
						map.removeLayer(tileLayer!);
						tileLayer = isDarkMode() ? darkTiles : lightTiles;
						tileLayer.addTo(map);
					}
				});
			});

			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['class']
			});

			// Prefetch data before initial render
			await prefetchData();

			// Initial render based on settings
			if (settings.showHigh) {
				renderHighSectors(true);
				if (settings.showLines) {
					renderHighAirways(true);
				}
			} else if (settings.showLow) {
				renderLowSectors(true);
				if (settings.showLines) {
					renderLowAirways(true);
				}
			}

			if (settings.showNavaids) {
				renderNavaids(true);
			}
		}
	});

	// Helper functions
	function createDarkerColor(color: string): string {
		return color.replace(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i, (_, r, g, b) => {
			const darken = (hex: string) =>
				Math.max(0, parseInt(hex, 16) - 40)
					.toString(16)
					.padStart(2, '0');
			return `#${darken(r)}${darken(g)}${darken(b)}`;
		});
	}

	function createLabel(sector: string, color: string) {
		const darkerColor = createDarkerColor(color);
		return L!.divIcon({
			className: 'sector-label',
			html: `<span style="color: ${darkerColor}; font-weight: 700; font-size: 14px;">
				${sector}</span>`,
			iconAnchor: [25, 12],
			iconSize: [50, 24]
		});
	}

	async function calculateCenterPoint(geojsonData: any) {
		try {
			const centerOfMass = turf.centerOfMass(geojsonData);
			return L!.latLng(centerOfMass.geometry.coordinates[1], centerOfMass.geometry.coordinates[0]);
		} catch (error) {
			try {
				const center = turf.center(geojsonData);
				return L!.latLng(center.geometry.coordinates[1], center.geometry.coordinates[0]);
			} catch (error) {
				const bounds = L!.geoJSON(geojsonData).getBounds();
				return bounds.getCenter();
			}
		}
	}

	// Sector rendering functions
	async function renderSectorLayer(
		sectors: string[],
		layerGroup: LayerGroup | undefined,
		type: 'high' | 'low',
		show: boolean
	): Promise<void> {
		if (!L || !map || !layerGroup) return;

		layerGroup.clearLayers();

		if (!show) return;

		const colors = getColors();
		const color = type === 'high' ? colors.high : colors.low;
		const sectorData = type === 'high' ? highSectorData : lowSectorData;

		for (const sector of sectors) {
			const geojsonData = sectorData[sector];
			if (!geojsonData) continue;

			const centerPoint = await calculateCenterPoint(geojsonData);

			L.geoJSON(geojsonData, {
				style: {
					color: color,
					fillOpacity: isDarkMode() ? 0.3 : 0.2,
					weight: 2
				}
			}).addTo(layerGroup);

			if (centerPoint) {
				const label = createLabel(sector, color);
				L.marker(centerPoint, { icon: label, interactive: false }).addTo(layerGroup);
			}
		}
	}

	function clearLayers() {
		highSectorLayers?.clearLayers();
		lowSectorLayers?.clearLayers();
		highAirwayLines?.clearLayers();
		highAirwaySymbols?.clearLayers();
		lowAirwayLines?.clearLayers();
		lowAirwaySymbols?.clearLayers();
		navaidLayers?.clearLayers();
	}

	async function renderHighSectors(showHigh: boolean) {
		clearLayers();
		await renderSectorLayer(highSectors, highSectorLayers, 'high', showHigh);
	}

	async function renderLowSectors(showLow: boolean) {
		clearLayers();
		await renderSectorLayer(lowSectors, lowSectorLayers, 'low', showLow);
	}

	async function renderHighAirways(show: boolean): Promise<void> {
		if (
			!L ||
			!map ||
			!highAirwayLines ||
			!highAirwaySymbols ||
			!highAirwayLinesData ||
			!highAirwaySymbolsData
		)
			return;

		highAirwayLines.clearLayers();
		highAirwaySymbols.clearLayers();

		if (!show) return;

		const colors = getColors();

		L.geoJSON(highAirwayLinesData, {
			style: {
				color: colors.high,
				weight: 1,
				opacity: 0.8
			}
		}).addTo(highAirwayLines);

		L.geoJSON(highAirwaySymbolsData, {
			pointToLayer: (feature, latlng) => {
				return L.circle(latlng, {
					radius: 500,
					color: colors.high,
					weight: 1,
					fill: true,
					fillColor: colors.high,
					fillOpacity: 0.5
				});
			}
		}).addTo(highAirwaySymbols);
	}

	async function renderLowAirways(show: boolean): Promise<void> {
		if (
			!L ||
			!map ||
			!lowAirwayLines ||
			!lowAirwaySymbols ||
			!lowAirwayLinesData ||
			!lowAirwaySymbolsData
		)
			return;

		lowAirwayLines.clearLayers();
		lowAirwaySymbols.clearLayers();

		if (!show) return;

		const colors = getColors();

		L.geoJSON(lowAirwayLinesData, {
			style: {
				color: colors.low,
				weight: 1,
				opacity: 0.8
			}
		}).addTo(lowAirwayLines);

		L.geoJSON(lowAirwaySymbolsData, {
			pointToLayer: (feature, latlng) => {
				return L.circle(latlng, {
					radius: 500,
					color: colors.low,
					weight: 1,
					fill: true,
					fillColor: colors.low,
					fillOpacity: 0.5
				});
			}
		}).addTo(lowAirwaySymbols);
	}

	async function renderNavaids(show: boolean): Promise<void> {
		if (!L || !map || !navaidLayers || !navaidData) return;

		navaidLayers.clearLayers();

		if (!show) return;

		const colors = getColors();

		L.geoJSON(navaidData, {
			pointToLayer: (feature, latlng) => {
				return L.circle(latlng, {
					radius: 1000,
					color: colors.navaid,
					weight: 1,
					fill: true,
					fillColor: colors.navaid,
					fillOpacity: 0.5
				});
			}
		}).addTo(navaidLayers);
	}

	// Separate effect for tile layer visibility
	$effect(() => {
		const showTiles = settings.showTiles;

		if (!map || !tileLayer) return;

		if (showTiles) {
			tileLayer.addTo(map);
		} else {
			map.removeLayer(tileLayer);
		}
	});

	// Separate effect for other layers
	$effect(() => {
		if (settings.showHigh) {
			renderHighSectors(true);
			renderHighAirways(settings.showLines);
			renderNavaids(settings.showNavaids);
		} else if (settings.showLow) {
			renderLowSectors(true);
			renderLowAirways(settings.showLines);
			renderNavaids(settings.showNavaids);
		} else {
			clearLayers();
		}
	});
</script>

<div class="bg relative z-0 h-full w-full">
	<div id="map" class="bg h-full w-full"></div>
</div>

<div class="absolute right-4 top-4 z-10">
	<div
		class="flex items-center justify-center gap-x-2 rounded-2xl bg-white bg-opacity-80 p-2 shadow-lg dark:bg-gray-800 dark:bg-opacity-90"
	>
		<button
			type="button"
			class="rounded-lg px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none"
			class:bg-zinc-700={settings.showHigh}
			class:bg-zinc-300={!settings.showHigh}
			class:dark:bg-zinc-300={settings.showHigh}
			class:dark:bg-zinc-700={!settings.showHigh}
			class:text-white={settings.showHigh}
			class:text-zinc-700={!settings.showHigh}
			class:dark:text-zinc-700={settings.showHigh}
			class:dark:text-white={!settings.showHigh}
			onclick={() => {
				settings.showHigh = true;
				settings.showLow = false;
			}}
		>
			<ChevronDoubleUp />
		</button>
		<button
			type="button"
			class="rounded-lg px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none"
			class:bg-zinc-700={settings.showLow}
			class:bg-zinc-300={!settings.showLow}
			class:dark:bg-zinc-300={settings.showLow}
			class:dark:bg-zinc-700={!settings.showLow}
			class:text-white={settings.showLow}
			class:text-zinc-700={!settings.showLow}
			class:dark:text-zinc-700={settings.showLow}
			class:dark:text-white={!settings.showLow}
			onclick={() => {
				settings.showLow = true;
				settings.showHigh = false;
			}}
		>
			<ChevronDoubleDown />
		</button>
		<div class="mx-1 h-6 w-px bg-zinc-300 dark:bg-zinc-600"></div>
		<button
			type="button"
			class="rounded-lg px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none"
			class:bg-zinc-700={settings.showLines}
			class:bg-zinc-300={!settings.showLines}
			class:text-white={settings.showLines}
			class:text-zinc-700={!settings.showLines}
			class:dark:text-zinc-200={settings.showLines}
			class:hover:bg-zinc-600={settings.showLines}
			class:hover:bg-zinc-400={!settings.showLines}
			onclick={() => (settings.showLines = !settings.showLines)}
		>
			<VectorLine />
		</button>
		<button
			type="button"
			class="rounded-lg px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none"
			class:bg-zinc-700={settings.showNavaids}
			class:bg-zinc-300={!settings.showNavaids}
			class:text-white={settings.showNavaids}
			class:text-zinc-700={!settings.showNavaids}
			class:dark:text-zinc-200={settings.showNavaids}
			class:hover:bg-zinc-600={settings.showNavaids}
			class:hover:bg-zinc-400={!settings.showNavaids}
			onclick={() => (settings.showNavaids = !settings.showNavaids)}
		>
			<RadioTower />
		</button>
		<button
			type="button"
			class="rounded-lg px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none"
			class:bg-zinc-700={settings.showTiles}
			class:bg-zinc-300={!settings.showTiles}
			class:text-white={settings.showTiles}
			class:text-zinc-700={!settings.showTiles}
			class:dark:text-zinc-200={settings.showTiles}
			class:hover:bg-zinc-600={settings.showTiles}
			class:hover:bg-zinc-400={!settings.showTiles}
			onclick={() => (settings.showTiles = !settings.showTiles)}
		>
			<Layers />
		</button>
	</div>
</div>

<style lang="postcss">
	:global(.sector-label) {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		width: 100%;
		height: 100%;
	}

	:global(.sector-label span) {
		display: block;
		width: 100%;
		text-align: center;
		white-space: nowrap;
	}

	:global(.vor-symbol) {
		background: none;
		border: none;
	}

	:global(.vor-symbol svg) {
		display: block;
	}

	:global(.leaflet-container) {
		background: transparent !important;
	}
</style>
