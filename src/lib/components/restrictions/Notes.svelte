<script lang="ts">
	import type { MdiIconName } from '$lib/types/mdi';
	import MdiIcon from '../MdiIcon.svelte';

	let { content }: { content: string } = $props();

	// Badge configuration
	const badgeConfig: {
		match: string;
		icon: MdiIconName;
		label: string;
	}[] = [
		{ match: 'JET', icon: 'turbine', label: 'JET' },
		{ match: 'PROP', icon: 'fan', label: 'PROP' },
		{ match: 'RNAV1', icon: 'star-four-points', label: 'RNAV 1' },
		{ match: 'BRNAV', icon: 'map-marker-path', label: 'POINT-TO-POINT' },
		{ match: 'AIT', icon: 'handshake', label: 'AIT' },
		{ match: 'APO', icon: 'hand-pointing-right', label: 'APO' },
		{ match: 'LAST', icon: 'map-marker-right', label: 'JOIN BY' },
		{ match: 'PASSBACK', icon: 'boomerang', label: 'PASS-BACK' },
		{ match: 'EXCLUDES', icon: 'cancel', label: 'EXCLUDING' },
		{ match: 'CONTROL', icon: 'radar', label: 'CONTROL' }
	];

	let conditions = $derived.by(() => {
		const conditionRegex = /\[(.*?)\](?:\(([^()]*|[^()]*\([^()]*\)[^()]*)\))?/g;
		let match: any;
		const conditions = [];

		while ((match = conditionRegex.exec(content)) !== null) {
			const config = badgeConfig.find((b) => b.match === match[1]);
			conditions.push({
				condition: match[1],
				content: match[2],
				icon: config?.icon || ('note' as MdiIconName),
				label: config?.label || 'OTHER'
			});
		}

		const remainingText = content.replace(conditionRegex, '').trim();

		if (remainingText) {
			conditions.push({
				condition: 'OTHER',
				content: remainingText,
				icon: 'note' as MdiIconName,
				label: 'OTHER'
			});
		}

		return conditions;
	});

	function parseAitSectors(content: string) {
		return content.split(',').map((sectors) => sectors.trim());
	}

	let parsedSectors = $derived(
		conditions.filter((c) => c.label === 'AIT' && c.content).map((c) => parseAitSectors(c.content))
	);
</script>

<div class="space-y-2">
	{#each conditions.filter((c) => c.label !== 'OTHER') as { icon, label, content }, index}
		<div
			class="flex w-full flex-wrap items-center gap-1 text-wrap rounded-lg border-2 border-accent bg-surface-secondary p-2 text-content dark:border-accent-dark dark:bg-surface-dark-secondary dark:text-content-dark"
		>
			<div class="flex items-center gap-1">
				<MdiIcon name={icon} class="h-5 w-5 text-accent dark:text-accent-dark" />
				<span class="-mt-[2px] text-sm font-semibold">{label}{content ? ':' : ''}</span>
			</div>
			{#if content}
				<div class="-mt-[1px] flex items-center text-left text-sm">
					{#if label === 'AIT'}
						{#each parsedSectors[index] as sector, sectorIndex}
							<span>{sector}</span>
							{#if sectorIndex < parsedSectors[index].length - 1}
								<MdiIcon
									name="arrow-right-thin"
									class="mt-[1px] text-accent dark:text-accent-dark"
								/>
							{/if}
						{/each}
					{:else}
						<div>{content}</div>
					{/if}
				</div>
			{/if}
		</div>
	{/each}

	{#each conditions as { label, content }}
		{#if label === 'OTHER' && content}
			<div class="text-left text-sm text-content-secondary dark:text-content-dark-secondary">
				{content}
			</div>
		{/if}
	{/each}
</div>

<style>
	/* Optional styles already handled by Tailwind */
</style>
