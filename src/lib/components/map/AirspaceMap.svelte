<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import MapMenu from '$lib/components/map/MapMenu.svelte';
	import type { Split } from '$lib/db/schema';
	import { useSessionStorage } from '$lib/sessionStore.svelte';
	import { getUserInfo } from '$lib/state.svelte';
	import * as turf from '@turf/turf';
	import type { Feature, Point } from 'geojson';
	import type { LatLng, Layer, LayerGroup, Map as LeafletMap } from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import { onMount } from 'svelte';
	import MdiIcon from '../MdiIcon.svelte';
	import Legend from './Legend.svelte';
	import SplitName from './SplitName.svelte';
	import type { MdiIconName } from '$lib/types/mdi';

	interface Area {
		id: string;
		tag: string;
		short: string;
		color?: string;
		geojson: any;
	}

	interface Controller {
		position: string;
		frequency: string;
	}

	interface Group {
		name: string;
		color: string;
		areas: Area[];
		frequency: string;
	}

	interface MapSplit {
		id: string;
		name: string;
		isPublished: boolean;
		isDefault: boolean;
		createdAt: Date | null;
		groups: Group[];
	}

	let { splits = [], controllers = [] } = $props<{
		splits?: Split[];
		controllers?: Controller[];
	}>();

	let L: typeof import('leaflet') | undefined;
	let map: LeafletMap | undefined;

	let sectorLayers: LayerGroup | undefined;
	let airwayLines: LayerGroup | undefined;
	let airwaySymbols: LayerGroup | undefined;
	let navaidsLayer: LayerGroup | undefined;
	let combinedSplitLayer: LayerGroup | undefined;
	let controllerLayer: LayerGroup | undefined;

	// Use Session Storage to persist settings - directly use the returned value
	let settings = $state(
		useSessionStorage('mapSettings', {
			showTiles: true,
			selectedTag: null as string | null,
			showLines: true,
			showNavaids: true,
			showCombined: true,
			selectedSplit: null as string | null
		})
	);

	let tileLayer: L.TileLayer | undefined;

	// Add state for the current split
	let currentSplit = $state<MapSplit | null>(null);
	let isLoading = $state(true);

	// Airway Data
	let highAirwayLinesData = $state<any>(null);
	let highAirwaySymbolsData = $state<any>(null);
	let lowAirwayLinesData = $state<any>(null);
	let lowAirwaySymbolsData = $state<any>(null);

	// Navaids Data
	let navaidsData = $state<any>(null);

	let selectedSplit = $state<string | null>(null);
	let isDropdownOpen = $state(false);

	// Add a state to track when data is ready
	let isDataReady = $state(false);

	// Add state for combined split data
	let combinedSplitData = $state<any>(null);

	let hoveredGroupId = $state<string | null>(null);
	let infoCard = $state<{
		x: number;
		y: number;
		group: {
			name: string;
			frequency: string;
			color: string;
		};
	} | null>(null);

	let showMobileControls = $state(false);
	let showLegend = $state(false);

	// Keep selectedSplit in sync with settings
	$effect(() => {
		selectedSplit = settings.selectedSplit;
	});

	let areas: Area[] = [];

	// Effect to render TRACON areas when controllers change
	$effect(() => {
		if (controllers.length > 0 && map && controllerLayer) {
			controllerLayer.clearLayers();
			renderTracons();
		}
	});

	async function fetchStaticData() {
		try {
			const [highLines, highSymbols, lowLines, lowSymbols, navaids] = await Promise.all([
				fetch('/data/map/High Airway Lines.geojson').then((r) => r.json()),
				fetch('/data/map/High Airway Symbols.geojson').then((r) => r.json()),
				fetch('/data/map/Low Airway Lines.geojson').then((r) => r.json()),
				fetch('/data/map/Low Airway Symbols.geojson').then((r) => r.json()),
				fetch('/data/map/Filter 4 - Navaids.geojson').then((r) => r.json())
			]);

			highAirwayLinesData = highLines;
			highAirwaySymbolsData = highSymbols;
			lowAirwayLinesData = lowLines;
			lowAirwaySymbolsData = lowSymbols;
			navaidsData = navaids;
		} catch (error) {
			console.error('Error fetching static data:', error);
		}
	}

	async function prefetchData() {
		try {
			isLoading = true;
			isDataReady = false;

			if (!selectedSplit) return;
			settings.selectedSplit = selectedSplit;

			const [splitResponse, combinedResponse] = await Promise.all([
				fetch(`/api/splits/${selectedSplit}`),
				fetch(`/api/splits/${selectedSplit}/combined`)
			]);

			if (!splitResponse.ok || !combinedResponse.ok) {
				throw new Error('Failed to fetch split data');
			}

			currentSplit = await splitResponse.json();
			combinedSplitData = await combinedResponse.json();

			const availableTags = getTagsAndColors().map((t) => t.tag);
			const previousTag = settings.selectedTag;

			if (!previousTag || !availableTags.includes(previousTag)) {
				settings.selectedTag = availableTags[0];
			}

			isDataReady = true;
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
			high: '#FF1744', // Brighter pink for high sectors
			low: '#2196F3' // Brighter blue for low sectors
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
				minZoom: 4,
				maxZoom: 12,
				maxBounds: [
					[25.0, -100.0],
					[50.0, -70.0]
				],
				maxBoundsViscosity: 1.0
			}).setView(centerPoint, 7.3);

			await fetchStaticData();
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
				maxZoom: 12,
				minZoom: 4,
				tileSize: 256,
				updateWhenIdle: false,
				updateWhenZooming: false
			}
		);

		const darkTiles = L!.tileLayer(
			'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
			{
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				subdomains: 'abcd',
				maxZoom: 12,
				minZoom: 4,
				tileSize: 256,
				updateWhenIdle: false,
				updateWhenZooming: false
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
		navaidsLayer = L!.layerGroup().addTo(map!);
		combinedSplitLayer = L!.layerGroup().addTo(map!);
		controllerLayer = L!.layerGroup().addTo(map!);
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
									maxZoom: 12,
									minZoom: 4,
									tileSize: 256,
									updateWhenIdle: false,
									updateWhenZooming: false
								})
							: L!.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
									attribution:
										'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
									subdomains: 'abcd',
									maxZoom: 12,
									minZoom: 4,
									tileSize: 256,
									updateWhenIdle: false,
									updateWhenZooming: false
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
			if (splits.length > 0) {
				if (
					settings.selectedSplit &&
					splits.some((split: MapSplit) => split.id === settings.selectedSplit)
				) {
					selectedSplit = settings.selectedSplit;
				} else {
					selectedSplit = splits.find((split: MapSplit) => split.isDefault)?.id || splits[0].id;
				}
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
		layerGroup: L.LayerGroup | undefined,
		tag: string | null,
		show: boolean
	): Promise<void> {
		if (!L || !map || !layerGroup || !currentSplit || !tag) return;

		layerGroup.clearLayers();
		if (!show) return;

		const groups = currentSplit.groups.filter((group: any) =>
			group.areas.some((area: any) => area.tag === tag)
		);

		const isDark = isDarkMode();

		await Promise.all(
			groups.map(async (group: any) => {
				for (const area of group.areas) {
					if (area.tag !== tag || !area.geojson) continue;

					const centerPoint = await calculateCenterPoint(area.geojson);

					L!
						.geoJSON(area.geojson, {
							style: {
								color: group.color,
								fillColor: group.color,
								fillOpacity: isDark ? 0.2 : 0.25,
								weight: 1,
								opacity: isDark ? 0.8 : 0.7
							}
						})
						.addTo(layerGroup);

					if (centerPoint) {
						const isMainArea = area.short === group.name;
						const label = createLabel(area.short, isDark ? '#ffffff' : group.color, isMainArea);
						L!.marker(centerPoint, { icon: label, interactive: false }).addTo(layerGroup);
					}
				}
			})
		);
	}

	function clearLayers() {
		if (!map) return;
		sectorLayers?.clearLayers();
		airwayLines?.clearLayers();
		airwaySymbols?.clearLayers();
		navaidsLayer?.clearLayers();
		combinedSplitLayer?.clearLayers();
	}

	$effect(() => {
		if (!isDataReady || !map) return;

		clearLayers();

		if (settings.selectedTag) {
			// Batch the layer updates
			requestAnimationFrame(() => {
				renderSectorLayer(sectorLayers, settings.selectedTag, true);
				if (settings.showLines) {
					renderAirways(true);
				}
				if (settings.showNavaids) {
					renderNavaids(true);
				}
				if (settings.showCombined) {
					renderCombinedSplit(true);
				}
			});
		}
	});

	// Separate effects for better performance
	$effect(() => {
		const showLines = settings.showLines;
		const selectedTag = settings.selectedTag;
		if (!map) return;

		// Clear layers when changing tags or toggling lines
		airwayLines?.clearLayers();
		airwaySymbols?.clearLayers();

		if (showLines && selectedTag) {
			renderAirways(true);
		}
	});

	$effect(() => {
		const showNavaids = settings.showNavaids;
		if (!map) return;
		if (!showNavaids) {
			navaidsLayer?.clearLayers();
		} else {
			renderNavaids(true);
		}
	});

	function handleLinesToggle(show: boolean) {
		if (!show) {
			airwayLines?.clearLayers();
			airwaySymbols?.clearLayers();
		} else {
			renderAirways(true);
		}
	}

	// Helper to get unique tags and their colors from the split
	function getTagsAndColors() {
		if (!currentSplit) return [];
		const tagColors = new Map<string, string>();

		currentSplit.groups.forEach((group: any) => {
			group.areas.forEach((area: any) => {
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

	// Modify this effect to prevent unnecessary tag resets
	$effect(() => {
		if (selectedSplit && currentSplit) {
			const availableTags = getTagsAndColors().map((t) => t.tag);
			if (settings.selectedTag) {
				// Only update if current tag isn't available
				if (!availableTags.includes(settings.selectedTag)) {
					settings.selectedTag = availableTags[0];
				}
			} else {
				// No tag selected, set first available
				settings.selectedTag = availableTags[0];
			}
		}
	});

	function renderNavaids(show: boolean) {
		if (!L || !map || !navaidsData || !navaidsLayer || !settings.selectedTag) return;

		navaidsLayer.clearLayers();
		if (!show || !settings.showNavaids) return;

		const isHighAltitude = settings.selectedTag.toLowerCase() === 'high';
		const isLowAltitude = settings.selectedTag.toLowerCase() === 'low';

		if (!isHighAltitude && !isLowAltitude) return;

		const colors = getColors();
		const navaidColor = isHighAltitude ? colors.high : colors.low;
		const isDark = isDarkMode();
		const leaflet = L;

		leaflet
			.geoJSON(navaidsData, {
				pointToLayer: (feature: Feature<Point>, latlng: LatLng): Layer => {
					return leaflet.circle(latlng, {
						radius: 1500,
						fillColor: navaidColor,
						color: navaidColor,
						weight: 1,
						opacity: 0.8,
						fillOpacity: 0.8
					});
				}
			})
			.addTo(navaidsLayer);
	}

	function renderAirways(force = false) {
		if (!map || !airwayLines || !airwaySymbols || !settings.selectedTag || !L) return;
		if (!settings.showLines && !force) {
			airwayLines.clearLayers();
			airwaySymbols.clearLayers();
			return;
		}

		airwayLines.clearLayers();
		airwaySymbols.clearLayers();

		const isHighAltitude = settings.selectedTag.toLowerCase() === 'high';
		const isLowAltitude = settings.selectedTag.toLowerCase() === 'low';

		if (!isHighAltitude && !isLowAltitude) return;

		const colors = getColors();
		const isDark = isDarkMode();
		const leaflet = L;

		if (isHighAltitude && highAirwayLinesData) {
			leaflet
				.geoJSON(highAirwayLinesData, {
					style: {
						color: colors.high,
						weight: 1,
						opacity: isDark ? 0.3 : 0.3
					}
				})
				.addTo(airwayLines);

			if (highAirwaySymbolsData) {
				leaflet
					.geoJSON(highAirwaySymbolsData, {
						pointToLayer: (feature: Feature<Point>, latlng: LatLng): Layer => {
							const style = feature.properties?.style;
							if (style === 'vor' || style === 'airwayIntersections') {
								return leaflet.circle(latlng, {
									radius: 100,
									color: colors.high,
									fillColor: colors.high,
									fillOpacity: 0.4,
									weight: 1,
									opacity: 0.4
								});
							}
							return leaflet.marker(latlng);
						}
					})
					.addTo(airwaySymbols);
			}
		}

		if (isLowAltitude && lowAirwayLinesData) {
			leaflet
				.geoJSON(lowAirwayLinesData, {
					style: {
						color: colors.low,
						weight: 1,
						opacity: isDark ? 0.3 : 0.3
					}
				})
				.addTo(airwayLines);

			if (lowAirwaySymbolsData) {
				leaflet
					.geoJSON(lowAirwaySymbolsData, {
						pointToLayer: (feature: Feature<Point>, latlng: LatLng): Layer => {
							const style = feature.properties?.style;
							if (style === 'vor' || style === 'airwayIntersections') {
								return leaflet.circle(latlng, {
									radius: 100,
									color: colors.low,
									fillColor: colors.low,
									fillOpacity: 0.4,
									weight: 1,
									opacity: 0.4
								});
							}
							return leaflet.marker(latlng);
						}
					})
					.addTo(airwaySymbols);
			}
		}
	}

	// Add function to render combined split outlines
	async function renderCombinedSplit(show: boolean): Promise<void> {
		if (!L || !map || !combinedSplitLayer || !combinedSplitData || !show || !settings.selectedTag)
			return;

		combinedSplitLayer.clearLayers();
		if (!show) return;

		const isDark = isDarkMode();

		// Only render the currently selected tag's polygons
		const featureCollection = combinedSplitData[settings.selectedTag];
		if (!featureCollection) return;

		// Create a custom pane for the combined layer if it doesn't exist
		if (!map.getPane('combinedPane')) {
			map.createPane('combinedPane');
			const pane = map.getPane('combinedPane');
			if (pane) {
				pane.style.zIndex = '400';
				pane.style.pointerEvents = 'all';
			}
		}

		const geoJsonLayer = L!.geoJSON(featureCollection, {
			pane: 'combinedPane',
			interactive: true,
			bubblingMouseEvents: false,
			style: (feature) => ({
				color: feature?.properties?.groupColor || '#000000',
				fillColor: feature?.properties?.groupColor || '#000000',
				fillOpacity: 0.01,
				weight: hoveredGroupId === feature?.properties?.groupId ? 4 : 3,
				opacity: hoveredGroupId === feature?.properties?.groupId ? 1 : isDark ? 0.8 : 0.7,
				className: 'combined-polygon'
			}),
			onEachFeature: (feature, layer) => {
				if (layer instanceof L!.Polygon) {
					layer.on({
						mouseover: (e) => {
							const group = currentSplit?.groups.find(
								(g) => g.name === feature?.properties?.groupName
							);
							if (!group) return;

							hoveredGroupId = feature?.properties?.groupId;
							const bounds = e.target.getBounds();
							const point = map!.latLngToContainerPoint(bounds.getCenter());

							infoCard = {
								x: point.x,
								y: point.y - 20,
								group: {
									name: group.name,
									frequency: group.frequency,
									color: feature?.properties?.groupColor
								}
							};

							e.target.setStyle({
								weight: 4,
								opacity: 1,
								fillOpacity: 0.1
							});

							// Bring the hovered polygon to front
							e.target.bringToFront();
						},
						mouseout: (e) => {
							hoveredGroupId = null;
							infoCard = null;
							e.target.setStyle({
								weight: 3,
								opacity: isDark ? 0.8 : 0.7,
								fillOpacity: 0.01
							});
						}
					});
				}
			}
		});

		geoJsonLayer.addTo(combinedSplitLayer);
	}

	$effect(() => {
		const showTiles = settings.showTiles; // Explicitly reference the value we want to track
		if (!map || !tileLayer) return;

		try {
			if (showTiles) {
				if (!map.hasLayer(tileLayer)) {
					tileLayer.addTo(map);
				}
			} else {
				if (map.hasLayer(tileLayer)) {
					map.removeLayer(tileLayer);
				}
			}
		} catch (error) {
			console.error('Error toggling tile layer:', error);
		}
	});

	$effect(() => {
		const showCombined = settings.showCombined;
		const selectedTag = settings.selectedTag;
		if (!map) return;

		if (!showCombined) {
			combinedSplitLayer?.clearLayers();
		} else if (selectedTag) {
			renderCombinedSplit(true);
		}
	});

	function handleCreateClick() {
		goto('/admin/splits/create');
	}

	function handleEditClick() {
		goto(`/admin/splits/${selectedSplit}/edit`);
	}

	function getTagMenuActions() {
		return getTagsAndColors().map((tag) => ({
			text: tag.tag.toUpperCase(),
			active: settings.selectedTag === tag.tag,
			onClick: () => (settings.selectedTag = tag.tag),
			group: 'tags'
		}));
	}

	function getLayerMenuActions() {
		return [
			{
				icon: 'layers' as MdiIconName,
				active: settings.showTiles,
				onClick: () => {
					settings.showTiles = !settings.showTiles;
					if (settings.showTiles) {
						tileLayer?.addTo(map!);
					} else {
						tileLayer?.removeFrom(map!);
					}
				}
			},
			{
				icon: 'vector-line' as MdiIconName,
				active: settings.showLines,
				onClick: () => {
					settings.showLines = !settings.showLines;
					handleLinesToggle(settings.showLines);
				}
			},
			{
				icon: 'radio-tower' as MdiIconName,
				active: settings.showNavaids,
				onClick: () => {
					settings.showNavaids = !settings.showNavaids;
				}
			},
			{
				icon: 'vector-polygon' as MdiIconName,
				active: settings.showCombined,
				onClick: () => {
					settings.showCombined = !settings.showCombined;
				}
			}
		];
	}

	async function renderTracons() {
		// Extract the TRACON prefixes from controllers' positions
		const traconPrefixes = controllers
			.filter((c: Controller) => c.position.includes('_APP'))
			.map((controller: Controller) => controller.position.split('_')[0]);

		console.log('TRACON Prefixes:', traconPrefixes);
		if (traconPrefixes.length === 0) return;

		try {
			// Fetch areas only once
			if (areas.length === 0) {
				const response = await fetch('/api/areas');
				if (!response.ok) throw new Error('Failed to fetch area data');
				areas = await response.json();
			}

			console.log('Areas:', areas);
			// Keep track of which areas we've already drawn
			const drawnAreas = new Set<string>();

			// Draw areas for each TRACON prefix
			traconPrefixes.forEach((prefix: string) => {
				console.log('Processing prefix:', prefix);
				// Find area where the short name starts with the prefix
				const area = areas.find((a: Area) => {
					console.log('Checking area:', a.short, 'against prefix:', prefix);
					return a.short.startsWith(prefix);
				});
				console.log('Found area:', area);
				if (!area || drawnAreas.has(area.short)) return;

				console.log('Drawing area:', area);
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
				drawnAreas.add(area.short);

				// Calculate a position for the label near the border
				const bounds = geoJsonLayer.getBounds();
				const labelPosition = L!.latLng(
					bounds.getNorth() - (bounds.getNorth() - bounds.getSouth()) * 0.1,
					bounds.getEast() - (bounds.getEast() - bounds.getWest()) * 0.3
				);

				// Create a label with a colored background matching the border
				const labelIcon = L!.divIcon({
					html: `
						<div class="tracon-label" style="background-color: ${area.color || '#FF1744'}">
							<div class="tracon-label-text">${prefix}</div>
						</div>
					`,
					className: 'tracon-label-container',
					iconSize: [60, 26],
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
</script>

<div class="relative z-0 h-full w-full">
	<div id="map" class="h-full w-full"></div>

	{#if infoCard}
		<div
			class="pointer-events-none absolute z-[600] -translate-x-1/2 -translate-y-full transform"
			style="left: {infoCard.x}px; top: {infoCard.y}px;"
		>
			<div
				class="flex flex-col items-center rounded-lg bg-surface/95 px-3 py-2 shadow-lg backdrop-blur-md dark:bg-surface-dark/95"
				style="border: 2px solid {infoCard.group.color}"
			>
				<span class="font-bold text-content dark:text-content-dark">
					{infoCard.group.name}
				</span>
				<span
					class="text-sm text-content-secondary dark:text-content-dark-secondary"
					style="color: {infoCard.group.color}"
				>
					{infoCard.group.frequency}
				</span>
			</div>
		</div>
	{/if}

	<!-- Left side controls -->
	<div class="absolute left-4 right-4 top-4 z-[500] flex flex-col gap-2 sm:right-auto">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-start">
			{#if splits.length > 0 && getTagsAndColors().length > 0}
				<!-- Dropdown with reduced width -->
				<div class="relative w-full sm:w-56">
					<button
						type="button"
						class="flex w-full items-center justify-between rounded-lg bg-surface/95 px-4 py-3 text-left text-sm font-medium text-content shadow-lg backdrop-blur-md hover:bg-surface-secondary focus:outline-none sm:py-2 dark:bg-surface-dark/95 dark:text-content-dark dark:hover:bg-surface-dark-secondary"
						onclick={(e) => {
							e.preventDefault();
							isDropdownOpen = !isDropdownOpen;
						}}
					>
						<span class="truncate">
							{#if splits.some((split: MapSplit) => split.id === selectedSplit)}
								{@const split = splits.find((split: MapSplit) => split.id === selectedSplit)}
								<SplitName {...split} />
							{:else}
								Select Split
							{/if}
						</span>
						<MdiIcon name="chevron-down" class="ml-2 h-5 w-5 flex-shrink-0" />
					</button>

					{#if isDropdownOpen}
						<div
							class="absolute left-0 z-[600] mt-2 w-full origin-top-left rounded-md bg-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-surface-dark"
							role="menu"
						>
							<div class="py-1" role="none">
								{#each splits as split}
									<button
										type="button"
										class="block w-full px-4 py-3 text-left text-sm text-content hover:bg-surface-secondary sm:py-2 dark:text-content-dark dark:hover:bg-surface-dark-secondary"
										role="menuitem"
										onclick={(e) => {
											e.preventDefault();
											selectedSplit = split.id;
											isDropdownOpen = false;
										}}
									>
										<SplitName {...split} />
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			{#if getUserInfo()?.isAdmin}
				<div class="flex gap-2">
					<button
						type="button"
						class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-md hover:bg-accent-secondary focus:outline-none sm:flex-initial sm:py-2 dark:bg-accent dark:hover:bg-accent-secondary"
						onclick={() => goto('/admin/splits/create')}
					>
						<MdiIcon name="plus" class="h-4 w-4" />
						<span>New</span>
					</button>
					<button
						type="button"
						class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-md hover:bg-accent-secondary focus:outline-none sm:flex-initial sm:py-2 dark:bg-accent dark:hover:bg-accent-secondary"
						onclick={() => goto(`/admin/splits/${selectedSplit}/edit`)}
					>
						<MdiIcon name="pencil" class="h-4 w-4" />
						<span>Edit</span>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Mobile controls toggles -->
	<div
		class="pointer-events-auto fixed bottom-32 left-1/2 z-[600] flex -translate-x-1/2 gap-4 lg:hidden"
	>
		<!-- Legend toggle -->
		<button
			type="button"
			class={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors ${
				showLegend
					? 'bg-accent text-white'
					: 'bg-surface/80 text-accent ring-2 ring-accent dark:bg-surface-dark/80'
			}`}
			onclick={() => {
				if (showMobileControls) showMobileControls = false;
				showLegend = !showLegend;
			}}
		>
			<MdiIcon name="chart-gantt" class="h-6 w-6" />
		</button>

		<!-- Controls toggle -->
		<button
			type="button"
			class={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors ${
				showMobileControls
					? 'bg-accent text-white'
					: 'bg-surface/80 text-accent ring-2 ring-accent dark:bg-surface-dark/80'
			}`}
			onclick={() => {
				if (showLegend) showLegend = false;
				showMobileControls = !showMobileControls;
			}}
		>
			<MdiIcon
				name="chevron-up"
				class="h-6 w-6 transition-transform duration-200"
				style="transform: rotate({showMobileControls ? 180 : 0}deg)"
			/>
		</button>
	</div>

	<!-- Mobile controls panel -->
	<div class="pointer-events-none absolute inset-x-4 top-1/2 z-[500] -translate-y-1/2 lg:hidden">
		<div class="flex w-full flex-col gap-4">
			<!-- Layer Controls Panel -->
			<div
				class="pointer-events-auto transform transition-all duration-200"
				class:translate-y-[-150%]={!showMobileControls}
				class:opacity-0={!showMobileControls}
			>
				<div class="flex flex-col gap-4">
					<div class="flex justify-center">
						<MapMenu actions={getTagMenuActions()} />
					</div>
					<div class="flex justify-center">
						<MapMenu actions={getLayerMenuActions()} />
					</div>
				</div>
			</div>

			<!-- Legend Panel -->
			<div
				class="pointer-events-auto w-max transform transition-all duration-200"
				class:translate-y-[-150%]={!showLegend}
				class:opacity-0={!showLegend}
			>
				{#if currentSplit?.groups}
					<Legend groups={currentSplit.groups} />
				{/if}
			</div>
		</div>
	</div>

	<!-- Desktop controls -->
	<div class="hidden lg:block">
		<!-- Right side controls -->
		<div class="absolute right-4 top-4 z-[500]">
			{#if splits.length > 0 && getTagsAndColors().length > 0}
				<MapMenu actions={getTagMenuActions()} />
			{/if}
		</div>

		<!-- Bottom right layer controls -->
		<div class="absolute bottom-4 right-4 z-[500]">
			{#if splits.length > 0 && getTagsAndColors().length > 0}
				<MapMenu actions={getLayerMenuActions()} />
			{/if}
		</div>

		<!-- Legend -->
		<div class="absolute bottom-4 left-4 z-[500] w-max">
			{#if currentSplit?.groups}
				<Legend groups={currentSplit.groups} />
			{/if}
		</div>
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

	:global(.highlighted-group) {
		transform: scale(1.05);
		transition: transform 0.2s ease-in-out;
	}

	:global(.combined-polygon) {
		cursor: pointer;
		pointer-events: auto !important;
	}
</style>
