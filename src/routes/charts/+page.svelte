<script lang="ts">
	import { onMount } from 'svelte';
	import * as pdfjs from 'pdfjs-dist';
	import MdiClose from 'virtual:icons/mdi/close';
	import { sayNoToKilo } from '$lib/helpers';

	interface Chart {
		chart_name: string;
		chart_code: string;
		pdf_path: string;
		airport_name: string;
		city: string;
		state: string;
	}

	interface ChartSettings {
		scale: number;
		rotation: number;
		translateX: number;
		translateY: number;
	}

	// Add new state for caching
	let chartCache = $state<Record<string, Chart[]>>({});
	let lastSelectedCharts = $state<Record<string, Chart>>({});

	// Add new state for chart settings
	let chartSettings = $state<Record<string, ChartSettings>>({});

	let airport = $state('');
	let charts = $state<Chart[]>([]);
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
		'CVG', // Cincinnati/Northern Kentucky International
		'SDF', // Louisville Muhammad Ali International
		'IND', // Indianapolis International
		'LEX', // Lexington Blue Grass
		'CMH', // Columbus John Glenn International
		'DAY', // Dayton International
		'LUK', // Cincinnati Municipal Airport-Lunken Field
		'FWA', // Fort Wayne International
		'HTS', // Huntington Tri-State
		'BMG' // Bloomington Monroe County
	];

	// Update CHART_GROUPS order and types
	const CHART_GROUPS = {
		AIRPORT: {
			types: ['APD', 'AD'], // Airport Diagram
			color: 'border-blue-400',
			activeColor: 'bg-blue-400',
			hoverColor: 'hover:bg-blue-400 hover:bg-opacity-10'
		},
		'CHARTS SUPP': {
			types: ['CS'], // Charts Supplement
			color: 'border-gray-400',
			activeColor: 'bg-gray-400',
			hoverColor: 'hover:bg-gray-400 hover:bg-opacity-10'
		},
		APPROACHES: {
			types: ['IAP'], // Instrument Approach Procedures
			color: 'border-green-400',
			activeColor: 'bg-green-400',
			hoverColor: 'hover:bg-green-400 hover:bg-opacity-10'
		},
		DEPARTURES: {
			types: ['DP', 'SID'], // Departure Procedures / Standard Instrument Departure
			color: 'border-purple-400',
			activeColor: 'bg-purple-400',
			hoverColor: 'hover:bg-purple-400 hover:bg-opacity-10'
		},
		ARRIVALS: {
			types: ['STAR'], // Standard Terminal Arrival Routes
			color: 'border-orange-400',
			activeColor: 'bg-orange-400',
			hoverColor: 'hover:bg-orange-400 hover:bg-opacity-10'
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

	async function handleInput() {
		// Normalize the airport code
		const normalizedAirport = sayNoToKilo(airport.toUpperCase()) || airport.toUpperCase();

		// Skip if it's the same airport (compare normalized codes)
		if (charts.length > 0 && charts[0].chart_code.startsWith(normalizedAirport)) {
			return;
		}

		selectedChart = null;
		lastRenderedUrl = null;
		if (normalizedAirport.length > 2) {
			charts = await getChartsForAirport(normalizedAirport);
			if (charts.length > 0) {
				updateRecentAirports(normalizedAirport);

				// Restore only the last selected chart using normalized code
				const lastSelected = lastSelectedCharts[normalizedAirport];
				if (lastSelected) {
					selectedChart = lastSelected;
					// Restore settings for the last selected chart
					const settingsKey = getSettingsKey(normalizedAirport, lastSelected.chart_name);
					const settings = chartSettings[settingsKey] || {
						scale: 1,
						rotation: 0,
						translateX: 0,
						translateY: 0
					};
					scale = settings.scale;
					rotation = settings.rotation;
					translateX = settings.translateX;
					translateY = settings.translateY;

					if (canvas) {
						canvas.style.transform = `translate(${translateX}px, ${translateY}px)`;
					}
				}
			}
		} else {
			charts = [];
		}
	}

	function handleChartSelect(chart: Chart) {
		selectedChart = chart;
		// Save the chart selection with normalized airport code
		const normalizedAirport = sayNoToKilo(airport.toUpperCase()) || airport.toUpperCase();
		lastSelectedCharts[normalizedAirport] = chart;
	}

	// Single effect to handle both settings and rendering
	$effect(() => {
		if (selectedChart && canvas && !isRendering) {
			// Load settings using normalized airport code
			const normalizedAirport = sayNoToKilo(airport.toUpperCase()) || airport.toUpperCase();
			const settingsKey = getSettingsKey(normalizedAirport, selectedChart.chart_name);
			const settings = chartSettings[settingsKey] || {
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
			const page = await pdf.getPage(1);
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
			if (err?.name !== 'RenderingCancelled') {
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
		const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
		pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

		// Load recent airports
		const saved = localStorage.getItem('recentAirports');
		if (saved) {
			recentAirports = JSON.parse(saved);
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
			const normalizedAirport = sayNoToKilo(airport.toUpperCase()) || airport.toUpperCase();
			const settingsKey = getSettingsKey(normalizedAirport, selectedChart.chart_name);
			chartSettings[settingsKey] = {
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
			const normalizedAirport = sayNoToKilo(airport.toUpperCase()) || airport.toUpperCase();
			const settingsKey = getSettingsKey(normalizedAirport, selectedChart.chart_name);
			chartSettings[settingsKey] = {
				scale,
				rotation,
				translateX,
				translateY
			};
			renderPdf(selectedChart.pdf_path);
		}
	}

	function handleMouseDown(event: MouseEvent) {
		isDragging = true;
		startX = event.clientX - translateX;
		startY = event.clientY - translateY;
	}

	// Update handleMouseMove to use normalized airport code
	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;
		translateX = event.clientX - startX;
		translateY = event.clientY - startY;
		if (canvas) {
			canvas.style.transform = `translate(${translateX}px, ${translateY}px)`;
		}
		// Save position without re-rendering
		if (selectedChart) {
			const normalizedAirport = sayNoToKilo(airport.toUpperCase()) || airport.toUpperCase();
			const settingsKey = getSettingsKey(normalizedAirport, selectedChart.chart_name);
			chartSettings[settingsKey] = {
				scale,
				rotation,
				translateX,
				translateY
			};
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleDoubleClick() {
		adjustZoom(1.25); // Same zoom factor as the zoom-in button
	}
</script>

<svelte:head>
	<title>ICCT - Charts</title>
</svelte:head>

<div
	class="flex h-[calc(100vh-theme(spacing.32))] w-full flex-col p-4 lg:mx-auto lg:max-w-screen-2xl"
>
	<!-- Top Navigation Bar -->
	<div class="mb-4 flex items-center gap-4">
		<!-- Search Input -->
		<div class="w-48">
			<input
				type="text"
				bind:value={airport}
				oninput={handleInput}
				placeholder="Search airport..."
				class="w-full rounded-md border border-accent bg-surface px-4 py-2 text-sm uppercase text-content transition-colors placeholder:text-content-tertiary focus:border-accent-secondary focus:outline-none dark:border-accent-dark dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary"
				style="text-transform: uppercase"
			/>
		</div>

		<!-- Recent Airports -->
		{#if recentAirports.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each recentAirports.filter((code) => !COMMON_AIRPORTS.includes(code)) as code}
					{@const normalizedInput = sayNoToKilo(airport.toUpperCase()) || airport.toUpperCase()}
					{@const normalizedCode = sayNoToKilo(code) || code}
					<div class="group relative">
						<button
							class="flex h-8 min-w-[64px] items-center justify-between rounded-md border border-accent px-3 py-1.5 text-xs uppercase transition-colors hover:shadow-sm
								{normalizedCode === normalizedInput
								? 'bg-accent text-white dark:bg-accent-dark'
								: 'bg-surface text-content-secondary hover:bg-surface-secondary dark:bg-surface-dark dark:text-content-dark-secondary dark:hover:bg-surface-dark-secondary'}"
							onclick={() => {
								airport = code;
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
										<MdiClose class="h-3 w-3" />
									</a>
								{/if}
							</span>
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Common Airports -->
		<div class="ml-auto flex flex-wrap gap-2">
			{#each COMMON_AIRPORTS as code}
				{@const normalizedInput = sayNoToKilo(airport.toUpperCase()) || airport.toUpperCase()}
				{@const normalizedCode = sayNoToKilo(code) || code}
				<button
					class="rounded-md border border-accent px-4 py-2 text-sm transition-colors hover:shadow-sm
						{normalizedCode === normalizedInput
						? 'bg-accent text-white dark:bg-accent-dark'
						: 'bg-surface text-content hover:bg-surface-secondary dark:bg-surface-dark dark:text-content-dark dark:hover:bg-surface-dark-secondary'}"
					onclick={() => {
						airport = code;
						handleInput();
					}}>{code}</button
				>
			{/each}
		</div>
	</div>

	<div class="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[300px,1fr]">
		<!-- Left Sidebar with Grouped Charts -->
		<div class="flex flex-col gap-4 overflow-y-auto">
			{#if charts.length > 0}
				<div class="grid grid-cols-3 gap-2">
					{#each Object.entries(CHART_GROUPS) as [groupName, { types, color, activeColor, hoverColor }]}
						{#each charts.filter( (chart) => types.some( (type) => chart.chart_code.includes(type) ) ) as chart}
							{@const isSelected =
								chart.chart_name === selectedChart?.chart_name ||
								chart.chart_name === lastSelectedCharts[airport]?.chart_name}
							<button
								onclick={() => handleChartSelect(chart)}
								class="min-h-[48px] rounded-md border px-2 py-1.5 text-[10px] leading-tight transition-all hover:drop-shadow-sm
									{color}
									{isSelected
									? `${activeColor} text-white shadow-sm`
									: `bg-surface ${hoverColor} dark:bg-surface-dark`}"
								title={chart.chart_name}
							>
								<div class="line-clamp-2">{chart.chart_name}</div>
							</button>
						{/each}
					{/each}
				</div>
			{/if}
		</div>

		<!-- Chart Preview Area -->
		<div
			class="flex flex-col overflow-hidden rounded-lg border border-surface-tertiary bg-surface p-4 shadow-sm dark:border-surface-dark-tertiary dark:bg-surface-dark"
		>
			{#if loading}
				<div class="flex justify-center py-8">
					<div
						class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
					></div>
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
								href={selectedChart.pdf_path}
								target="_blank"
								rel="noopener noreferrer"
								class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
							>
								Open PDF
							</a>
						</div>
					</div>
					<div
						class="flex-1 overflow-auto rounded-lg bg-surface-secondary dark:bg-surface-dark-secondary"
					>
						<canvas
							bind:this={canvas}
							class="mx-auto cursor-grab active:cursor-grabbing"
							onmousedown={handleMouseDown}
							onmousemove={handleMouseMove}
							onmouseup={handleMouseUp}
							onmouseleave={handleMouseUp}
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
