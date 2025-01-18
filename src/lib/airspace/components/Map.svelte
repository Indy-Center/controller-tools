<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import { browser } from '$app/environment';
	import type { LayerGroup, Map as LeafletMap } from 'leaflet';
	import * as turf from '@turf/turf';

	let { areas }: { areas: string[] } = $props();

	let L: typeof import('leaflet') | undefined;
	let map: LeafletMap | undefined;

	let highSectorLayers: LayerGroup | undefined;
	let lowSectorLayers: LayerGroup | undefined;
	let settings = $state({
		showHigh: true,
		showLow: false
	});

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

	// Map initialization
	onMount(async () => {
		if (browser) {
			L = await import('leaflet');
			const centerPoint = [38.65, -84.62] as [number, number];
			map = L.map('map', {
				zoomSnap: 0.5,
				zoomControl: false
			}).setView(centerPoint, 7);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© OpenStreetMap contributors'
			}).addTo(map);

			// Create layer groups once
			highSectorLayers = L.layerGroup().addTo(map);
			lowSectorLayers = L.layerGroup().addTo(map);

			renderHighSectors(true);
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

		const color = type === 'high' ? '#8E24AA' : '#2196F3';

		for (const sector of sectors) {
			const response = await fetch(`/data/sectors/${type}/${sector}.geojson`);
			const geojsonData = await response.json();

			const centerPoint = await calculateCenterPoint(geojsonData);

			// Render sector polygons
			L!
				.geoJSON(geojsonData, {
					style: {
						color: color,
						fillOpacity: 0.2,
						weight: 2
					}
				})
				.addTo(layerGroup);

			// Add label
			if (centerPoint) {
				const label = createLabel(sector, color);
				L!
					.marker(centerPoint, {
						icon: label,
						interactive: false
					})
					.addTo(layerGroup);
			}
		}
	}

	function clearLayers() {
		highSectorLayers?.clearLayers();
		lowSectorLayers?.clearLayers();
	}

	async function renderHighSectors(showHigh: boolean) {
		clearLayers();
		await renderSectorLayer(highSectors, highSectorLayers, 'high', showHigh);
	}

	async function renderLowSectors(showLow: boolean) {
		clearLayers();
		await renderSectorLayer(lowSectors, lowSectorLayers, 'low', showLow);
	}

	$effect(() => {
		if (settings.showHigh) {
			renderHighSectors(true);
		} else if (settings.showLow) {
			renderLowSectors(true);
		} else {
			clearLayers();
		}
	});
</script>

<div class="relative z-0 h-full w-full">
	<div id="map" class="h-full w-full"></div>
</div>

<div
	class="absolute right-4 top-4 z-10 flex w-auto items-center justify-center gap-x-2 rounded-2xl bg-white bg-opacity-80 p-2 shadow-lg dark:bg-gray-800 dark:bg-opacity-90"
>
	<button
		type="button"
		class="rounded-lg px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none"
		class:bg-zinc-700={settings.showHigh}
		class:bg-zinc-300={!settings.showHigh}
		class:text-white={settings.showHigh}
		class:text-zinc-700={!settings.showHigh}
		class:dark:text-zinc-200={settings.showHigh}
		class:hover:bg-zinc-600={settings.showHigh}
		class:hover:bg-zinc-400={!settings.showHigh}
		onclick={() => {
			settings.showHigh = !settings.showHigh;
			settings.showLow = false;
		}}
	>
		High
	</button>
	<button
		type="button"
		class="rounded-lg px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none"
		class:bg-zinc-700={settings.showLow}
		class:bg-zinc-300={!settings.showLow}
		class:text-white={settings.showLow}
		class:text-zinc-700={!settings.showLow}
		class:dark:text-zinc-200={settings.showLow}
		class:hover:bg-zinc-600={settings.showLow}
		class:hover:bg-zinc-400={!settings.showLow}
		onclick={() => {
			settings.showLow = !settings.showLow;
			settings.showHigh = false;
		}}
	>
		Low
	</button>
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
</style>
