<script lang="ts">
	import type { AdarRecord } from '$lib/db/schema';
	import { useSessionStorage } from '$lib/sessionStore.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import MdiIcon from '$lib/components/MdiIcon.svelte';
	import type { Recommendation } from '$lib/api/recommendation';
	import { invalidate } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	let { data } = $props<{ records: AdarRecord[]; recommendations: Recommendation[] }>();

	onMount(() => {
		const interval = setInterval(() => {
			console.log('Invalidating routing data');
			invalidate('/api/routing');
		}, 5_000);

		return () => clearInterval(interval);
	});

	// Search state
	let searchQuery = $state('');
	let isScrolled = $state(false);
	let copiedId = $state<string | null>(null);

	// Departure filter using session storage
	let departureFilter = $state(
		useSessionStorage('routingDeparture', {
			selectedDeparture: '' as string
		})
	);

	// Get unique departure airports
	let departureAirports = $derived(
		[
			...new Set(data.records.flatMap((record: AdarRecord) => record.departureAirports as string[]))
		].sort()
	);

	function handleScroll() {
		isScrolled = window.scrollY > 0;
	}

	async function copyToClipboard(text: string, id: string) {
		// Remove single dots and double dots before copying
		const cleanedText = text
			.replace(/\.{2,}/g, ' ')
			.replace(/\./g, ' ')
			.trim();
		await navigator.clipboard.writeText(cleanedText);
		copiedId = id;
		setTimeout(() => {
			copiedId = null;
		}, 2000);
	}

	// Format route string by removing dots and highlighting procedures
	function formatRouteString(route: string, starId?: string, departureId?: string) {
		// Remove single dots and double dots
		let formatted = route
			.replace(/\.{2,}/g, ' ')
			.replace(/\./g, ' ')
			.trim();

		// If we have procedures, highlight them in the route
		if (departureId) {
			const dpRegex = new RegExp(`\\b${departureId}\\b`, 'g');
			formatted = formatted.replace(
				dpRegex,
				`<span class="text-action-primary dark:text-action-primary">${departureId}</span>`
			);
		}
		if (starId) {
			const starRegex = new RegExp(`\\b${starId}\\b`, 'g');
			formatted = formatted.replace(
				starRegex,
				`<span class="text-action-warning dark:text-action-warning">${starId}</span>`
			);
		}

		return formatted;
	}

	// Filter records and recommendations based on search and departure filter
	let filteredRecords = $derived.by(() => {
		let filtered = data.records;
		if (departureFilter.selectedDeparture) {
			filtered = filtered.filter((record: AdarRecord) =>
				(record.departureAirports as string[]).includes(departureFilter.selectedDeparture)
			);
		}
		if (searchQuery) {
			const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
			filtered = filtered.filter((record: AdarRecord) => {
				const searchableString = [
					record.adarId,
					record.routeString,
					record.starId,
					record.departureId,
					...(record.departureAirports as string[]),
					...(record.arrivalAirports as string[])
				]
					.filter(Boolean)
					.join(' ')
					.toLowerCase();
				return searchTerms.every((term) => searchableString.includes(term));
			});
		}
		return filtered;
	});

	let filteredRecommendations = $derived.by(() => {
		let filtered = data.recommendations;
		if (departureFilter.selectedDeparture) {
			filtered = filtered.filter(
				(rec: Recommendation) => rec.departure === departureFilter.selectedDeparture
			);
		}
		if (searchQuery) {
			const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
			filtered = filtered.filter((rec: Recommendation) => {
				const searchableString = [
					rec.callsign,
					rec.departure,
					rec.arrival,
					rec.originalFlightPlan?.route,
					rec.recommendedFlightPlan?.route
				]
					.filter(Boolean)
					.join(' ')
					.toLowerCase();
				return searchTerms.every((term) => searchableString.includes(term));
			});
		}
		return filtered;
	});
</script>

<svelte:window onscroll={handleScroll} />

<svelte:head>
	<title>ICT - Routing</title>
</svelte:head>

<div class="relative flex-1">
	<div class="container mx-auto max-w-6xl px-4">
		<div class="flex flex-col py-4">
			<!-- Sticky Search Bar -->
			<div
				class="sticky top-16 z-[800] -mx-4 border-b border-transparent bg-surface px-4 transition-all duration-300 dark:bg-surface-dark"
				class:border-surface-tertiary={isScrolled}
				class:dark:border-surface-dark-tertiary={isScrolled}
			>
				<div class="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center">
					<input
						type="text"
						placeholder="Search routes, airports, or IDs..."
						bind:value={searchQuery}
						class="w-full flex-1 rounded-md border border-surface-tertiary bg-surface-secondary p-2 text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary dark:text-content-dark dark:placeholder:text-content-dark-tertiary"
						aria-label="Search routes"
					/>
					<select
						bind:value={departureFilter.selectedDeparture}
						class="w-full rounded-md border border-surface-tertiary bg-surface-secondary p-2 text-content shadow-sm transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:w-48 dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary dark:text-content-dark"
						aria-label="Filter by departure airport"
					>
						<option value="">All Departures</option>
						{#each departureAirports as airport}
							<option value={airport}>{airport}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Recommendations Section -->
			<div class="mt-8">
				<h2 class="mb-4 text-xl font-semibold text-content dark:text-content-dark">
					Flight Plans Needing Re-route
				</h2>
				{#if filteredRecommendations.length > 0}
					<div class="grid grid-cols-1 gap-1 lg:grid-cols-2">
						{#each filteredRecommendations as recommendation}
							<div
								class="flex h-full max-h-[140px] min-h-[110px] w-full min-w-[350px] flex-col items-center gap-y-2 rounded-lg border border-surface-tertiary bg-surface px-4 py-3 shadow-sm transition-all hover:shadow-md dark:border-surface-dark-tertiary dark:bg-surface-dark"
							>
								<div class="flex w-full flex-col gap-y-2">
									<!-- Top row: Flight info (left), Altitude info (right) -->
									<div class="flex w-full flex-row items-center justify-between">
										<!-- Flight Info -->
										<div class="flex min-w-[120px] flex-1 flex-col justify-center gap-1">
											<div class="flex items-center gap-2">
												<span class="text-base font-bold text-content dark:text-content-dark"
													>{recommendation.callsign}</span
												>
												<span
													class="rounded border border-surface-tertiary bg-surface-secondary px-2 py-0.5 text-xs font-semibold text-content-secondary dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary dark:text-content-dark-secondary"
													>{recommendation.originalFlightPlan?.aircraft_faa}</span
												>
											</div>
											<div class="text-xs text-content-secondary dark:text-content-dark-secondary">
												{recommendation.departure} – {recommendation.arrival}
											</div>
										</div>
										<!-- Altitude Info -->
										<div class="flex min-w-[80px] flex-col items-end">
											{#if recommendation.recommendedFlightPlan?.altitude}
												<div
													class="text-xs text-content-secondary dark:text-content-dark-secondary"
												>
													<span class="font-mono font-semibold"
														>{recommendation.recommendedFlightPlan.altitude}</span
													>
												</div>
											{/if}
											{#if recommendation.recommendedFlightPlan?.lowerAltitude !== undefined && recommendation.recommendedFlightPlan?.upperAltitude !== undefined}
												<div class="text-xs text-content-tertiary">
													{recommendation.recommendedFlightPlan.lowerAltitude}–{recommendation
														.recommendedFlightPlan.upperAltitude}
												</div>
											{/if}
										</div>
									</div>
									<!-- Second row: Route box (full width) -->
									<div class="w-full">
										<div
											class="group relative flex w-full items-center overflow-x-auto whitespace-pre break-words rounded bg-surface-secondary px-2 py-1 font-mono text-sm dark:bg-surface-dark-secondary"
											style="scrollbar-width: thin;"
										>
											{recommendation.recommendedFlightPlan?.route}
											<button
												class="sticky right-0 ml-2 rounded p-1 text-content-secondary opacity-0 transition-all hover:bg-surface hover:text-content focus:outline-none focus:ring-2 focus:ring-accent/40 group-focus-within:opacity-100 group-hover:opacity-100 dark:hover:bg-surface-dark dark:hover:text-content-dark"
												onclick={() =>
													copyToClipboard(
														recommendation.recommendedFlightPlan?.route || '',
														recommendation.callsign + '-recommended'
													)}
												title="Copy recommended route"
												aria-label="Copy recommended route"
											>
												{#if copiedId === recommendation.callsign + '-recommended'}
													<MdiIcon
														name="clipboard-check-multiple-outline"
														class="h-4 w-4 text-action-success"
													/>
												{:else}
													<MdiIcon name="clipboard-multiple-outline" class="h-4 w-4" />
												{/if}
											</button>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div
						class="flex h-24 items-center justify-center rounded border border-surface-tertiary bg-surface-secondary text-sm italic text-content-secondary dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary dark:text-content-dark-secondary"
					>
						No Recommendations Found
					</div>
				{/if}
			</div>

			<!-- Routes Section -->
			{#if !data.records || data.records.length === 0}
				<div class="mt-8">
					<EmptyState
						icon="swap-horizontal"
						message="No routes available. If you're an admin, add some routes to get started."
					/>
				</div>
			{:else}
				<div class="mt-8">
					<h2 class="mb-4 text-xl font-semibold text-content dark:text-content-dark">
						Available Routes
					</h2>
					<div
						class="overflow-x-auto rounded-2xl border border-surface-tertiary bg-surface dark:border-surface-dark-tertiary dark:bg-surface-dark"
					>
						<table class="min-w-full text-base">
							<thead class="bg-surface-secondary dark:bg-surface-dark-secondary">
								<tr>
									<th
										class="px-4 py-3 text-left font-semibold text-content-secondary dark:text-content-dark-secondary"
										>Departure</th
									>
									<th
										class="px-4 py-3 text-left font-semibold text-content-secondary dark:text-content-dark-secondary"
										>Arrival</th
									>
									<th
										class="px-4 py-3 text-left font-semibold text-content-secondary dark:text-content-dark-secondary"
										>Route</th
									>
								</tr>
							</thead>
							<tbody>
								{#each filteredRecords as record}
									<tr
										class="border-b border-surface-tertiary transition-colors last:border-0 hover:bg-surface-secondary/60 dark:border-surface-dark-tertiary dark:hover:bg-surface-dark-secondary/60"
									>
										<td class="px-4 py-3 align-top">
											<div class="flex flex-wrap gap-1">
												{#each record.departureAirports as string[] as airport}
													<span
														class="rounded-full bg-action-primary/10 px-2 py-0.5 text-base font-medium text-action-primary dark:bg-action-primary/20"
														>{airport}</span
													>
												{/each}
											</div>
										</td>
										<td class="px-4 py-3 align-top">
											<div class="flex flex-wrap gap-1">
												{#each record.arrivalAirports as string[] as airport}
													<span
														class="rounded-full bg-action-warning/10 px-2 py-0.5 text-base font-medium text-action-warning dark:bg-action-warning/20"
														>{airport}</span
													>
												{/each}
											</div>
										</td>
										<td class="px-4 py-3 align-top">
											<div
												class="relative flex items-center whitespace-pre-wrap break-words rounded-lg bg-surface-secondary px-3 py-2 font-mono text-base dark:bg-surface-dark-secondary"
											>
												{@html formatRouteString(
													record.routeString,
													record.starId,
													record.departureId
												)}
												<button
													class="ml-2 rounded p-1 text-content-secondary transition-all hover:bg-surface hover:text-content focus:outline-none focus:ring-2 focus:ring-accent/40 dark:hover:bg-surface-dark dark:hover:text-content-dark"
													onclick={() => copyToClipboard(record.routeString, record.adarId)}
													title="Copy route"
													aria-label="Copy route"
												>
													{#if copiedId === record.adarId}
														<MdiIcon
															name="clipboard-check-multiple-outline"
															class="h-5 w-5 text-action-success"
														/>
													{:else}
														<MdiIcon name="clipboard-multiple-outline" class="h-5 w-5" />
													{/if}
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
