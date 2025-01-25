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
								frequency: navaid.freq ? `${navaid.freq.toFixed(1)} MHz` : 'N/A',
								latitude: navaid.lat.toFixed(4),
								longitude: navaid.lon.toFixed(4),
								elevation: navaid.elev,
								location: `${navaid.state}, ${navaid.country}`,
								magnetic_variation: navaid.mag_dec || 'N/A'
							}
						}))
					: [];

				// Process airport results
				const airportResults: SearchResult[] = Array.isArray(airports)
					? airports.map((airport: Airport) => ({
							type: 'airport',
							title: `${airport.icaoId} - ${airport.name}`,
							subtitle: `${airport.iataId ? airport.iataId + ' • ' : ''}${formatRunways(airport.runways)}`,
							details: {
								type: airport.tower === 'T' ? 'Towered' : 'Non-Towered',
								frequency: formatFrequencies(airport.freqs),
								latitude: airport.lat.toFixed(4),
								longitude: airport.lon.toFixed(4),
								elevation: airport.elev,
								location: `${airport.state}, ${airport.country}`,
								magnetic_variation: airport.magdec || 'N/A'
							}
						}))
					: [];

				// Process airline results
				const airlineResults: SearchResult[] = Array.isArray(airlines)
					? airlines.map((airline: Airline) => {
							return {
								type: 'airline',
								title: `${airline.company} - ${airline.code}`,
								details: {
									location: airline.country,
									telephony: airline.telephony
								}
							};
						})
					: [];

				// Process aircraft results
				const aircraftResults: SearchResult[] = Array.isArray(aircraft)
					? aircraft.map((aircraft: Aircraft) => {
							return {
								type: 'aircraft',
								title: `${aircraft.manufacturer}: ${aircraft.model} - ${aircraft.code}`,
								details: {
									numberOfEngines: aircraft.numberOfEngines,
									engineType: aircraft.engineType,
									class: aircraft.class
								}
							};
						})
					: [];

				// Combine and sort results
				searchResults = [
					...navaidResults,
					...airportResults,
					...airlineResults,
					...aircraftResults
				].sort((a, b) => a.title.localeCompare(b.title));
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
<div class="flex justify-center">
	<button
		onclick={() => modal?.open()}
		class="border-secondary dark:border-dark-secondary flex w-32 items-center justify-between rounded-md border px-3 py-2 text-sm text-content-secondary hover:text-content lg:w-64 dark:text-content-dark-secondary dark:hover:text-content-dark"
	>
		<div class="flex items-center gap-2">
			<MdiMagnify class="mr-2" />
			<span class="hidden lg:block">Search</span>
		</div>
		<kbd
			class="border-secondary dark:border-dark-secondary ml-2 rounded-md border px-2 text-content-tertiary dark:text-content-dark-tertiary"
			>/</kbd
		>
	</button>
</div>

<!-- Search Modal -->
<Modal bind:this={modal} title="Search Airports, Navigation Aids, and More">
	<div class="flex w-full flex-col gap-6">
		<!-- Search input -->
		<div class="relative w-full">
			<MdiMagnify
				class="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary dark:text-content-dark-secondary"
			/>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search airports, navaids, aicraft, or callsign..."
				oninput={handleSearch}
				class="w-full rounded-md bg-surface-secondary py-2 pl-10 pr-4 uppercase outline-none dark:bg-surface-dark-secondary"
				autofocus
				use:focusOnShow
			/>
		</div>

		<!-- Search results -->
		<div class="max-h-[60vh] w-full overflow-y-auto">
			{#if isLoading}
				<div class="flex items-center justify-center py-4">
					<div
						class="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
					></div>
				</div>
			{:else if searchResults.length === 0}
				<div class="py-4 text-center text-content-secondary dark:text-content-dark-secondary">
					{searchQuery ? 'No results found' : 'Enter at least 3 characters to search...'}
				</div>
			{:else}
				<div class="flex flex-col gap-2">
					{#each searchResults as result}
						<div
							class="rounded-md p-3 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary"
						>
							<div class="flex items-start gap-2">
								{#if result.type === 'navaid'}
									<MdiRadioTower class="text-primary mt-1" />
								{:else if result.type === 'airport'}
									<svg class="text-primary mt-1 h-5 w-5" viewBox="0 0 24 24">
										<path
											fill="currentColor"
											d="M12,15C12.81,15 13.5,14.31 13.5,13.5C13.5,12.69 12.81,12 12,12C11.19,12 10.5,12.69 10.5,13.5C10.5,14.31 11.19,15 12,15M12,2C14.75,2 17.1,3 19.05,4.95C20.9,6.8 22,9.05 22,12C22,14.95 20.9,17.2 19.05,19.05C17.1,21 14.75,22 12,22C9.25,22 6.9,21 4.95,19.05C3.1,17.2 2,14.95 2,12C2,9.05 3.1,6.8 4.95,4.95C6.9,3 9.25,2 12,2M12,4C9.8,4 7.95,4.8 6.45,6.3C4.95,7.8 4.15,9.65 4.15,11.85C4.15,14.05 4.95,15.9 6.45,17.4C7.95,18.9 9.8,19.7 12,19.7C14.2,19.7 16.05,18.9 17.55,17.4C19.05,15.9 19.85,14.05 19.85,11.85C19.85,9.65 19.05,7.8 17.55,6.3C16.05,4.8 14.2,4 12,4Z"
										/>
									</svg>
								{:else if result.type === 'airline'}
									<MdiShieldAirplane class="text-primary mt-1" />
								{:else if result.type === 'aircraft'}
									<MdiAirplaneSearch class="text-primary mt-1" />
								{/if}
								<div class="flex-1">
									<div class="text-lg font-medium">{result.title}</div>

									<div class="mt-3 space-y-2">
										<!-- Primary Details in 2 columns -->
										{#if result.details}
											<div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
												{#if result.details.telephony}
													<div>
														<span class="text-content-secondary dark:text-content-dark-secondary"
															>Callsign:</span
														>
														{result.details.telephony}
													</div>
												{/if}
												{#if result.details.type}
													<div>
														<span class="text-content-secondary dark:text-content-dark-secondary"
															>Type:</span
														>
														{result.details.type}
													</div>
												{/if}
												{#if result.details.class}
													<div>
														<span class="text-content-secondary dark:text-content-dark-secondary"
															>Class:</span
														>
														{result.details.class}
													</div>
												{/if}
												{#if result.details.engineType}
													<div>
														<span class="text-content-secondary dark:text-content-dark-secondary"
															>Engine Type:</span
														>
														{result.details.engineType}
													</div>
												{/if}

												{#if result.details.numberOfEngines}
													<div>
														<span class="text-content-secondary dark:text-content-dark-secondary"
															>Number of Engines:</span
														>
														{result.details.numberOfEngines}
													</div>
												{/if}

												{#if result.details.elevation}
													<div>
														<span class="text-content-secondary dark:text-content-dark-secondary"
															>Elevation:</span
														>
														{result.details.elevation}ft
													</div>
												{/if}

												{#if result.details.frequency}
													<div class="col-span-2">
														<span class="text-content-secondary dark:text-content-dark-secondary"
															>Frequency:</span
														>
														{result.details.frequency}
													</div>
												{/if}

												{#if result.details.latitude}
													<div>
														<span class="text-content-secondary dark:text-content-dark-secondary"
															>Lat:</span
														>
														{result.details.latitude}°
													</div>
												{/if}

												{#if result.details.longitude}
													<div>
														<span class="text-content-secondary dark:text-content-dark-secondary"
															>Long:</span
														>
														{result.details.longitude}°
													</div>
												{/if}

												{#if result.details.location}
													<div>
														<span class="text-content-secondary dark:text-content-dark-secondary"
															>Location:</span
														>
														{result.details.location}
													</div>
												{/if}
												{#if result.details.magnetic_variation}
													<div>
														<span class="text-content-secondary dark:text-content-dark-secondary"
															>Mag Var:</span
														>
														{result.details.magnetic_variation}
													</div>
												{/if}
											</div>
										{/if}
										<!-- Runway Details for Airports -->
										{#if result.type === 'airport' && result.subtitle}
											<div
												class="border-t border-surface-secondary pt-2 dark:border-surface-dark-secondary"
											>
												<div
													class="mb-1 text-sm text-content-secondary dark:text-content-dark-secondary"
												>
													Runways:
												</div>
												<div class="flex flex-wrap gap-2 text-sm">
													{#each result.subtitle
														.split(' • ')
														.filter((r) => r.includes('(')) as runway}
														<div
															class="rounded-md bg-surface-secondary px-3 py-1.5 transition-colors hover:bg-surface-tertiary dark:bg-surface-dark-secondary dark:hover:bg-surface-dark-tertiary"
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
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</Modal>
