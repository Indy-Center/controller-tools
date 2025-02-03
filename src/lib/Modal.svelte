<script lang="ts">
	import MdiIcon from './components/MdiIcon.svelte';
	import { onMount } from 'svelte';

	let { children, title }: { children: any; title: string } = $props();

	let isOpen = $state(false);
	let modalContainer: HTMLDivElement;

	export function close() {
		isOpen = false;
		document.body.style.overflow = '';
	}

	export function open() {
		isOpen = true;
		document.body.style.overflow = 'hidden';
	}

	onMount(() => {
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:document onkeydown={(e) => e.key === 'Escape' && close()} />

{#if isOpen}
	<div
		bind:this={modalContainer}
		class="fixed inset-0 z-[1000] overflow-y-auto bg-black/50 pt-16 dark:bg-black/75"
		role="dialog"
		aria-modal="true"
	>
		<!-- Modal content -->
		<div
			class="relative mx-auto mb-16 w-[95%] rounded-lg border border-surface-tertiary bg-surface p-6 shadow-xl lg:w-1/2 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:shadow-2xl"
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
