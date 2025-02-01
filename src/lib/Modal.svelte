<script lang="ts">
	import MdiIcon from './components/MdiIcon.svelte';

	let { children, title }: { children: any; title: string } = $props();

	let isOpen = $state(false);

	export function close() {
		isOpen = false;
	}

	export function open() {
		isOpen = true;
	}
</script>

<svelte:document onkeydown={(e) => e.key === 'Escape' && close()} />

{#if isOpen}
	<div class="fixed inset-0 z-[1000] flex justify-center" role="dialog" aria-modal="true">
		<!-- Overlay button -->
		<button
			type="button"
			class="absolute inset-0 z-[1000] bg-black/50 dark:bg-black/75"
			aria-label="Close modal"
			onclick={() => close()}
		></button>

		<!-- Modal content -->
		<div
			class="relative top-16 z-[1001] flex h-fit max-h-[90vh] w-[95%] flex-col overflow-y-auto rounded-lg border border-surface-tertiary bg-surface p-6 shadow-xl lg:w-1/2 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:shadow-2xl"
		>
			<div class="flex items-center justify-between">
				<div class="w-full text-xl font-semibold text-content dark:text-content-dark">{title}</div>
				<button
					type="button"
					onclick={() => close()}
					class="rounded p-1 text-content-secondary hover:bg-surface-secondary hover:text-content dark:text-content-dark-secondary dark:hover:bg-surface-dark-secondary dark:hover:text-content-dark"
					aria-label="Close modal"
				>
					<MdiIcon name="close" />
				</button>
			</div>
			<div class="w-full">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
