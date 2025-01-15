<script lang="ts">
	let { children, title }: { children: any; title: string } = $props();

	let isOpen = $state(false);

	export function close() {
		isOpen = false;
	}

	export function open() {
		isOpen = true;
	}
</script>

<svelte:document onkeydown={e => e.key === 'Escape' && close()} />

{#if isOpen}
	<div
		class=" fixed inset-0 z-50 flex justify-center bg-gray-800 bg-opacity-50"
	>
		<div
			class="bg relative top-16 h-fit w-1/2 max-w-1/2 max-h-[90vh] overflow-y-auto rounded-lg p-6 shadow-lg flex flex-col"
			role="dialog"
			aria-modal="true"
		>
			<div class="w-full text-xl font-semibold">{title}</div>
			<div class="w-full">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

