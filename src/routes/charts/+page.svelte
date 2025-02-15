<script lang="ts">
	import { onMount } from 'svelte';
	import * as pdfjs from 'pdfjs-dist';
	import { sayNoToKilo } from '$lib/helpers';
	import { useSessionStorage } from '$lib/sessionStore.svelte';
	import MdiIcon from '$lib/components/MdiIcon.svelte';

	// Add preload hint for PDFs
	let preloadLink: HTMLLinkElement;
	onMount(() => {
		preloadLink = document.createElement('link');
		preloadLink.rel = 'preload';
		preloadLink.as = 'fetch';
		preloadLink.crossOrigin = 'anonymous';
		document.head.appendChild(preloadLink);
	});

	interface Chart {
		chart_name: string;
		chart_code: string;
		pdf_path: string;
		airport_name: string;
		city: string;
		state: string;
		faa_ident: string;
	}

	interface ChartSettings {
		scale: number;
		rotation: number;
		translateX: number;
		translateY: number;
	}

	interface ChartSessionState {
		lastAirport: string;
		chartCache: Record<string, Chart[]>;
		lastSelectedCharts: Record<string, Chart>;
		chartSettings: Record<string, ChartSettings>;
		pinnedCharts: Chart[];
		renderedPages: Record<string, string>; // Cache rendered pages as data URLs
	}

	// Use a single session storage key for all chart-related state
	let chartState = $state(
		useSessionStorage<ChartSessionState>('charts', {
			lastAirport: '',
			chartCache: {},
			lastSelectedCharts: {},
			chartSettings: {},
			pinnedCharts: [],
			renderedPages: {}
		})
	);

	// Chart type priority order for sorting
	const CHART_TYPE_ORDER = ['APD', 'MIN', 'CS', 'IAP', 'SID', 'STAR'];

	// Helper function to get sort priority for a chart type
	function getChartTypePriority(chartCode: string): number {
		const type = chartCode.split(' ')[0];
		const index = CHART_TYPE_ORDER.indexOf(type);
		return index === -1 ? CHART_TYPE_ORDER.length : index;
	}

	// Reusable sort function for charts
	function sortCharts<T extends Chart>(charts: T[]): T[] {
		return charts.slice().sort((a, b) => {
			const aPriority = getChartTypePriority(a.chart_code);
			const bPriority = getChartTypePriority(b.chart_code);

			// First sort by priority
			if (aPriority !== bPriority) {
				return aPriority - bPriority;
			}

			// If same priority, sort by name
			return a.chart_name.localeCompare(b.chart_name);
		});
	}

	let charts = $state<Chart[]>([]);
	let sortedCharts = $derived.by(() => sortCharts(charts));
	let sortedPinnedCharts = $derived.by(() => sortCharts(chartState.pinnedCharts));

	// Create reactive references to the individual properties
	let chartCache = $derived(chartState.chartCache);

	let loading = $state(false);
	let selectedChart = $state<Chart | null>(null);

	let canvas = $state<HTMLCanvasElement>();
	let currentPdfUrl: string | null = $state(null);

	let scale = $state(1);
	let rotation = $state(0);
	let recentAirports = $state<string[]>([]);
	const MAX_RECENT_AIRPORTS = 3;

	// Update common ZID airports to top 10 by operations
	const COMMON_AIRPORTS = [
		'CMH', // Columbus John Glenn International
		'CRW', // Yeager Airport (Charleston)
		'CVG', // Cincinnati/Northern Kentucky International
		'DAY', // Dayton International
		'HTS', // Huntington Tri-State
		'IND', // Indianapolis International
		'LEX', // Lexington Blue Grass
		'SDF' // Louisville Muhammad Ali International
	];

	// Update CHART_GROUPS to be more inclusive
	const CHART_GROUPS = {
		AIRPORT: {
			types: ['AD', 'APD', 'MIN'], // Added MIN (Minimums)
			color: 'border-blue-400',
			activeColor: 'bg-blue-400',
			hoverColor: 'hover:bg-blue-400 hover:bg-opacity-10'
		},
		'CHARTS SUPP': {
			types: ['CS', 'AFD'],
			color: 'border-gray-400',
			activeColor: 'bg-gray-400',
			hoverColor: 'hover:bg-gray-400 hover:bg-opacity-10'
		},
		APPROACHES: {
			types: ['IAP'],
			color: 'border-green-400',
			activeColor: 'bg-green-400',
			hoverColor: 'hover:bg-green-400 hover:bg-opacity-10'
		},
		DEPARTURES: {
			types: ['DP', 'SID'],
			color: 'border-purple-400',
			activeColor: 'bg-purple-400',
			hoverColor: 'hover:bg-purple-400 hover:bg-opacity-10'
		},
		ARRIVALS: {
			types: ['STAR'],
			color: 'border-orange-400',
			activeColor: 'bg-orange-400',
			hoverColor: 'hover:bg-orange-400 hover:bg-opacity-10'
		},
		OTHER: {
			types: [], // Empty array to catch all other types
			color: 'border-gray-400',
			activeColor: 'bg-gray-400',
			hoverColor: 'hover:bg-gray-400 hover:bg-opacity-10'
		}
	};

	let isDragging = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let translateX = $state(0);
	let translateY = $state(0);

	let currentRenderTask = $state<any>(null);
	let renderTimeout = $state<number | null>(null);
	let lastRenderedUrl = $state<string | null>(null);

	let isRendering = $state(false);
	let renderQueue = $state<string | null>(null);

	let pageToRender = $state(1);

	let wheelTimeout = $state<number | null>(null);
	let accumulatedDelta = $state(0);

	function isDarkMode() {
		return document.documentElement.classList.contains('dark');
	}

	async function getChartsForAirport(airport: string) {
		// Normalize the airport code by removing the K prefix if present
		const normalizedAirport = sayNoToKilo(airport.toUpperCase()) || airport.toUpperCase();

		// Check cache first using normalized code
		if (chartCache[normalizedAirport]) {
			return chartCache[normalizedAirport];
		}

		loading = true;
		try {
			const response = await fetch(`/api/charts/${normalizedAirport}`);
			if (response.ok) {
				const text = await response.text();
				if (!text) return [];
				try {
					const data = JSON.parse(text);
					// Cache the results using normalized code
					chartCache[normalizedAirport] = data;
					return data;
				} catch (e) {
					console.error('Failed to parse JSON:', e);
					return [];
				}
			}
			return [];
		} finally {
			loading = false;
		}
	}

	function updateRecentAirports(airportCode: string) {
		if (!airportCode) return;
		// Normalize the airport code
		const normalizedCode = sayNoToKilo(airportCode.toUpperCase()) || airportCode.toUpperCase();

		// Skip if this is a common airport - compare with normalized code
		if (COMMON_AIRPORTS.includes(normalizedCode)) return;

		// Only update if this airport isn't already in the list
		if (!recentAirports.includes(normalizedCode)) {
			const updated = [normalizedCode, ...recentAirports].slice(0, MAX_RECENT_AIRPORTS);
			recentAirports = updated;
			localStorage.setItem('recentAirports', JSON.stringify(updated));
		}
	}

	function removeFromHistory(airportCode: string) {
		recentAirports = recentAirports.filter((code) => code !== airportCode);
		localStorage.setItem('recentAirports', JSON.stringify(recentAirports));
	}

	// Modify the input handler to update chartState directly
	function handleAirportInput(event: Event) {
		const input = event.target as HTMLInputElement;
		// Store the raw input value
		chartState.lastAirport = input.value;
		handleInput();
	}

	async function handleInput() {
		// Skip if empty
		if (!chartState.lastAirport) {
			charts = [];
			return;
		}

		// Normalize for comparison and API calls, but don't update the input value
		const normalizedAirport =
			sayNoToKilo(chartState.lastAirport.toUpperCase()) || chartState.lastAirport.toUpperCase();

		// Skip if it's the same airport (compare normalized codes)
		if (charts.length > 0 && charts[0].chart_code.startsWith(normalizedAirport)) {
			return;
		}

		// If we have a selected chart from pins, just update the charts list
		if (selectedChart && chartState.pinnedCharts.includes(selectedChart)) {
			if (normalizedAirport.length > 2) {
				charts = await getChartsForAirport(normalizedAirport);
				if (charts.length > 0) {
					updateRecentAirports(normalizedAirport);
				}
			} else {
				charts = [];
			}
			return;
		}

		// Normal flow for non-pinned charts
		selectedChart = null;
		lastRenderedUrl = null;

		if (normalizedAirport.length > 2) {
			charts = await getChartsForAirport(normalizedAirport);
			if (charts.length > 0) {
				updateRecentAirports(normalizedAirport);

				// Check for last selected chart using normalized code
				const lastSelected = chartState.lastSelectedCharts[normalizedAirport];
				if (lastSelected) {
					handleChartSelect(lastSelected);
				} else {
					// If no last selected chart, try to find and select an APD chart
					const apdChart = charts.find((chart) => chart.chart_code.includes('APD'));
					if (apdChart) {
						handleChartSelect(apdChart);
					}
				}
			}
		} else {
			charts = [];
		}
	}

	function handleChartSelect(chart: Chart) {
		selectedChart = chart;

		// Initialize or load settings for this specific chart
		const settingsKey = getSettingsKey(chart.faa_ident, chart.chart_name);
		const settings = chartState.chartSettings[settingsKey] || {
			scale: 1,
			rotation: 0,
			translateX: 0,
			translateY: 0
		};

		// Apply the settings
		scale = settings.scale;
		rotation = settings.rotation;
		translateX = settings.translateX;
		translateY = settings.translateY;

		// Update canvas transform
		if (canvas) {
			canvas.style.transform = `translate(${translateX}px, ${translateY}px)`;
		}

		// Save the chart selection with the chart's own airport code
		const normalizedAirport = sayNoToKilo(chart.faa_ident) || chart.faa_ident;
		chartState.lastSelectedCharts[normalizedAirport] = chart;
	}

	// Single effect to handle both settings and rendering
	$effect(() => {
		if (selectedChart && canvas && !isRendering) {
			// Load settings using normalized airport code
			const normalizedAirport =
				sayNoToKilo(chartState.lastAirport.toUpperCase()) || chartState.lastAirport.toUpperCase();
			const settingsKey = getSettingsKey(selectedChart.faa_ident, selectedChart.chart_name);
			const settings = chartState.chartSettings[settingsKey] || {
				scale: 1,
				rotation: 0,
				translateX: 0,
				translateY: 0
			};

			// Apply settings
			scale = settings.scale;
			rotation = settings.rotation;
			translateX = settings.translateX;
			translateY = settings.translateY;

			if (canvas) {
				canvas.style.transform = `translate(${translateX}px, ${translateY}px)`;
			}

			// Handle rendering
			const url = selectedChart.pdf_path;
			if (url && url !== lastRenderedUrl) {
				isRendering = true;

				if (renderTimeout) {
					window.clearTimeout(renderTimeout);
				}

				renderTimeout = window.setTimeout(() => {
					renderPdf(url).finally(() => {
						lastRenderedUrl = url;
						isRendering = false;
					});
				}, 100);
			}
		}
	});

	async function renderPdf(url: string) {
		if (!canvas) return;
		const container = canvas.parentElement;
		if (!container) return;

		try {
			if (currentRenderTask) {
				await currentRenderTask.cancel();
				currentRenderTask = null;
			}

			currentPdfUrl = url;
			const proxyUrl = `/api/charts?url=${encodeURIComponent(url)}`;
			const loadingTask = pdfjs.getDocument(proxyUrl);
			const pdf = await loadingTask.promise;

			// Determine which page to render
			pageToRender = 1;

			// Only search through pages if it's a MIN document and we have an airport code
			if (selectedChart?.chart_code.includes('MIN') && selectedChart?.faa_ident) {
				const normalizedAirport =
					sayNoToKilo(selectedChart?.faa_ident?.toUpperCase()) ||
					selectedChart?.faa_ident?.toUpperCase();

				// Search through each page until we find the airport identifier
				for (let i = 1; i <= pdf.numPages; i++) {
					const page = await pdf.getPage(i);
					const textContent = await page.getTextContent();
					const pageText = textContent.items.map((item: any) => item.str).join(' ');

					if (pageText.includes(normalizedAirport)) {
						pageToRender = i;
						break;
					}
				}
			}

			const page = await pdf.getPage(pageToRender);
			const viewport = page.getViewport({ scale: 1, rotation });

			const containerWidth = container.clientWidth;
			const containerHeight = container.clientHeight;
			const scaleWidth = containerWidth / viewport.width;
			const scaleHeight = containerHeight / viewport.height;

			const baseScale = Math.min(scaleWidth, scaleHeight);
			const finalScale = baseScale * scale;

			const scaledViewport = page.getViewport({ scale: finalScale, rotation });

			canvas.width = scaledViewport.width;
			canvas.height = scaledViewport.height;

			const context = canvas.getContext('2d', { willReadFrequently: true });
			if (!context) return;

			currentRenderTask = page.render({
				canvasContext: context,
				viewport: scaledViewport
			});

			await currentRenderTask.promise;

			if (isDarkMode()) {
				const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
				const data = imageData.data;
				for (let i = 0; i < data.length; i += 4) {
					data[i] = 255 - data[i];
					data[i + 1] = 255 - data[i + 1];
					data[i + 2] = 255 - data[i + 2];
				}
				context.putImageData(imageData, 0, 0);
			}
		} catch (err) {
			if (err instanceof Error && err.name !== 'RenderingCancelled') {
				console.error('Failed to render PDF:', err);
			}
		} finally {
			currentRenderTask = null;
			currentPdfUrl = null;
		}
	}

	// Helper function to get the settings key - update to always normalize
	function getSettingsKey(airport: string, chartName: string): string {
		const normalizedAirport = sayNoToKilo(airport.toUpperCase()) || airport.toUpperCase();
		return `${normalizedAirport}_${chartName}`;
	}

	onMount(() => {
		// Make sure to set the worker before any PDF operations
		pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

		// Load recent airports
		const saved = localStorage.getItem('recentAirports');
		if (saved) {
			recentAirports = JSON.parse(saved);
		}

		// Load last accessed airport if it exists
		if (chartState.lastAirport) {
			handleInput();
		}

		// Watch for theme changes
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === 'class' && selectedChart) {
					renderPdf(selectedChart.pdf_path);
				}
			});
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});
	});

	// Update adjustZoom to use normalized airport code
	function adjustZoom(factor: number) {
		scale = Math.max(0.5, Math.min(3, scale * factor));
		if (selectedChart) {
			const normalizedAirport =
				sayNoToKilo(chartState.lastAirport.toUpperCase()) || chartState.lastAirport.toUpperCase();
			const settingsKey = getSettingsKey(normalizedAirport, selectedChart.chart_name);
			chartState.chartSettings[settingsKey] = {
				scale,
				rotation,
				translateX,
				translateY
			};
			renderPdf(selectedChart.pdf_path);
		}
	}

	// Update rotateChart to use normalized airport code
	function rotateChart(degrees: number) {
		rotation = (rotation + degrees) % 360;
		if (selectedChart) {
			const normalizedAirport =
				sayNoToKilo(chartState.lastAirport.toUpperCase()) || chartState.lastAirport.toUpperCase();
			const settingsKey = getSettingsKey(normalizedAirport, selectedChart.chart_name);
			chartState.chartSettings[settingsKey] = {
				scale,
				rotation,
				translateX,
				translateY
			};
			renderPdf(selectedChart.pdf_path);
		}
	}

	function handleMouseDown(event: MouseEvent) {
		if (!canvas) return;
		isDragging = true;
		startX = event.clientX - translateX;
		startY = event.clientY - translateY;
		// Ensure the canvas has the correct cursor
		canvas.style.cursor = 'grabbing';
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || !canvas) return;
		event.preventDefault(); // Prevent unwanted selections while dragging
		translateX = event.clientX - startX;
		translateY = event.clientY - startY;

		canvas.style.transform = `translate(${translateX}px, ${translateY}px)`;

		// Save position without re-rendering
		if (selectedChart) {
			const settingsKey = getSettingsKey(selectedChart.faa_ident, selectedChart.chart_name);
			chartState.chartSettings[settingsKey] = {
				scale,
				rotation,
				translateX,
				translateY
			};
		}
	}

	function handleMouseUp() {
		isDragging = false;
		if (canvas) {
			canvas.style.cursor = 'grab';
		}
	}

	function handleMouseLeave() {
		isDragging = false;
		if (canvas) {
			canvas.style.cursor = 'grab';
		}
	}

	function handleDoubleClick() {
		adjustZoom(1.25); // Same zoom factor as the zoom-in button
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();

		// Detect if it's likely a trackpad by checking deltaMode and if deltaX or deltaZ are present
		const isTrackpad = event.deltaMode === 0 && (event.deltaX !== 0 || event.deltaZ !== 0);

		// Accumulate the delta with different sensitivity for mouse wheel vs trackpad
		const sensitivity = isTrackpad ? 0.01 : 0.1;
		accumulatedDelta += event.deltaY * sensitivity;

		// Clear existing timeout
		if (wheelTimeout) {
			window.clearTimeout(wheelTimeout);
		}

		// Set new timeout
		wheelTimeout = window.setTimeout(
			() => {
				// Use a smaller base factor for smoother zooming
				const baseFactor = 1.02;
				// Calculate zoom factor based on accumulated delta
				const power = -accumulatedDelta;
				const zoomFactor = Math.pow(baseFactor, power);

				adjustZoom(zoomFactor);

				// Reset accumulated delta
				accumulatedDelta = 0;
				wheelTimeout = null;
			},
			isTrackpad ? 16 : 50
		); // Use shorter debounce for trackpad
	}

	function handlePinChart(chart: Chart) {
		if (!chartState.pinnedCharts) {
			chartState.pinnedCharts = [];
		}
		if (
			chartState.pinnedCharts.some(
				(c) => c.chart_name === chart.chart_name && c.faa_ident === chart.faa_ident
			)
		) {
			return;
		}
		chartState.pinnedCharts.push(chart);
	}

	function handleUnpinChart(chart: Chart) {
		chartState.pinnedCharts = chartState.pinnedCharts.filter(
			(c) => !(c.chart_name === chart.chart_name && c.faa_ident === chart.faa_ident)
		);
	}

	// Preload the next chart when hovering over a chart in the list
	function preloadChart(chart: Chart) {
		if (preloadLink && chart.pdf_path) {
			preloadLink.href = `/api/charts?url=${encodeURIComponent(chart.pdf_path)}`;
		}
	}

	// Cache rendered pages
	async function getRenderedPage(pdfDoc: any, pageNumber: number, chart: Chart): Promise<string> {
		const cacheKey = `${chart.pdf_path}_${pageNumber}`;

		if (chartState.renderedPages[cacheKey]) {
			return chartState.renderedPages[cacheKey];
		}

		const page = await pdfDoc.getPage(pageNumber);
		const viewport = page.getViewport({ scale: 1.5 });
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');

		canvas.height = viewport.height;
		canvas.width = viewport.width;

		await page.render({
			canvasContext: context,
			viewport: viewport
		}).promise;

		const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
		chartState.renderedPages[cacheKey] = dataUrl;

		// Limit cache size
		const maxCacheEntries = 20;
		const keys = Object.keys(chartState.renderedPages);
		if (keys.length > maxCacheEntries) {
			delete chartState.renderedPages[keys[0]];
		}

		return dataUrl;
	}
</script>

<svelte:head>
	<title>ICT - Charts</title>
</svelte:head>

<div
	class="flex h-[calc(100vh-theme(spacing.32))] w-full flex-col p-4 lg:mx-auto lg:max-w-screen-2xl"
>
	<!-- Top Navigation Bar -->
	<div class="mb-6 flex flex-col gap-4">
		<!-- Quick Access Bar -->
		<div class="flex flex-wrap items-center gap-x-6 gap-y-3">
			<!-- Common Airports -->
			<div class="flex flex-wrap items-center gap-2">
				{#each COMMON_AIRPORTS as code}
					{@const normalizedInput =
						sayNoToKilo(chartState.lastAirport.toUpperCase()) ||
						chartState.lastAirport.toUpperCase()}
					{@const normalizedCode = sayNoToKilo(code) || code}
					<button
						class="h-8 min-w-[64px] rounded-md border border-accent px-3 py-1 text-sm font-medium transition-colors hover:shadow-sm
							{normalizedCode === normalizedInput
							? 'bg-accent text-white dark:bg-accent-dark'
							: 'bg-surface text-content hover:bg-surface-secondary dark:bg-surface-dark dark:text-content-dark dark:hover:bg-surface-dark-secondary'}"
						onclick={() => {
							chartState.lastAirport = code;
							handleInput();
						}}>{code}</button
					>
				{/each}
			</div>

			<!-- Search Input with Recent Results -->
			<div
				class="flex items-center gap-2 border-l border-surface-tertiary pl-6 dark:border-surface-dark-tertiary"
			>
				<input
					id="airport-search"
					type="text"
					value={chartState.lastAirport}
					oninput={handleAirportInput}
					placeholder="Search airport..."
					class="w-48 rounded-md border border-accent bg-surface px-4 py-2 text-sm uppercase text-content transition-colors placeholder:text-content-tertiary focus:border-accent-secondary focus:outline-none dark:border-accent-dark dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary"
					style="text-transform: uppercase"
				/>

				<!-- Recent Airports -->
				{#if recentAirports.length > 0}
					<div class="flex items-center gap-2">
						<div class="flex flex-wrap gap-2">
							{#each recentAirports.filter((code) => !COMMON_AIRPORTS.includes(code)) as code}
								{@const normalizedInput =
									sayNoToKilo(chartState.lastAirport.toUpperCase()) ||
									chartState.lastAirport.toUpperCase()}
								{@const normalizedCode = sayNoToKilo(code) || code}
								<div class="group relative">
									<button
										class="flex h-8 items-center justify-between rounded-md border border-surface-tertiary px-3 py-1 text-sm transition-colors hover:shadow-sm
											{normalizedCode === normalizedInput
											? 'bg-accent text-white dark:bg-accent-dark'
											: 'bg-surface text-content-secondary hover:bg-surface-secondary dark:bg-surface-dark dark:text-content-dark-secondary dark:hover:bg-surface-dark-secondary'}"
										onclick={() => {
											chartState.lastAirport = code;
											handleInput();
										}}
									>
										<span>{code}</span>
										<span class="ml-2 inline-flex w-3 items-center">
											{#if normalizedCode !== normalizedInput}
												<a
													href={`/charts?remove=${code}`}
													onclick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														removeFromHistory(code);
													}}
													class="opacity-0 group-hover:opacity-100"
													title="Remove from history"
													aria-label={`Remove ${code} from history`}
												>
													<MdiIcon name="close" class="h-3 w-3" />
												</a>
											{/if}
										</span>
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Clear All Button -->
			<button
				onclick={() => {
					sessionStorage.clear();
					chartState = {
						lastAirport: '',
						chartCache: {},
						lastSelectedCharts: {},
						chartSettings: {},
						pinnedCharts: [],
						renderedPages: {}
					};
					charts = [];
					selectedChart = null;
					lastRenderedUrl = null;
					scale = 1;
					rotation = 0;
					translateX = 0;
					translateY = 0;
					recentAirports = [];
					localStorage.removeItem('recentAirports');
				}}
				class="ml-auto rounded-md border border-red-400 bg-surface px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-600 dark:bg-surface-dark dark:text-red-400 dark:hover:bg-red-950"
				title="Clear all saved charts and settings"
			>
				Clear All Settings
			</button>
		</div>
	</div>

	<div class="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[350px,1fr]">
		<!-- Left Column with Pinned and Grouped Charts -->
		<div class="flex min-h-0 flex-col gap-4">
			{#if sortedPinnedCharts && sortedPinnedCharts.length > 0}
				<!-- Pinned Charts Header -->
				<div class="group flex items-center gap-2">
					<h3 class="text-sm font-semibold text-content-secondary dark:text-content-dark-secondary">
						Pinned Charts
					</h3>
					<a
						href="/charts?clear-pins"
						onclick={(e) => {
							e.preventDefault();
							chartState.pinnedCharts = [];
						}}
						class="opacity-0 transition-opacity group-hover:opacity-100"
						title="Clear all pinned charts"
					>
						<MdiIcon
							name="close"
							class="h-4 w-4 text-content-tertiary hover:text-content dark:text-content-dark-tertiary dark:hover:text-content-dark"
						/>
					</a>
				</div>
				<!-- Pinned Charts Box -->
				<div
					class="h-1/3 overflow-y-auto rounded-lg bg-surface-secondary p-4 dark:bg-surface-dark-secondary"
				>
					<div class="grid grid-cols-3 gap-2">
						{#each sortedPinnedCharts as chart}
							{@const group = Object.entries(CHART_GROUPS).find(([_, { types }]) =>
								types.length === 0
									? !Object.values(CHART_GROUPS).some((g) =>
											g.types.some((t) => chart.chart_code.includes(t))
										)
									: types.some((type) => chart.chart_code.includes(type))
							)}
							{@const { color, activeColor, hoverColor } = group ? group[1] : CHART_GROUPS.OTHER}
							{@const isSelected =
								selectedChart?.chart_name === chart.chart_name &&
								selectedChart?.faa_ident === chart.faa_ident}
							<button
								class="group relative min-h-[48px] rounded-md border px-2 py-1.5 text-[10px] leading-tight transition-all hover:drop-shadow-sm
									{color} {isSelected
									? `${activeColor} text-white`
									: `bg-surface dark:bg-surface-dark ${hoverColor}`}"
								onclick={() => {
									handleChartSelect(chart);
								}}
							>
								<div
									class="absolute inset-0 left-0 flex w-6 items-center justify-center rounded-l-md text-[8px] font-semibold text-white
									{activeColor} dark:bg-opacity-75"
								>
									<span class="[writing-mode:vertical-lr]">{chart.faa_ident}</span>
								</div>
								<div class="ml-6 flex items-center justify-between">
									<span class="line-clamp-2">{chart.chart_name}</span>
									<a
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											handleUnpinChart(chart);
										}}
										aria-label="Unpin chart"
										tabindex="0"
										href={'/charts?unpin'}
										class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface opacity-0 shadow transition-opacity group-hover:opacity-100 dark:bg-surface-dark"
									>
										<MdiIcon name="pin-off" class="h-3 w-3 text-content dark:text-content-dark" />
									</a>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Airport Charts Header -->
			<h3 class="text-sm font-semibold text-content-secondary dark:text-content-dark-secondary">
				Airport Charts
			</h3>
			<!-- Airport Charts Box -->
			<div
				class="{chartState.pinnedCharts?.length
					? 'h-2/3'
					: 'h-full'} overflow-y-auto rounded-lg bg-surface-secondary p-4 dark:bg-surface-dark-secondary"
			>
				{#if charts.length > 0}
					<div class="grid grid-cols-3 gap-2">
						{#each sortedCharts as chart}
							{@const group = Object.entries(CHART_GROUPS).find(([_, { types }]) =>
								types.length === 0
									? !Object.values(CHART_GROUPS).some((g) =>
											g.types.some((t) => chart.chart_code.includes(t))
										)
									: types.some((type) => chart.chart_code.includes(type))
							)}
							{@const { color, activeColor, hoverColor } = group ? group[1] : CHART_GROUPS.OTHER}
							{@const isSelected =
								selectedChart?.chart_name === chart.chart_name &&
								selectedChart?.faa_ident === chart.faa_ident}
							<button
								onclick={() => handleChartSelect(chart)}
								class="group relative min-h-[48px] rounded-md border px-2 py-1.5 text-[10px] leading-tight transition-all hover:drop-shadow-sm
								{color} {isSelected
									? `${activeColor} text-white`
									: `bg-surface dark:bg-surface-dark ${hoverColor}`}"
								title={chart.chart_name}
							>
								<div class="line-clamp-2">{chart.chart_name}</div>
								{#if !sortedPinnedCharts.some((c) => c.chart_name == chart.chart_name && c.faa_ident == chart.faa_ident)}
									<a
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											handlePinChart(chart);
										}}
										aria-label="Pin chart"
										tabindex="0"
										href={'/charts?pin'}
										class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface opacity-0 shadow transition-opacity group-hover:opacity-100 dark:bg-surface-dark"
									>
										<MdiIcon name="pin" class="h-3 w-3 text-content dark:text-content-dark" />
									</a>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Chart Preview Area -->
		<div
			class="flex flex-col overflow-hidden rounded-lg border border-surface-tertiary bg-surface p-4 shadow-sm dark:border-surface-dark-tertiary dark:bg-surface-dark"
		>
			{#if loading}
				<div class="flex h-full items-center justify-center">
					<div class="relative h-12 w-12">
						<div
							class="absolute inset-0 animate-spin rounded-full border-4 border-accent/30 border-t-accent dark:border-accent-dark/30 dark:border-t-accent-dark"
						></div>
					</div>
				</div>
			{:else if selectedChart}
				<div class="flex h-full flex-col">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-bold text-content dark:text-content-dark">
							{selectedChart.chart_name}
						</h2>
						<div class="flex items-center gap-4">
							<!-- PDF Controls -->
							<div class="flex items-center gap-2">
								<button
									onclick={() => adjustZoom(0.8)}
									class="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
									title="Zoom Out"
									aria-label="Zoom Out"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M20 12H4"
										/>
									</svg>
								</button>
								<button
									onclick={() => adjustZoom(1.25)}
									class="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
									title="Zoom In"
									aria-label="Zoom In"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/>
									</svg>
								</button>
								<button
									onclick={() => rotateChart(90)}
									class="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
									title="Rotate"
									aria-label="Rotate Chart"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
								</button>
							</div>
							<a
								href={selectedChart.pdf_path +
									(selectedChart?.chart_code.includes('MIN') ? `#page=${pageToRender}` : '')}
								target="_blank"
								rel="noopener noreferrer"
								class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
							>
								Open PDF
							</a>
						</div>
					</div>
					<div
						class="relative flex-1 overflow-hidden rounded-lg bg-surface-secondary dark:bg-surface-dark-secondary"
						onwheel={handleWheel}
					>
						{#if isRendering}
							<div
								class="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-sm dark:bg-surface-dark/50"
							>
								<div class="relative h-12 w-12">
									<div
										class="absolute inset-0 animate-spin rounded-full border-4 border-accent/30 border-t-accent dark:border-accent-dark/30 dark:border-t-accent-dark"
									></div>
								</div>
							</div>
						{/if}
						<canvas
							bind:this={canvas}
							class="mx-auto cursor-grab active:cursor-grabbing"
							onmousedown={handleMouseDown}
							onmousemove={handleMouseMove}
							onmouseup={handleMouseUp}
							onmouseleave={handleMouseLeave}
							ondblclick={handleDoubleClick}
						></canvas>
					</div>
				</div>
			{:else}
				<div
					class="flex h-full items-center justify-center text-content-secondary dark:text-content-dark-secondary"
				>
					Select a chart to preview
				</div>
			{/if}
		</div>
	</div>
</div>
