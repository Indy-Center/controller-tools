<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import MapMenu from '$lib/components/map/MapMenu.svelte';
	import type { Split } from '$lib/db/schema';
	import { useSessionStorage } from '$lib/sessionStore.svelte';
	import { getUserInfo } from '$lib/state.svelte';
	import * as turf from '@turf/turf';

	import type { MdiIconName } from '$lib/types/mdi';
	import { type LayerGroup, type Map as LeafletMap } from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import { onMount } from 'svelte';
	import MdiIcon from '../MdiIcon.svelte';
	import Legend from './Legend.svelte';
	import SplitName from '$lib/components/splits/SplitName.svelte';

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

	interface StaticElementGroup {
		id: string;
		name: string;
		icon: MdiIconName;
		isPublished: boolean;
		components: {
			id: string;
			name: string;
			geojson: object;
			color: string;
			settings?: {
				weight?: number;
				opacity?: number;
				lineCap?: string;
				lineJoin?: string;
				radius?: number;
				fillOpacity?: number;
			};
		}[];
	}

	let { splits = [], staticElementGroups = [] } = $props<{
		splits?: Split[];
		staticElementGroups: StaticElementGroup[];
	}>();

	let L: typeof import('leaflet') | undefined;
	let map: LeafletMap | undefined;

	let sectorLayers: LayerGroup | undefined;
	let airwayLines: LayerGroup | undefined;
	let airwaySymbols: LayerGroup | undefined;
	let navaidsLayer: LayerGroup | undefined;
	let combinedSplitLayer: LayerGroup | undefined;
	let controllerLayer: LayerGroup | undefined;
	let staticElementLayer: LayerGroup | undefined;

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

	// state for tracking static elements
	let showStaticElements = $state<Record<string, boolean>>(
		useSessionStorage('mapStaticElements', {})
	);

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
		if (!browser) return false;
		return document.documentElement.classList.contains('dark');
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

			initializeTileLayers();
			initializeLayerGroups();
			initializeThemeObserver();
			initializeStaticElements();
			await initializeSplits();
			await renderStaticElements(showStaticElements);
		}
	});

	function initializeStaticElements() {
		// Add each static element to the toggle state
		staticElementGroups.forEach((s: StaticElementGroup) => {
			if (!Object.keys(showStaticElements).includes(s.id)) {
				showStaticElements[s.id] = false;
			}
		});
	}

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
		staticElementLayer = L!.layerGroup().addTo(map!);
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

	function createLabel(sector: string, color: string, isMainArea: boolean = false) {
		const isDark = isDarkMode();
		return L!.divIcon({
			className: 'sector-label',
			html: `<span style="color: ${color}; font-weight: 700; font-size: ${
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
						const label = createLabel(area.short, group.color, isMainArea);
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
				if (settings.showCombined) {
					renderCombinedSplit(true);
				}
			});
		}
	});

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

	$effect(() => {
		renderStaticElements({ ...showStaticElements });
	});

	async function renderStaticElements(visibility: Record<string, boolean>) {
		if (!L || !map || !staticElementLayer) return;

		staticElementLayer.clearLayers();

		staticElementGroups.forEach((group: StaticElementGroup) => {
			if (visibility[group.id]) {
				group.components.forEach((component) => {
					const geojsonData = component.geojson as GeoJSON.FeatureCollection;

					// Lines Layer
					const lineFeatures = geojsonData.features.filter(
						(f) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'
					);
					if (lineFeatures.length > 0) {
						const lineLayer = L!.geoJSON(
							{
								type: 'FeatureCollection',
								features: lineFeatures
							},
							{
								style: {
									color: component.color,
									weight: component.settings?.weight ?? 1,
									opacity: component.settings?.opacity ?? 0.8,
									lineCap: component.settings?.lineCap ?? 'round',
									lineJoin: component.settings?.lineJoin ?? 'round'
								}
							}
						);
						lineLayer.addTo(staticElementLayer!);
					}

					// Points Layer
					const pointFeatures = geojsonData.features.filter((f) => f.geometry.type === 'Point');
					if (pointFeatures.length > 0) {
						L!
							.geoJSON(
								{
									type: 'FeatureCollection',
									features: pointFeatures
								},
								{
									pointToLayer: (_feature, latlng) => {
										return L!.circleMarker(latlng, {
											radius: component.settings?.radius ?? 2,
											fillColor: component.color,
											color: component.color,
											weight: component.settings?.weight ?? 1,
											opacity: component.settings?.opacity ?? 0.8,
											fillOpacity: component.settings?.fillOpacity ?? 0.8
										});
									}
								}
							)
							.addTo(staticElementLayer!);
					}

					// Polygons
					const polygonFeatures = geojsonData.features.filter((f) => f.geometry.type === 'Polygon');
					if (polygonFeatures.length > 0) {
						L!
							.geoJSON(
								{
									type: 'FeatureCollection',
									features: polygonFeatures
								},
								{
									style: {
										color: component.color,
										weight: component.settings?.weight ?? 1,
										opacity: component.settings?.opacity ?? 0.8,
										fillOpacity: component.settings?.fillOpacity ?? 0.8,
										lineCap: component.settings?.lineCap ?? 'round',
										lineJoin: component.settings?.lineJoin ?? 'round'
									}
								}
							)
							.addTo(staticElementLayer!);
					}
				});
			}
		});
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

	let layerMenuActions = $derived.by(() => {
		const baseActions = [
			{
				icon: 'layers' as MdiIconName,
				active: settings.showTiles,
				tooltip: 'Toggle Map Layer',
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
				icon: 'vector-polygon' as MdiIconName,
				active: settings.showCombined,
				tooltip: 'Toggle Split Group Overlay',
				onClick: () => {
					settings.showCombined = !settings.showCombined;
				}
			}
		];

		baseActions.push(
			...staticElementGroups.map((s: StaticElementGroup) => {
				return {
					icon: s.icon,
					active: showStaticElements[s.id],
					tooltip: `Toggle ${s.name}`,
					isAdminOnly: !s.isPublished,
					onClick: () => {
						showStaticElements[s.id] = !showStaticElements[s.id];
					}
				};
			})
		);

		return baseActions;
	});
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
						<MapMenu actions={layerMenuActions} />
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
				<MapMenu actions={layerMenuActions} />
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
