<script lang="ts">
	import * as mdi from '@mdi/js';
	import type { MdiIconName } from '$lib/types/mdi';

	type MdiIconProps = {
		name: MdiIconName;
		class?: string;
		style?: string;
	};

	let { name, class: className = 'w-4 h-4', style }: MdiIconProps = $props();

	const path = $derived.by(() => {
		const formattedName =
			'mdi' +
			name
				.split('-')
				.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
				.join('');

		return (mdi as Record<string, string>)[formattedName] || '';
	});
</script>

{#if path}
	<svg viewBox="0 0 24 24" {style} class={className} fill="currentColor">
		<path d={path} />
	</svg>
{/if}
