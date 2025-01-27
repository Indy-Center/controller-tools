<script lang="ts">
	import Modal from '$lib/Modal.svelte';
	import MdiMagnify from 'virtual:icons/mdi/magnify';
	import MdiRadioTower from 'virtual:icons/mdi/radio-tower';
	import MdiShieldAirplane from 'virtual:icons/mdi/shield-airplane';
	import MdiAirplaneSearch from 'virtual:icons/mdi/airplane-search';

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

	// Update search results type to handle both
	type SearchResult = {
		type: 'airport' | 'navaid' | 'airline' | 'aircraft';
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
				const response = await fetch(
					`/api/search?search=${encodeURIComponent(searchQuery.toUpperCase())}`
				);
				const { airports, navaids, airlines, aircraft } = await response.json();

				// Process navaid results
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

				// Process airport results
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

				// Process airline results
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

				// Process aircraft results
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

				// Combine and sort results using the priority score
				searchResults = [
					...navaidResults,
					...airportResults,
					...airlineResults,
					...aircraftResults
				].sort((a, b) => getPriorityScore(b, searchQuery) - getPriorityScore(a, searchQuery));
			} catch (error) {
				console.error('Search error:', error);
				searchResults = [];
			} finally {
				isLoading = false;
			}
		}, 300);
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
	<MdiMagnify class="h-3.5 w-3.5" />
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
			<MdiMagnify
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
						>
							<div class="flex items-start gap-3">
								<!-- Icon -->
								<div class="mt-0.5">
									{#if result.type === 'navaid'}
										<MdiRadioTower class="h-4 w-4 text-accent dark:text-accent-dark" />
									{:else if result.type === 'airport'}
										<svg class="h-4 w-4 text-accent dark:text-accent-dark" viewBox="0 0 24 24">
											<path
												fill="currentColor"
												d="M12,15C12.81,15 13.5,14.31 13.5,13.5C13.5,12.69 12.81,12 12,12C11.19,12 10.5,12.69 10.5,13.5C10.5,14.31 11.19,15 12,15M12,2C14.75,2 17.1,3 19.05,4.95C20.9,6.8 22,9.05 22,12C22,14.95 20.9,17.2 19.05,19.05C17.1,21 14.75,22 12,22C9.25,22 6.9,21 4.95,19.05C3.1,17.2 2,14.95 2,12C2,9.05 3.1,6.8 4.95,4.95C6.9,3 9.25,2 12,2M12,4C9.8,4 7.95,4.8 6.45,6.3C4.95,7.8 4.15,9.65 4.15,11.85C4.15,14.05 4.95,15.9 6.45,17.4C7.95,18.9 9.8,19.7 12,19.7C14.2,19.7 16.05,18.9 17.55,17.4C19.05,15.9 19.85,14.05 19.85,11.85C19.85,9.65 19.05,7.8 17.55,6.3C16.05,4.8 14.2,4 12,4Z"
											/>
										</svg>
									{:else if result.type === 'airline'}
										<MdiShieldAirplane class="h-4 w-4 text-accent dark:text-accent-dark" />
									{:else if result.type === 'aircraft'}
										<MdiAirplaneSearch class="h-4 w-4 text-accent dark:text-accent-dark" />
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
