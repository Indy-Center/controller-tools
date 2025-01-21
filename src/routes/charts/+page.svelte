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

	async function getChartsForAirport(airport: string) {
		loading = true;
		try {
			const response = await fetch(`/api/charts/${airport}`);
			if (response.ok) {
				const text = await response.text();
				if (!text) return [];
				try {
					const data = JSON.parse(text);
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
		const updated = [airportCode, ...recentAirports.filter((a) => a !== airportCode)].slice(
			0,
			MAX_RECENT_AIRPORTS
		);
		recentAirports = updated;
		localStorage.setItem('recentAirports', JSON.stringify(updated));
	}

	async function handleInput() {
		selectedChart = null;
		if (airport.length > 2) {
			charts = await getChartsForAirport(airport);
			if (charts.length > 0) {
				updateRecentAirports(airport);
			}
		} else {
			charts = [];
		}
	}

	function handleChartSelect(chart: Chart) {
		selectedChart = chart;
		scale = 1;
		rotation = 0;
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
		} catch (err) {
			console.error('Failed to render PDF:', err);
			currentPdfUrl = null; // Reset on error to allow retrying
		}
	}

	$effect(() => {
		if (selectedChart?.pdf_path && canvas) {
			const url = selectedChart.pdf_path;
			const currentScale = scale;
			const currentRotation = rotation;
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
	<h1 class="mb-4 text-center text-xl font-bold">Chart Browser</h1>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,2fr]">
		<!-- Left Column with Search and Chart List -->
		<div class="flex flex-col gap-4">
			<div>
				<label for="airport" class="mb-2 block text-sm font-medium text-gray-700">
					Enter Airport Identifier
				</label>
				<input
					id="airport"
					type="text"
					bind:value={airport}
					oninput={handleInput}
					placeholder="Enter ICAO code (e.g., KCMH)"
					class="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
							class="rounded-full bg-gray-100 px-3 py-1 text-sm transition-colors hover:bg-gray-200"
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
					class="h-[calc(100vh-320px)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
				>
					{#each Object.entries(charts.reduce((groups, chart) => {
							const type = chart.chart_code;
							if (!groups[type]) groups[type] = [];
							groups[type].push(chart);
							return groups;
						}, {})) as [chartType, typeCharts]}
						<div class="mb-6 last:mb-0">
							<h2 class="mb-2 text-sm font-semibold uppercase text-gray-600">{chartType}</h2>
							<div class="space-y-1">
								{#each typeCharts as chart}
									<button
										onclick={() => handleChartSelect(chart)}
										class="w-full rounded-md border px-3 py-2 text-left transition-colors hover:bg-gray-50
											{selectedChart === chart ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}"
									>
										<h3 class="text-sm font-medium">{chart.chart_name}</h3>
										<p class="text-xs text-gray-500">{chart.airport_name}</p>
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{:else if airport.length > 2}
				<p class="mt-4 text-center text-gray-600">No charts found for this airport.</p>
			{/if}
		</div>

		<!-- Chart Preview -->
		<div class="h-[calc(100vh-180px)] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
			{#if selectedChart}
				<div class="flex h-full flex-col">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-bold text-gray-800">{selectedChart.chart_name}</h2>
						<div class="flex items-center gap-4">
							<!-- PDF Controls -->
							<div class="flex items-center gap-2">
								<button
									onclick={() => adjustZoom(0.8)}
									class="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50"
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
									class="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50"
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
									class="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50"
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
					<div class="flex-1 overflow-auto rounded-lg bg-gray-50">
						<canvas bind:this={canvas} class="mx-auto" />
					</div>
				</div>
			{:else}
				<div class="flex h-full items-center justify-center text-gray-500">
					Select a chart to preview
				</div>
			{/if}
		</div>
	</div>
</div>
