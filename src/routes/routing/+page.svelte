<script lang="ts">
	import type { AdarRecord } from '$lib/db/schema';
	import MdiContentCopy from 'virtual:icons/mdi/content-copy';
	import MdiCheck from 'virtual:icons/mdi/check';

	let { data } = $props<{ records: AdarRecord[] }>();

	// Search state
	let searchQuery = $state('');
	let isScrolled = $state(false);
	let copiedId = $state<string | null>(null);

	function handleScroll() {
		isScrolled = window.scrollY > 0;
	}

	async function copyToClipboard(text: string, id: string) {
		await navigator.clipboard.writeText(text);
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

	// Filter records based on search
	let filteredRecords = $derived.by(() => {
		if (!searchQuery) return data.records;

		// Split search into terms and filter out empty strings
		const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);

		return data.records.filter((record: AdarRecord) => {
			// Create a single searchable string containing all relevant fields
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

			// All search terms must be found in the searchable string
			return searchTerms.every((term) => searchableString.includes(term));
		});
	});
</script>

<svelte:window onscroll={handleScroll} />

<svelte:head>
	<title>ICT - ADAR Routes</title>
</svelte:head>

<div class="container mx-auto max-w-6xl p-4">
	<!-- Sticky Search Bar -->
	<div
		class="sticky top-0 z-50 -mx-4 border-b border-transparent bg-surface px-4 pb-2 transition-all duration-300 dark:bg-surface-dark"
		class:border-surface-tertiary={isScrolled}
		class:dark:border-surface-dark-tertiary={isScrolled}
	>
		<div class="mx-auto flex items-center gap-2">
			<input
				type="text"
				placeholder="Search routes, airports, or IDs..."
				bind:value={searchQuery}
				class="w-full rounded-md border border-surface-tertiary bg-surface-secondary p-2 text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary dark:text-content-dark dark:placeholder:text-content-dark-tertiary"
			/>
		</div>
	</div>

	<!-- Records Display -->
	<div class="mt-6 grid gap-4 md:grid-cols-1 lg:grid-cols-2">
		{#each filteredRecords as record}
			<div
				class="rounded-lg border border-surface-tertiary bg-surface p-4 shadow-sm transition-all hover:shadow-md dark:border-surface-dark-tertiary dark:bg-surface-dark"
			>
				<!-- Header with ID and Meta -->
				<div class="mb-4">
					<div class="flex items-start justify-between gap-4">
						<div>
							<div class="flex items-center gap-3">
								<h3 class="text-lg font-semibold text-content dark:text-content-dark">
									{record.adarId}
								</h3>
								<div class="flex gap-2">
									{#if record.departureId}
										<span
											class="rounded bg-action-primary/10 px-2 py-0.5 text-xs font-medium text-action-primary dark:bg-action-primary/20"
										>
											RNAV-DEPARTURE
										</span>
									{/if}
									{#if record.starId}
										<span
											class="rounded bg-action-warning/10 px-2 py-0.5 text-xs font-medium text-action-warning dark:bg-action-warning/20"
										>
											RNAV-ARRIVAL
										</span>
									{/if}
								</div>
							</div>
							<div
								class="mt-1 flex items-center gap-3 text-sm text-content-secondary dark:text-content-dark-secondary"
							>
								<span>FL{record.lowerAltitude} - FL{record.upperAltitude}</span>
								<span>•</span>
								<span>{record.autoRouteLimit}nm</span>
							</div>
						</div>
						<span
							class="rounded bg-surface-secondary px-2 py-1 text-xs font-medium text-content-secondary dark:bg-surface-dark-secondary dark:text-content-dark-secondary"
						>
							ADAR
						</span>
					</div>
				</div>

				<!-- Airports -->
				<div class="mb-4 space-y-3">
					<div>
						<div
							class="mb-1.5 text-sm font-medium text-content-secondary dark:text-content-dark-secondary"
						>
							Departure Airports
						</div>
						<div class="flex flex-wrap gap-1">
							{#each record.departureAirports as string[] as airport}
								<span
									class="rounded bg-action-primary/10 px-2 py-1 text-sm font-medium text-action-primary dark:bg-action-primary/20"
								>
									{airport}
								</span>
							{/each}
						</div>
					</div>

					<div>
						<div
							class="mb-1.5 text-sm font-medium text-content-secondary dark:text-content-dark-secondary"
						>
							Arrival Airports
						</div>
						<div class="flex flex-wrap gap-1">
							{#each record.arrivalAirports as string[] as airport}
								<span
									class="rounded bg-action-warning/10 px-2 py-1 text-sm font-medium text-action-warning dark:bg-action-warning/20"
								>
									{airport}
								</span>
							{/each}
						</div>
					</div>
				</div>

				<!-- Route String -->
				{#if record.routeString}
					<div class="group relative">
						<div
							class="rounded bg-surface-secondary px-3 py-2 font-mono text-sm text-content dark:bg-surface-dark-secondary dark:text-content-dark"
						>
							{@html formatRouteString(record.routeString, record.starId, record.departureId)}
							<button
								class="absolute right-2 top-2 rounded p-1 text-content-secondary opacity-0 transition-all hover:bg-surface hover:text-content group-hover:opacity-100 dark:hover:bg-surface-dark dark:hover:text-content-dark"
								onclick={() => copyToClipboard(record.routeString, record.adarId)}
								title="Copy route"
							>
								{#if copiedId === record.adarId}
									<MdiCheck class="h-4 w-4 text-action-success" />
								{:else}
									<MdiContentCopy class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
