<script>
	import Map from './Map.svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';

	const { data } = $props()
</script>

<svelte:head>
	<title>ICCT - Indy Center Controller Tools</title>
</svelte:head>

<div class="flex lg:flex-row flex-col lg:h-full">
	<div class="dark:text-white w-full lg:w-2/5 bg-zinc-100 dark:bg-zinc-700 flex lg:flex-col overflow-scroll">
		<div class="w-full p-2">
			<h2 class="text-xl font-medium">NTML</h2>
			<div class="text-xs font-mono whitespace-pre-wrap">
				NON-FUNCTIONAL
			</div>
		</div>
		<div class="w-full p-2">
			<h2 class="text-xl font-medium">Advisories</h2>
			<div class="text-xs font-mono whitespace-pre-wrap">
				NON-FUNCTIONAL
			</div>
		</div>
	</div>
	<div class="w-full lg:h-full md:h-[calc(100vh-188px)] h-[calc(100vh-174px)]">
	<Map airports={data.airports} metars={data.metars} />
	</div>
</div>
