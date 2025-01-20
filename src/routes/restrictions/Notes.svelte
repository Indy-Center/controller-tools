<script lang="ts">
	import Turbine from 'virtual:icons/mdi/turbine';
	import Fan from 'virtual:icons/mdi/fan';
	import StarFourPoints from 'virtual:icons/mdi/star-four-points';
	import MapMarkerPath from 'virtual:icons/mdi/map-marker-path';
	import Handshake from 'virtual:icons/mdi/handshake';
	import HandPointingRight from 'virtual:icons/mdi/hand-pointing-right';
	import ArrowRightThin from 'virtual:icons/mdi/arrow-right-thin';
	import MapMarkerRight from 'virtual:icons/mdi/map-marker-right';
	import Cancel from 'virtual:icons/mdi/cancel';
	import Boomerang from 'virtual:icons/mdi/boomerang';
	import Radar from 'virtual:icons/mdi/radar';
	import Note from 'virtual:icons/mdi/note';

	let { content }: { content: string } = $props();

	// Badge configuration
	const badgeConfig = [
		{ match: 'JET', icon: Turbine, label: 'JET' },
		{ match: 'PROP', icon: Fan, label: 'PROP' },
		{ match: 'RNAV1', icon: StarFourPoints, label: 'RNAV 1' },
		{ match: 'BRNAV', icon: MapMarkerPath, label: 'POINT-TO-POINT' },
		{ match: 'AIT', icon: Handshake, label: 'AIT' },
		{ match: 'APO', icon: HandPointingRight, label: 'APO' },
		{ match: 'LAST', icon: MapMarkerRight, label: 'JOIN BY' },
		{ match: 'PASSBACK', icon: Boomerang, label: 'PASS-BACK' },
		{ match: 'EXCLUDES', icon: Cancel, label: 'EXCLUDING' },
		{ match: 'CONTROL', icon: Radar, label: 'CONTROL' }
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
				icon: config?.icon || Note,
				label: config?.label || 'OTHER'
			});
		}

		const remainingText = content.replace(conditionRegex, '').trim();

		if (remainingText) {
			conditions.push({
				condition: 'OTHER',
				content: remainingText,
				icon: Note,
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
	{#each conditions.filter((c) => c.label !== 'OTHER') as { icon: Icon, label, content }, index}
		<div
			class="border-accent bg-surface-secondary dark:bg-surface-dark-secondary text-content dark:text-content-dark flex w-full flex-wrap items-center gap-1 text-wrap rounded-lg border-2 p-2 dark:border-accent-dark"
		>
			<div class="flex items-center gap-1">
				<Icon class="text-accent h-5 w-5 dark:text-accent-dark" />
				<span class="-mt-[2px] text-sm font-semibold">{label}{content ? ':' : ''}</span>
			</div>
			{#if content}
				<div class="-mt-[1px] flex items-center text-left text-sm">
					{#if label === 'AIT'}
						{#each parsedSectors[index] as sector, sectorIndex}
							<span>{sector}</span>
							{#if sectorIndex < parsedSectors[index].length - 1}
								<ArrowRightThin class="text-accent mt-[1px] dark:text-accent-dark" />
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
			<div class="text-content-secondary dark:text-content-dark-secondary text-left text-sm">
				{content}
			</div>
		{/if}
	{/each}
</div>

<style>
	/* Optional styles already handled by Tailwind */
</style>
