<script lang="ts">
	import { onMount } from 'svelte';
	import * as pdfjs from 'pdfjs-dist';

	interface Chart {
		chart_name: string;
		chart_code: string;
		pdf_path: string;
		airport_name: string;
		city: string;
		state: string;
	}

	// Add new state for caching
	let chartCache = $state<Record<string, Chart[]>>({});
	let lastSelectedCharts = $state<Record<string, Chart>>({});

	let airport = $state('');
	let charts = $state<Chart[]>([]);
	let loading = $state(false);
	let selectedChart = $state<Chart | null>(null);

	let canvas = $state<HTMLCanvasElement>();
	let currentPdfUrl: string | null = $state(null);

	let scale = $state(1);
	let rotation = $state(0);
	let recentAirports = $state<string[]>([]);
	const MAX_RECENT_AIRPORTS = 5;

	function isDarkMode() {
		return document.documentElement.classList.contains('dark');
	}

	async function getChartsForAirport(airport: string) {
		// Check cache first
		if (chartCache[airport]) {
			return chartCache[airport];
		}

		loading = true;
		try {
			const response = await fetch(`/api/charts/${airport}`);
			if (response.ok) {
				const text = await response.text();
				if (!text) return [];
				try {
					const data = JSON.parse(text);
					// Cache the results
					chartCache[airport] = data;
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
		// Only update if this airport isn't already in the list
		if (!recentAirports.includes(airportCode)) {
			const updated = [airportCode, ...recentAirports].slice(0, MAX_RECENT_AIRPORTS);
			recentAirports = updated;
			localStorage.setItem('recentAirports', JSON.stringify(updated));
		}
	}

	async function handleInput() {
		selectedChart = null;
		if (airport.length > 2) {
			charts = await getChartsForAirport(airport);
			if (charts.length > 0) {
				updateRecentAirports(airport);

				// Restore only the last selected chart
				const lastSelected = lastSelectedCharts[airport];
				if (lastSelected) {
					selectedChart = lastSelected;
				}
			}
		} else {
			charts = [];
		}
	}

	function handleChartSelect(chart: Chart) {
		selectedChart = chart;
		// Only save the chart selection
		lastSelectedCharts[airport] = chart;
	}

	async function renderPdf(url: string) {
		if (!canvas) return;

		try {
			const proxyUrl = `/api/charts?url=${encodeURIComponent(url)}`;
			const loadingTask = pdfjs.getDocument(proxyUrl);
			const pdf = await loadingTask.promise;
			const page = await pdf.getPage(1);
			const viewport = page.getViewport({ scale: 1, rotation });

			const container = canvas.parentElement;
			if (!container) return;

			// Calculate scales to fit both width and height
			const containerWidth = container.clientWidth;
			const containerHeight = container.clientHeight;
			const scaleWidth = containerWidth / viewport.width;
			const scaleHeight = containerHeight / viewport.height;

			// Use the smaller scale to ensure the PDF fits both dimensions
			const baseScale = Math.min(scaleWidth, scaleHeight);
			const finalScale = baseScale * scale;

			const scaledViewport = page.getViewport({ scale: finalScale, rotation });

			canvas.width = scaledViewport.width;
			canvas.height = scaledViewport.height;

			const context = canvas.getContext('2d');
			if (!context) return;

			await page.render({
				canvasContext: context,
				viewport: scaledViewport
			}).promise;

			// Apply color inversion if in dark mode
			if (isDarkMode()) {
				const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
				const data = imageData.data;
				for (let i = 0; i < data.length; i += 4) {
					data[i] = 255 - data[i]; // Red
					data[i + 1] = 255 - data[i + 1]; // Green
					data[i + 2] = 255 - data[i + 2]; // Blue
					// Alpha stays the same
				}
				context.putImageData(imageData, 0, 0);
			}
		} catch (err) {
			console.error('Failed to render PDF:', err);
			currentPdfUrl = null;
		}
	}

	$effect(() => {
		if (selectedChart?.pdf_path && canvas) {
			const url = selectedChart.pdf_path;
			// Watch scale and rotation to trigger re-render when they change
			void scale;
			void rotation;
			renderPdf(url);
		}
	});

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

	function rotateChart(degrees: number) {
		console.log('Rotating chart by', degrees, 'degrees');
		rotation = (rotation + degrees) % 360;
	}

	function adjustZoom(factor: number) {
		console.log('Adjusting zoom by factor', factor);
		scale = Math.max(0.5, Math.min(3, scale * factor));
	}
</script>

<svelte:head>
	<title>ICCT - Charts</title>
</svelte:head>

<div class="w-full p-4 lg:mx-auto lg:max-w-screen-2xl">
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,2fr]">
		<!-- Left Column with Search and Chart List -->
		<div class="flex flex-col gap-4">
			<div>
				<label
					for="airport"
					class="mb-2 block text-sm font-medium text-content dark:text-content-dark"
				>
					Enter Airport Identifier
				</label>
				<input
					id="airport"
					type="text"
					bind:value={airport}
					oninput={handleInput}
					placeholder="Enter ICAO code (e.g., KCMH)"
					class="w-full rounded-lg border border-surface-tertiary bg-surface px-4 py-2 text-content outline-none focus:border-accent focus:ring-2 focus:ring-accent dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark"
				/>
			</div>

			<!-- Recent Airports -->
			{#if recentAirports.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each recentAirports as recentAirport}
						<button
							onclick={() => {
								airport = recentAirport;
								handleInput();
							}}
							class="rounded-full bg-surface-secondary px-3 py-1 text-sm text-content transition-colors hover:bg-surface-tertiary dark:bg-surface-dark-secondary dark:text-content-dark dark:hover:bg-surface-dark-tertiary"
						>
							{recentAirport}
						</button>
					{/each}
				</div>
			{/if}

			{#if loading}
				<div class="flex justify-center py-8">
					<div
						class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
					></div>
				</div>
			{:else if charts.length > 0}
				<!-- Chart List -->
				<div
					class="h-[calc(100vh-320px)] overflow-y-auto rounded-lg border border-surface-tertiary bg-surface p-4 shadow-sm dark:border-surface-dark-tertiary dark:bg-surface-dark"
				>
					{#each Object.entries(charts.reduce((groups, chart) => {
							const type = chart.chart_code;
							if (!groups[type]) groups[type] = [];
							groups[type].push(chart);
							return groups;
						}, {})) as [chartType, typeCharts]}
						<div class="mb-4 last:mb-0">
							<h2
								class="mb-2 text-sm font-semibold uppercase text-content-secondary dark:text-content-dark-secondary"
							>
								{chartType}
							</h2>
							<div class="space-y-1">
								{#each typeCharts as chart}
									<button
										onclick={() => handleChartSelect(chart)}
										class="w-full rounded-md border px-2 py-1.5 text-left transition-colors
											{selectedChart === chart
											? 'border-accent bg-accent-muted dark:border-accent-dark dark:bg-accent-dark-muted'
											: 'border-surface-tertiary hover:bg-surface-secondary dark:border-surface-dark-tertiary dark:hover:bg-surface-dark-secondary'}"
									>
										<h3 class="text-sm font-medium text-content dark:text-content-dark">
											{chart.chart_name}
										</h3>
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{:else if airport.length > 2}
				<p class="mt-4 text-center text-gray-600 dark:text-gray-400">
					No charts found for this airport.
				</p>
			{/if}
		</div>

		<!-- Chart Preview -->
		<div
			class="h-[calc(100vh-180px)] rounded-lg border border-surface-tertiary bg-surface p-4 shadow-sm dark:border-surface-dark-tertiary dark:bg-surface-dark"
		>
			{#if selectedChart}
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
						<canvas bind:this={canvas} class="mx-auto" />
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
