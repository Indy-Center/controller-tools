<script lang="ts">
	let { label, color }: { label: string; color: string } = $props();

	let rgbColor = $derived.by(() => {
		const match = color.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
		return match
			? `${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)}`
			: '0, 0, 0'; // Default to black if invalid
	});
</script>

<div class="badge rounded-md px-2 py-1 text-sm font-medium" style="--color: {rgbColor};">
	{label}
</div>

<style lang="postcss">
	.badge {
		background-color: rgba(var(--color), 0.1);
		color: rgba(var(--color), 1);
	}
</style>
