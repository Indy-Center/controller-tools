<script lang="ts">
	import Map from './Map.svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';

	const {
		data
	}: {
		data: {
			airports: Airport[];
			metars: Metar[];
			controllers: Controller[];
			departures: any[];
			arrivals: any[];
		};
	} = $props();

	onMount(() => {
		const interval = setInterval(() => {
			// Force a reload of the data
			invalidate('/api/data');
		}, 15000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<svelte:head>
	<title>ICCT - Indy Center Controller Tools</title>
</svelte:head>

<div class="relative z-0 flex lg:h-[calc(100vh-87px)] lg:min-h-[calc(100vh-88px)]">
	<div
		class="left-4 top-14 z-50 hidden w-1/4 flex-col bg-white bg-opacity-80 drop-shadow lg:flex dark:bg-zinc-700 dark:text-white"
	>
		<h2 class="p-2 text-xl font-medium">Online Controllers</h2>
		<div class="w-full overflow-y-auto border-t border-t-zinc-400 text-sm dark:border-t-zinc-100">
			{#if data.controllers.length > 0}
				{#each data.controllers as controller}
					<div
						class="mb-1 w-full border-b border-zinc-300 px-4 py-2 last-of-type:border-0 dark:border-zinc-500"
					>
						<div class="flex justify-between">
							<div class="font-medium">{controller.callsign}</div>
							<div class="font-light">{controller.name}</div>
						</div>
					</div>
				{/each}
			{:else}
				<div class="w-full p-4 text-sm">No Controllers Online</div>
			{/if}
		</div>
	</div>
	<Map airports={data.airports} metars={data.metars} />
</div>

<div
	class="absolute bottom-10 left-1/2 z-50 mx-auto flex w-auto justify-around gap-4 rounded-2xl bg-white px-4 py-2 text-sm drop-shadow dark:bg-zinc-700 dark:text-white"
>
	<div>
		<span class="font-medium">Arrivals:</span>
		<span class="font-light">{data.arrivals.length}</span>
	</div>
	<div>
		<span class="font-medium">Departures:</span>
		<span class="font-light">{data.departures.length}</span>
	</div>
	<div>
		<span class="font-medium">Controllers:</span>
		<span class="font-light">{data.controllers.length}</span>
	</div>
</div>
