<script lang="ts">
	import AreaBadge from './AreaBadge.svelte';
	import type { Restriction } from '$lib/db/schema';


	let { route, restrictions }: { route: string, restrictions: Restriction[] } = $props();
</script>

<div class="flex flex-col lg:flex-row border-b border-b-zinc-300 dark:border-b-zinc-500 lg:py-1 last:border-0 text-sm">
	<!-- Route Header -->
	<div class="w-full lg:w-4/12 mb-2 lg:mb-0 text-zinc-700 dark:text-white lg:text-black flex flex-col">
		<span class="block lg:hidden font-bold">Route</span>
		{route}
	</div>

	<!-- Restrictions Data -->
	<div class="flex flex-col flex-grow space-y-2">
		{#each restrictions as restriction}
			<div class="flex flex-col lg:flex-row lg:gap-x-2 space-y-2 lg:space-y-0">
				<!-- From Header -->

				<div class="w-full lg:w-1/12">
					{#if restriction.from}
						<AreaBadge label={restriction.from.id} />
					{/if}
				</div>

				<!-- To Header -->

				<div class="w-full lg:w-1/12">
					{#if restriction.to}
						<AreaBadge label={restriction.to.id} />
					{/if}
				</div>


				<!-- Restriction Header -->
				<div class="w-full lg:w-3/12 flex flex-col justify-center">
					<span class="block lg:hidden font-bold">Restriction</span>
					{restriction.restriction}
				</div>

				<!-- Notes Header -->
				<div class="w-full lg:w-3/12 flex font-light flex-col justify-center">
					<span class="block lg:hidden font-bold">Notes</span>
					{restriction.notes}
				</div>
			</div>
		{/each}
	</div>
</div>