<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import { browser } from '$app/environment';
	import type { LayerGroup, Map as LeafletMap } from 'leaflet';
	import * as turf from '@turf/turf';
	import RadioTower from 'virtual:icons/mdi/radio-tower';
	import VectorLine from 'virtual:icons/mdi/vector-line';
	import Layers from 'virtual:icons/mdi/layers';
	import type { Split } from '$lib/db/schema';
	import ChevronDown from 'virtual:icons/mdi/chevron-down';
	import MapMenu from '$lib/components/MapMenu.svelte';

	let { areas = [] } = $props();

	let L: typeof import('leaflet') | undefined;
	let map: LeafletMap | undefined;

	let sectorLayers: LayerGroup | undefined;
	let airwayLines: LayerGroup | undefined;
	let airwaySymbols: LayerGroup | undefined;
	let navaidLayers: LayerGroup | undefined;

	// Simple state management with Svelte 5
	let settings = $state({
		showTiles: true,
		selectedTag: null as string | null,
		showLines: true,
		showNavaids: true
	});

	let tileLayer: L.TileLayer | undefined;

	// Add state for the current split
	let currentSplit = $state<Split | null>(null);
	let isLoading = $state(true);

	// Add state for airway data
	let highAirwayLinesData = $state<any>(null);
	let highAirwaySymbolsData = $state<any>(null);
	let lowAirwayLinesData = $state<any>(null);
	let lowAirwaySymbolsData = $state<any>(null);

	// Add state for navaid data
	let navaidData = $state<any>(null);

	// Add state for splits
	let splits = $state<Split[]>([]);
	let selectedSplit = $state<string | null>(null);
	let isDropdownOpen = $state(false);

	// Modify the prefetchData function
	async function prefetchData() {
		try {
			isLoading = true;

			if (!selectedSplit) return;

			const [splitResponse, highLines, highSymbols, lowLines, lowSymbols, navaids] =
				await Promise.all([
					fetch(`/api/splits/${selectedSplit}`),
					fetch('/data/map/High Airway Lines.geojson').then((r) => r.json()),
					fetch('/data/map/High Airway Symbols.geojson').then((r) => r.json()),
					fetch('/data/map/Low Airway Lines.geojson').then((r) => r.json()),
					fetch('/data/map/Low Airway Symbols.geojson').then((r) => r.json()),
					fetch('/data/map/Filter 4 - Navaids.geojson').then((r) => r.json())
				]);

			if (!splitResponse.ok) {
				throw new Error(
					`Failed to fetch split: ${splitResponse.status} ${splitResponse.statusText}`
				);
			}

			currentSplit = await splitResponse.json();
			highAirwayLinesData = highLines;
			highAirwaySymbolsData = highSymbols;
			lowAirwayLinesData = lowLines;
			lowAirwaySymbolsData = lowSymbols;
			navaidData = navaids;

			const availableTags = getTagsAndColors().map((t) => t.tag);

			if (settings.selectedTag) {
				if (!availableTags.includes(settings.selectedTag)) {
					settings.selectedTag = availableTags[0];
				}
			} else {
				settings.selectedTag = availableTags[0];
				settings.showLines = true;
				settings.showNavaids = true;
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			isLoading = false;
		}
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

			initializeTileLayers();
			initializeLayerGroups();
			initializeThemeObserver();
			await initializeSplits();
		}
	});

	function initializeTileLayers() {
		const lightTiles = L!.tileLayer(
			'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
			{
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				subdomains: 'abcd',
				maxZoom: 11,
				minZoom: 7
			}
		);

		const darkTiles = L!.tileLayer(
			'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
			{
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				subdomains: 'abcd',
				maxZoom: 11,
				minZoom: 7
			}
		);

		tileLayer = isDarkMode() ? darkTiles : lightTiles;
		if (settings.showTiles) {
			tileLayer.addTo(map!);
		}
	}

	function initializeLayerGroups() {
		sectorLayers = L!.layerGroup().addTo(map!);
		airwayLines = L!.layerGroup().addTo(map!);
		airwaySymbols = L!.layerGroup().addTo(map!);
		navaidLayers = L!.layerGroup().addTo(map!);
	}

	function initializeThemeObserver() {
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === 'class' && map) {
					// Handle tile layer change
					if (settings.showTiles) {
						map.removeLayer(tileLayer!);
						tileLayer = isDarkMode()
							? L!.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
									attribution:
										'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
									subdomains: 'abcd',
									maxZoom: 11,
									minZoom: 7
								})
							: L!.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
									attribution:
										'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
									subdomains: 'abcd',
									maxZoom: 11,
									minZoom: 7
								});
						tileLayer.addTo(map);
					}

					// Redraw all layers with new theme
					if (settings.selectedTag) {
						renderSectorLayer(sectorLayers, settings.selectedTag, true);
						if (settings.showLines) {
							renderAirways(true);
						}
						if (settings.showNavaids) {
							renderNavaids(true);
						}
					}
				}
			});
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});
	}

	async function initializeSplits() {
		try {
			const splitsResponse = await fetch('/api/splits');
			if (!splitsResponse.ok) {
				throw new Error('Failed to fetch splits');
			}
			splits = await splitsResponse.json();

			if (splits.length > 0) {
				selectedSplit = splits[0].id;
				await prefetchData();
			}
		} catch (error) {
			console.error('Error initializing splits:', error);
		}
	}

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

	function createLabel(sector: string, color: string, isMainArea: boolean = false) {
		const isDark = isDarkMode();
		return L!.divIcon({
			className: 'sector-label',
			html: `<span style="color: ${isDark ? '#ffffff' : color}; font-weight: 700; font-size: ${
				isMainArea ? '16px' : '14px'
			};">${sector}${isMainArea ? ' ★' : ''}</span>`,
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
		layerGroup: LayerGroup | undefined,
		tag: string | null,
		show: boolean
	): Promise<void> {
		if (!L || !map || !layerGroup || !currentSplit || !tag) return;

		layerGroup.clearLayers();
		if (!show) return;

		const groups = currentSplit.groups.filter((group) =>
			group.areas.some((area) => area.tag === tag)
		);

		const isDark = isDarkMode();

		await Promise.all(
			groups.map(async (group) => {
				for (const area of group.areas) {
					if (area.tag !== tag || !area.geojson) continue;

					const centerPoint = await calculateCenterPoint(area.geojson);

					L.geoJSON(area.geojson, {
						style: {
							color: group.color,
							fillColor: group.color,
							fillOpacity: isDark ? 0.2 : 0.25, // Lower fill opacity in dark mode
							weight: 1,
							opacity: isDark ? 0.8 : 0.7
						}
					}).addTo(layerGroup);

					if (centerPoint) {
						const isMainArea = area.short === group.name;
						const label = createLabel(area.short, isDark ? '#ffffff' : group.color, isMainArea);
						L.marker(centerPoint, { icon: label, interactive: false }).addTo(layerGroup);
					}
				}
			})
		);
	}

	function clearLayers() {
		sectorLayers?.clearLayers();
		airwayLines?.clearLayers();
		airwaySymbols?.clearLayers();
		navaidLayers?.clearLayers();
	}

	async function renderAirways(show: boolean): Promise<void> {
		if (!L || !map || !airwayLines || !airwaySymbols) return;

		airwayLines.clearLayers();
		airwaySymbols.clearLayers();

		if (!show || !settings.selectedTag) return;

		const colors = getColors();
		const isDark = isDarkMode();

		if (settings.selectedTag === 'high' && highAirwayLinesData && highAirwaySymbolsData) {
			L.geoJSON(highAirwayLinesData, {
				style: {
					color: colors.high,
					weight: 1,
					opacity: isDark ? 0.9 : 0.8
				}
			}).addTo(airwayLines);

			L.geoJSON(highAirwaySymbolsData, {
				pointToLayer: (feature, latlng) => {
					return L.circle(latlng, {
						radius: 500,
						color: colors.high,
						weight: 1,
						fill: true,
						fillColor: colors.high,
						fillOpacity: isDark ? 0.4 : 0.3
					});
				}
			}).addTo(airwaySymbols);
		} else if (settings.selectedTag === 'low' && lowAirwayLinesData && lowAirwaySymbolsData) {
			L.geoJSON(lowAirwayLinesData, {
				style: {
					color: colors.low,
					weight: 1,
					opacity: isDark ? 0.9 : 0.8
				}
			}).addTo(airwayLines);

			L.geoJSON(lowAirwaySymbolsData, {
				pointToLayer: (feature, latlng) => {
					return L.circle(latlng, {
						radius: 500,
						color: colors.low,
						weight: 1,
						fill: true,
						fillColor: colors.low,
						fillOpacity: isDark ? 0.4 : 0.3
					});
				}
			}).addTo(airwaySymbols);
		}
	}

	async function renderNavaids(show: boolean): Promise<void> {
		if (!L || !map || !navaidLayers || !navaidData) return;

		navaidLayers.clearLayers();

		if (!show) return;

		const colors = getColors();
		const isDark = isDarkMode();

		L.geoJSON(navaidData, {
			pointToLayer: (feature, latlng) => {
				return L.circle(latlng, {
					radius: 1000,
					color: colors.navaid,
					weight: 1,
					fill: true,
					fillColor: colors.navaid,
					fillOpacity: isDark ? 0.4 : 0.3
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

	// Add effect for tag changes that also triggers airway updates
	$effect(() => {
		const tag = settings.selectedTag;
		if (tag) {
			renderSectorLayer(sectorLayers, tag, true);
			// Clear airways and re-render if they should be shown
			airwayLines?.clearLayers();
			airwaySymbols?.clearLayers();
			if (settings.showLines) {
				renderAirways(true);
			}
		} else {
			clearLayers();
		}
	});

	// Keep the separate effect for the lines toggle
	$effect(() => {
		if (settings.showLines && settings.selectedTag) {
			renderAirways(true);
		} else {
			airwayLines?.clearLayers();
			airwaySymbols?.clearLayers();
		}
	});

	$effect(() => {
		if (settings.showNavaids) {
			renderNavaids(true);
		} else {
			navaidLayers?.clearLayers();
		}
	});

	// Helper to get unique tags and their colors from the split
	function getTagsAndColors() {
		if (!currentSplit) return [];
		const tagColors = new Map<string, string>();

		currentSplit.groups.forEach((group) => {
			group.areas.forEach((area) => {
				if (area.tag && !tagColors.has(area.tag)) {
					tagColors.set(area.tag, group.color);
				}
			});
		});

		return Array.from(tagColors.entries()).map(([tag, color]) => ({ tag, color }));
	}

	// Add effect to refetch data when split changes
	$effect(() => {
		if (selectedSplit) {
			prefetchData();
		}
	});

	// Add effect to reset tag selection when split changes
	$effect(() => {
		if (selectedSplit) {
			const availableTags = getTagsAndColors().map((t) => t.tag);
			if (settings.selectedTag) {
				// If current tag isn't available in new split, select first available tag
				if (!availableTags.includes(settings.selectedTag)) {
					settings.selectedTag = availableTags[0];
				}
			} else {
				// If no tag selected, select first available tag
				settings.selectedTag = availableTags[0];
			}
		}
	});
</script>

<div class="relative z-0 h-full w-full">
	<div id="map" class="h-full w-full"></div>
	<div class="absolute right-4 top-4 z-[450] flex flex-col gap-2">
		{#if splits.length > 0 && getTagsAndColors().length > 0}
			<MapMenu
				actions={[
					...getTagsAndColors().map((tag) => ({
						text: tag.tag.toUpperCase(),
						active: settings.selectedTag === tag.tag,
						onClick: () => (settings.selectedTag = tag.tag),
						group: 'tags'
					})),
					{
						icon: VectorLine,
						active: settings.showLines,
						onClick: () => (settings.showLines = !settings.showLines),
						dividerBefore: true
					},
					{
						icon: RadioTower,
						active: settings.showNavaids,
						onClick: () => (settings.showNavaids = !settings.showNavaids)
					},
					{
						icon: Layers,
						active: settings.showTiles,
						onClick: () => (settings.showTiles = !settings.showTiles)
					}
				]}
			/>

			<!-- Dropdown remains unchanged -->
			<div class="relative">
				<button
					type="button"
					class="flex w-full items-center justify-between rounded-lg bg-white/95 px-4 py-2 text-left text-sm font-medium text-gray-700 shadow-lg backdrop-blur-md hover:bg-gray-50 focus:outline-none dark:bg-gray-800/95 dark:text-gray-200 dark:hover:bg-gray-700"
					onclick={() => (isDropdownOpen = !isDropdownOpen)}
				>
					<span>
						{#if splits.find((s) => s.id === selectedSplit)?.name === 'Combined'}
							Combined ★
						{:else}
							{splits.find((s) => s.id === selectedSplit)?.name || 'Select Split'}
						{/if}
					</span>
					<ChevronDown class="ml-2 h-5 w-5" />
				</button>

				{#if isDropdownOpen}
					<div
						class="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800"
						role="menu"
					>
						<div class="py-1" role="none">
							{#each splits as split}
								<button
									type="button"
									class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
									role="menuitem"
									onclick={() => {
										selectedSplit = split.id;
										isDropdownOpen = false;
									}}
								>
									{split.name}{split.name === 'Combined' ? ' ★' : ''}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Click outside handler -->
<svelte:window
	onclick={(e) => {
		const target = e.target as HTMLElement;
		if (!target.closest('.relative')) {
			isDropdownOpen = false;
		}
	}}
/>

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

	:global(.pattern-fill) {
		fill: url(#stripe-pattern) !important;
		fill-opacity: 0.5 !important;
	}

	@media (prefers-color-scheme: dark) {
		:global(.pattern-fill) {
			fill-opacity: 0.3 !important;
		}
	}

	:global(.pattern-fill-diagonal-stripes) {
		fill: url(#diagonal-stripes) !important;
		fill-opacity: 0.3 !important;
	}

	:global(.pattern-fill-dots) {
		fill: url(#dots) !important;
		fill-opacity: 0.3 !important;
	}

	:global(.pattern-fill-crosshatch) {
		fill: url(#crosshatch) !important;
		fill-opacity: 1 !important;
		stroke-opacity: 1 !important;
		paint-order: stroke fill !important;
	}

	:global(.pattern-fill-horizontal-stripes) {
		fill: url(#horizontal-stripes) !important;
		fill-opacity: 1 !important;
		stroke-opacity: 1 !important;
		paint-order: stroke fill !important;
	}

	:global(.pattern-fill-grid) {
		fill: url(#grid) !important;
		fill-opacity: 1 !important;
		stroke-opacity: 1 !important;
		paint-order: stroke fill !important;
	}

	@media (prefers-color-scheme: dark) {
		:global([class^='pattern-fill-']) {
			fill-opacity: 0.2 !important;
		}
	}

	:global(.leaflet-control-attribution) {
		@apply text-content-secondary text-xs;
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
