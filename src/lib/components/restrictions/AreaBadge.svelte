<script lang="ts">
	let { label, color }: { label: string; color: string } = $props();

	let rgbColor = $derived.by(() => {
		const match = color.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
		if (!match) return '0, 0, 0'; // Default to black if invalid

		// Parse the RGB values
		const r = parseInt(match[1], 16);
		const g = parseInt(match[2], 16);
		const b = parseInt(match[3], 16);

		return `${r}, ${g}, ${b}`;
	});

	let darkModeColor = $derived.by(() => {
		const match = color.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
		if (!match) return '160, 160, 160'; // Default to light gray if invalid

		// Parse the RGB values
		const r = parseInt(match[1], 16);
		const g = parseInt(match[2], 16);
		const b = parseInt(match[3], 16);

		// If it's black or very dark, return a light gray in dark mode
		if (r < 30 && g < 30 && b < 30) {
			return '160, 160, 160'; // Light gray for dark colors
		}

		return `${r}, ${g}, ${b}`;
	});
</script>

<div
	class="badge rounded-md px-2 py-1 text-sm font-medium dark:border"
	style="
		--color: {rgbColor}; 
		--dark-color: {darkModeColor};
		border-color: rgba(var(--dark-color), 0.5);
	"
>
	{label}
</div>

<style lang="postcss">
	.badge {
		background-color: rgba(var(--color), 0.1);
		color: rgba(var(--color), 1);
	}

	:global(.dark) .badge {
		background-color: rgba(var(--dark-color), 0.15);
		color: rgba(var(--dark-color), 0.9);
	}
</style>
