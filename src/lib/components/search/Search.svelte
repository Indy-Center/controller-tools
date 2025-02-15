<script lang="ts">
	import Modal from '$lib/Modal.svelte';
	import MdiIcon from '../MdiIcon.svelte';

	let modal = $state<{ open: () => void; close: () => void }>();
	let searchQuery = $state('');
	let searchResults = $state<any[]>([]);
	let isLoading = $state(false);
	let searchTimeout: NodeJS.Timeout;

	type Navaid = {
		ind: number;
		id: string;
		type: string;
		name: string;
		state: string;
		country: string;
		lat: number;
		lon: number;
		elev: number;
		freq: number;
		mag_dec: string;
	};

	// Update the Airport type to include new fields
	type Airport = {
		id: string;
		icaoId: string;
		iataId: string;
		faaId: string;
		name: string;
		state: string;
		country: string;
		lat: number;
		lon: number;
		elev: number;
		magdec: string;
		runways: {
			id: string;
			dimension: string;
			surface: string;
			alignment: number;
		}[];
		services: string;
		tower: string;
		beacon: string;
		freqs: string;
	};

	// Airline
	type Airline = {
		company: string;
		country: string;
		telephony: string;
		code: string;
	};

	// Aircraft
	type Aircraft = {
		code: string;
		class: string;
		numberOfEngines: number;
		engineType: string;
		manufacturer: string;
		model: string;
	};

	// Add Chart type
	type Chart = {
		chart_name: string;
		chart_code: string;
		pdf_path: string;
		airport_name: string;
		city: string;
		state: string;
		faa_ident: string;
	};

	// Update SearchResult type to include charts group
	type SearchResult = {
		type: 'airport' | 'navaid' | 'airline' | 'aircraft' | 'charts';
		title: string;
		subtitle?: string;
		details?: {
			type?: string;
			frequency?: string;
			latitude?: string;
			longitude?: string;
			elevation?: number;
			location?: string;
			magnetic_variation?: string;
			numberOfEngines?: number;
			engineType?: string;
			class?: string;
			telephony?: string;
			faa_ident?: string;
			chart_count?: number;
			filtered_count?: number;
			filter_terms?: string[];
			nested_charts?: { name: string; code: string }[];
		};
	};

	// Add this after the SearchResult type definition
	function getPriorityScore(result: SearchResult, query: string): number {
		const normalizedQuery = query.toUpperCase();
		let score = 0;

		// Exact matches get highest priority
		if (result.title.toUpperCase().startsWith(normalizedQuery)) score += 100;

		// For 3-letter queries (likely airline codes)
		if (normalizedQuery.length === 3) {
			// Check if it matches an airline code
			if (result.type === 'airline' && result.title.includes(`- ${normalizedQuery}`)) {
				score += 200;
			}
			// Check if it matches a navaid
			if (result.type === 'navaid' && result.title.startsWith(normalizedQuery)) {
				score += 150;
			}
		}

		// For 4-letter queries (likely airport codes)
		if (normalizedQuery.length === 4) {
			// Check if it matches an airport code
			if (result.type === 'airport' && result.title.startsWith(normalizedQuery)) {
				score += 200;
			}
			// For charts, prioritize exact airport matches
			if (result.type === 'charts' && result.details?.faa_ident === normalizedQuery) {
				score += 250;
			}
		}

		// Type-based priority
		switch (result.type) {
			case 'airline':
				score += 50;
				// Bonus for matching telephony
				if (result.details?.telephony?.toUpperCase().includes(normalizedQuery)) {
					score += 75;
				}
				break;
			case 'airport':
				score += 40;
				break;
			case 'navaid':
				score += 30;
				break;
			case 'aircraft':
				score += 20;
				break;
			case 'charts':
				score += 60; // Higher base priority for charts
				// Bonus for matching filter terms
				if (result.details?.filter_terms?.some((term) => normalizedQuery.includes(term))) {
					score += 100;
				}
				break;
		}

		return score;
	}

	// Function to handle keyboard shortcut (/)
	function handleKeydown(event: KeyboardEvent) {
		// Don't trigger if user is typing in an input or textarea
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}

		if (event.key === '/') {
			event.preventDefault();
			modal?.open();
		}
	}

	// Add chart cache
	let chartCache: Record<string, Chart[]> = {};

	// Update handleSearch to group charts
	async function handleSearch() {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}

		if (searchQuery.trim().length < 3) {
			return;
		}

		searchTimeout = setTimeout(async () => {
			isLoading = true;
			try {
				const [searchResponse, chartsResponse] = await Promise.all([
					fetch(`/api/search?search=${encodeURIComponent(searchQuery.toUpperCase())}`),
					fetchChartsForQuery(searchQuery)
				]);

				const { airports, navaids, airlines, aircraft } = await searchResponse.json();
				const charts = chartsResponse;

				// Process existing results...
				const navaidResults: SearchResult[] = Array.isArray(navaids)
					? navaids.map((navaid: Navaid) => ({
							type: 'navaid',
							title: `${navaid.id} - ${navaid.name}`,
							details: {
								type: formatNavaidType(navaid.type),
								frequency: navaid.freq ? `${navaid.freq.toFixed(1)} MHz` : 'N/A'
							}
						}))
					: [];

				const airportResults: SearchResult[] = Array.isArray(airports)
					? airports.map((airport: Airport) => ({
							type: 'airport',
							title: `${airport.icaoId} - ${airport.name}`,
							subtitle: formatRunways(airport.runways),
							details: {
								type: airport.tower === 'T' ? 'Towered' : 'Non-Towered'
							}
						}))
					: [];

				const airlineResults: SearchResult[] = Array.isArray(airlines)
					? airlines.map((airline: Airline) => ({
							type: 'airline',
							title: `${airline.company} - ${airline.code}`,
							details: {
								telephony: airline.telephony,
								location: airline.country
							}
						}))
					: [];

				const aircraftResults: SearchResult[] = Array.isArray(aircraft)
					? aircraft.map((aircraft: Aircraft) => ({
							type: 'aircraft',
							title: `${aircraft.manufacturer}: ${aircraft.model} - ${aircraft.code}`,
							details: {
								numberOfEngines: aircraft.numberOfEngines,
								engineType: aircraft.engineType
							}
						}))
					: [];

				// Process charts into a single grouped result or individual results
				let chartResults: SearchResult[] = [];
				if (Array.isArray(charts) && charts.length > 0) {
					const words = searchQuery.trim().toUpperCase().split(/\s+/);
					const airportCode = words.find((word) => word.length >= 3 && word.length <= 4);
					const filterTerms = words.filter((word) => word !== airportCode);

					const filteredCharts =
						filterTerms.length > 0
							? filterCharts(
									charts,
									words.filter((word) => word !== airportCode)
								)
							: charts;

					// Create a single result with nested charts if we have 10 or fewer
					if (filteredCharts.length <= 10 && filteredCharts.length > 0) {
						chartResults = [
							{
								type: 'charts',
								title: `${airportCode} - Charts`,
								subtitle:
									filterTerms.length > 0 ? `Filtered by: ${filterTerms.join(', ')}` : undefined,
								details: {
									faa_ident: airportCode,
									chart_count: charts.length,
									filtered_count: filteredCharts.length,
									filter_terms: filterTerms,
									nested_charts: filteredCharts.map((chart) => ({
										name: chart.chart_name,
										code: chart.chart_code,
										pdf_path: chart.pdf_path
									}))
								}
							}
						];
					} else {
						// Otherwise show the grouped result
						chartResults = [
							{
								type: 'charts',
								title: `${airportCode} - Charts`,
								subtitle:
									filterTerms.length > 0 ? `Filtered by: ${filterTerms.join(', ')}` : undefined,
								details: {
									faa_ident: airportCode,
									chart_count: charts.length,
									filtered_count: filteredCharts.length,
									filter_terms: filterTerms
								}
							}
						];
					}
				}

				// Combine and sort results using the priority score
				searchResults = [
					...navaidResults,
					...airportResults,
					...airlineResults,
					...aircraftResults,
					...chartResults
				].sort((a, b) => getPriorityScore(b, searchQuery) - getPriorityScore(a, searchQuery));
			} catch (error) {
				console.error('Search error:', error);
				searchResults = [];
			} finally {
				isLoading = false;
			}
		}, 300);
	}

	// Add function to fetch charts
	async function fetchChartsForQuery(query: string): Promise<Chart[]> {
		const words = query.trim().toUpperCase().split(/\s+/);

		// Try to find an airport code (usually 3-4 letters)
		const airportCode = words.find((word) => word.length >= 3 && word.length <= 4);

		if (!airportCode) return [];

		// Check cache first
		if (chartCache[airportCode]) {
			const charts = chartCache[airportCode];
			// Filter charts if there are additional search terms
			if (words.length > 1) {
				return filterCharts(
					charts,
					words.filter((word) => word !== airportCode)
				);
			}
			return charts;
		}

		try {
			const response = await fetch(`/api/charts/${airportCode}`);
			if (!response.ok) return [];

			const charts = await response.json();
			chartCache[airportCode] = charts;

			// Filter charts if there are additional search terms
			if (words.length > 1) {
				return filterCharts(
					charts,
					words.filter((word) => word !== airportCode)
				);
			}
			return charts;
		} catch (error) {
			console.error('Error fetching charts:', error);
			return [];
		}
	}

	// Add helper function to filter charts
	function filterCharts(charts: Chart[], terms: string[]): Chart[] {
		if (!terms.length) return charts;

		return charts.filter((chart: Chart) => {
			// Convert everything to uppercase for comparison
			const chartName = chart.chart_name.toUpperCase();
			const chartCode = chart.chart_code.toUpperCase();

			return terms.every((term) => {
				// Special handling for RNAV
				if (term === 'RNAV') {
					return (
						chartName.includes('RNAV') || chartName.includes('RNP') || chartName.includes('GPS')
					);
				}

				// Special handling for common chart types
				switch (term) {
					case 'APP':
					case 'APPROACH':
						return chartCode === 'IAP';
					case 'DEP':
					case 'DEPARTURE':
						return chartCode === 'DP';
					case 'ARR':
					case 'ARRIVAL':
						return chartCode === 'STAR';
					case 'DIAGRAM':
						return chartCode === 'APD';
					default:
						// For other terms, check both name and code
						return chartName.includes(term) || chartCode.includes(term);
				}
			});
		});
	}

	// Update handleChartSelect for both grouped and individual charts
	function handleChartSelect(result: SearchResult, nestedChart?: { name: string; code: string }) {
		if (result.type === 'charts' && result.details?.faa_ident) {
			const url = new URL('/charts', window.location.origin);
			url.searchParams.set('airport', result.details.faa_ident);

			// If we have a specific nested chart selected, use its name for unique identification
			if (nestedChart) {
				url.searchParams.set('name', nestedChart.name);
			}

			window.location.href = url.toString();
		}
	}

	// Add helper function if it's missing
	function formatNavaidType(type: string): string {
		const types: Record<string, string> = {
			VOR: 'VOR',
			DME: 'DME',
			NDB: 'Non-Directional Beacon',
			VORTAC: 'VORTAC',
			TACAN: 'TACAN'
		};
		return types[type] || type;
	}

	// Helper functions
	function formatRunways(runways: Airport['runways']): string {
		return runways
			.map((rwy) => {
				const [length, width] = rwy.dimension.split('x');
				const surface = formatSurface(rwy.surface);
				return `${rwy.id} (${length}'×${width}' ${surface})`;
			})
			.join(' • ');
	}

	function formatSurface(surface: string): string {
		const surfaces: Record<string, string> = {
			A: 'Asphalt',
			C: 'Concrete',
			G: 'Gravel',
			T: 'Turf',
			D: 'Dirt',
			W: 'Water',
			S: 'Snow',
			M: 'Mixed'
		};
		return surfaces[surface] || surface;
	}

	function formatFrequencies(freqs: string): string {
		if (!freqs) return 'N/A';
		return freqs
			.split(';')
			.map((freq) => {
				const [name, value] = freq.split(',');
				return `${name}: ${value} MHz`;
			})
			.join(' • ');
	}

	// Add a custom action to focus the input
	function focusOnShow(node: HTMLInputElement) {
		const focus = () => {
			setTimeout(() => node.focus(), 50);
		};

		// Just call focus directly
		focus();

		return {
			update: (modalOpen: boolean) => {
				if (modalOpen) focus();
			}
		};
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<!-- Search trigger button -->
<button
	onclick={() => modal?.open()}
	class="flex items-center gap-1.5 rounded-md border border-surface-tertiary px-2 py-1 text-xs text-content-secondary transition-colors hover:border-accent hover:text-content dark:border-surface-dark-tertiary dark:text-content-dark-secondary dark:hover:border-accent-dark dark:hover:text-content-dark"
>
	<MdiIcon name="magnify" class="h-3.5 w-3.5" />
	<span class="hidden md:block">Search</span>
	<kbd
		class="hidden rounded bg-surface px-1 text-[10px] text-content-tertiary md:block dark:bg-surface-dark dark:text-content-dark-tertiary"
		>/</kbd
	>
</button>

<!-- Search Modal -->
<Modal bind:this={modal} title="Search">
	<div class="flex w-full flex-col gap-4">
		<!-- Search input -->
		<div class="relative w-full">
			<MdiIcon
				name="magnify"
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary dark:text-content-dark-secondary"
			/>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Type to search..."
				oninput={handleSearch}
				class="w-full rounded-md border border-surface-tertiary bg-surface px-4 py-2 pl-10 text-sm uppercase outline-none placeholder:text-content-tertiary focus:border-accent dark:border-surface-dark-tertiary dark:bg-surface-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark"
				autofocus
				use:focusOnShow
			/>
		</div>

		<!-- Search results -->
		<div class="max-h-[70vh] w-full overflow-y-auto">
			{#if isLoading}
				<div class="flex items-center justify-center py-4">
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent dark:border-accent-dark"
					></div>
				</div>
			{:else if searchResults.length === 0}
				<div
					class="py-4 text-center text-sm text-content-secondary dark:text-content-dark-secondary"
				>
					{searchQuery ? 'No results found' : 'Type to search...'}
				</div>
			{:else}
				<div
					class="flex flex-col divide-y divide-surface-tertiary dark:divide-surface-dark-tertiary"
				>
					{#each searchResults as result}
						<div
							class="group cursor-pointer p-3 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary"
							onclick={() => handleChartSelect(result)}
						>
							<div class="flex items-start gap-3">
								<!-- Icon -->
								<div class="mt-0.5">
									{#if result.type === 'navaid'}
										<MdiIcon name="radio-tower" class="h-4 w-4 text-accent dark:text-accent-dark" />
									{:else if result.type === 'airport'}
										<svg class="h-4 w-4 text-accent dark:text-accent-dark" viewBox="0 0 24 24">
											<path
												fill="currentColor"
												d="M12,15C12.81,15 13.5,14.31 13.5,13.5C13.5,12.69 12.81,12 12,12C11.19,12 10.5,12.69 10.5,13.5C10.5,14.31 11.19,15 12,15M12,2C14.75,2 17.1,3 19.05,4.95C20.9,6.8 22,9.05 22,12C22,14.95 20.9,17.2 19.05,19.05C17.1,21 14.75,22 12,22C9.25,22 6.9,21 4.95,19.05C3.1,17.2 2,14.95 2,12C2,9.05 3.1,6.8 4.95,4.95C6.9,3 9.25,2 12,2M12,4C9.8,4 7.95,4.8 6.45,6.3C4.95,7.8 4.15,9.65 4.15,11.85C4.15,14.05 4.95,15.9 6.45,17.4C7.95,18.9 9.8,19.7 12,19.7C14.2,19.7 16.05,18.9 17.55,17.4C19.05,15.9 19.85,14.05 19.85,11.85C19.85,9.65 19.05,7.8 17.55,6.3C16.05,4.8 14.2,4 12,4Z"
											/>
										</svg>
									{:else if result.type === 'airline'}
										<MdiIcon
											name="shield-airplane"
											class="h-4 w-4 text-accent dark:text-accent-dark"
										/>
									{:else if result.type === 'aircraft'}
										<MdiIcon
											name="airplane-search"
											class="h-4 w-4 text-accent dark:text-accent-dark"
										/>
									{:else if result.type === 'charts'}
										<MdiIcon
											name="file-document"
											class="h-4 w-4 text-accent dark:text-accent-dark"
										/>
									{/if}
								</div>

								<!-- Content -->
								<div class="flex-1">
									<div class="text-sm font-medium">{result.title}</div>
									{#if result.details}
										<div class="mt-1 space-y-2 text-xs">
											<!-- Primary Details -->
											<div class="text-content-secondary dark:text-content-dark-secondary">
												{#if result.type === 'airport'}
													{result.details.type || 'Non-Towered'}
													<!-- Runways -->
													<div class="mt-1.5 flex flex-wrap gap-1.5">
														{#each result.subtitle
															?.split(' • ')
															.filter((r: string) => r.includes('(')) || [] as runway}
															<div
																class="rounded bg-surface-secondary px-2 py-0.5 dark:bg-surface-dark-secondary"
															>
																{#if runway.includes('(')}
																	{@const [id, specs] = runway.split('(')}
																	<span class="font-medium">{id}</span>
																	<span
																		class="text-content-secondary dark:text-content-dark-secondary"
																		>({specs}</span
																	>
																{:else}
																	{runway}
																{/if}
															</div>
														{/each}
													</div>
												{:else if result.type === 'navaid' && result.details.frequency}
													{result.details.frequency}
												{:else if result.type === 'airline'}
													{#if result.details.telephony}
														<span class="font-medium">{result.details.telephony}</span>
														{#if result.details.location}
															• {result.details.location}{/if}
													{/if}
												{:else if result.type === 'aircraft'}
													{#if result.details.numberOfEngines}
														{result.details.numberOfEngines}-Engine
														{#if result.details.engineType}
															{result.details.engineType}{/if}
													{/if}
												{:else if result.type === 'charts'}
													<div class="flex flex-col gap-2">
														{#if result.details?.nested_charts}
															<!-- Individual charts list -->
															<div class="flex flex-col gap-1.5">
																{#each result.details.nested_charts as chart}
																	<div class="group/chart flex items-center gap-2">
																		<button
																			class="flex flex-1 items-center gap-2 rounded px-2 py-1 text-left transition-colors hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary"
																			onclick={(e) => {
																				e.stopPropagation();
																				handleChartSelect(result, chart);
																			}}
																		>
																			<span
																				class="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium dark:bg-surface-dark-secondary"
																			>
																				{chart.code}
																			</span>
																			<span
																				class="flex-1 transition-colors group-hover/chart:text-content dark:group-hover/chart:text-content-dark"
																				>{chart.name}</span
																			>
																		</button>
																		<a
																			href={chart.pdf_path}
																			target="_blank"
																			rel="noopener noreferrer"
																			class="flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-surface-secondary group-hover/chart:opacity-100 dark:hover:bg-surface-dark-secondary"
																			onclick={(e) => e.stopPropagation()}
																			title="Open PDF in new tab"
																		>
																			<MdiIcon
																				name="open-in-new"
																				class="h-3.5 w-3.5 text-content-secondary dark:text-content-dark-secondary"
																			/>
																		</a>
																	</div>
																{/each}
															</div>
														{:else}
															<!-- Grouped charts display -->
															<div
																class="text-xs text-content-secondary dark:text-content-dark-secondary"
															>
																{#if result.details?.filtered_count === result.details?.chart_count}
																	{result.details.chart_count} charts available
																{:else}
																	{result.details?.filtered_count} of {result.details?.chart_count} charts
																	match filter
																{/if}
																{#if result.subtitle}
																	<div class="mt-1 flex flex-wrap gap-1">
																		{#each result.details?.filter_terms || [] as term}
																			<span
																				class="rounded bg-surface-secondary px-2 py-0.5 dark:bg-surface-dark-secondary"
																			>
																				{term}
																			</span>
																		{/each}
																	</div>
																{/if}
															</div>
														{/if}
													</div>
												{/if}
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</Modal>
