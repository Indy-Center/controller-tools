<script lang="ts">
	let { text, children } = $props<{ text: string; children: any }>();
	let show = $state(false);
</script>

<div
	class="relative"
	onmouseenter={() => (show = true)}
	onmouseleave={() => (show = false)}
	role="tooltip"
>
	{@render children()}
	{#if show && text}
		<div
			id="tooltip"
			role="tooltip"
			class="pointer-events-none absolute bottom-full left-1/2 z-[2000] -translate-x-1/2 whitespace-normal"
		>
			<div
				class="relative min-w-[200px] max-w-[300px] rounded-lg bg-surface/95 px-3 py-2 text-sm text-content shadow-lg backdrop-blur-md dark:bg-surface-dark/95 dark:text-content-dark"
			>
				{text}
				<div
					class="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 transform bg-surface/95 dark:bg-surface-dark/95"
				></div>
			</div>
		</div>
	{/if}
</div>
