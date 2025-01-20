<script lang="ts">
	import MdiClose from 'virtual:icons/mdi/close';

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
	<div class="fixed inset-0 z-50 flex justify-center bg-black/50 dark:bg-black/75">
		<div
			class="border-surface-tertiary dark:border-surface-dark-tertiary bg-surface dark:bg-surface-dark relative top-16 flex h-fit max-h-[90vh] w-[95%] flex-col overflow-y-auto rounded-lg border p-6 shadow-xl lg:w-1/2 dark:shadow-2xl"
			role="dialog"
			aria-modal="true"
		>
			<div class="flex items-center justify-between">
				<div class="text-content dark:text-content-dark w-full text-xl font-semibold">{title}</div>
				<button
					onclick={() => close()}
					class="text-content-secondary hover:text-content dark:text-content-dark-secondary dark:hover:text-content-dark hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary rounded p-1"
				>
					<MdiClose />
				</button>
			</div>
			<div class="w-full">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
