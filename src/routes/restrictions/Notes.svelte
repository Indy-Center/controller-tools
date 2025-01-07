<script lang="ts">
	import Turbine from 'virtual:icons/mdi/turbine';
	import Fan from 'virtual:icons/mdi/fan';
	import StarFourPointsSmall from 'virtual:icons/mdi/star-four-points-small';
	import MapMarkerPath from 'virtual:icons/mdi/map-marker-path';
	import Handshake from 'virtual:icons/mdi/handshake';
	import HandPointingRight from 'virtual:icons/mdi/hand-pointing-right';
	import Radar from 'virtual:icons/mdi/radar';
	import Note from 'virtual:icons/mdi/note';

	let { content }: { content: string } = $props();

	// Badge configuration
	const badgeConfig = [
		{ match: 'JET', icon: Turbine, label: 'JET' },
		{ match: 'PROP', icon: Fan, label: 'PROP' },
		{ match: 'RNAV1', icon: StarFourPointsSmall, label: 'RNAV 1' },
		{ match: 'NON-PBN', icon: MapMarkerPath, label: 'Non-PBN' },
		{ match: 'AIT', icon: Handshake, label: 'AIT' },
		{ match: 'APO', icon: HandPointingRight, label: 'APO' },
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
</script>

<div class="space-y-2">
	{#each conditions.filter((c) => c.label !== 'OTHER') as { icon: Icon, label, content }}
		<div class="flex w-full flex-col items-start gap-1 rounded-lg border border-gray-300 p-2">
			<div class="flex items-center gap-1">
				<Icon class="h-5 w-5 text-gray-700 dark:text-gray-200" />
				<span class="text-sm font-semibold text-gray-700 dark:text-gray-100">{label}</span>
			</div>
			{#if content}
				<div class="text-left text-sm text-gray-600 dark:text-gray-400">{content}</div>
			{/if}
		</div>
	{/each}

	{#each conditions as { label, content }}
		{#if label === 'OTHER' && content}
			<div class="text-left text-sm text-gray-700 dark:text-gray-300">{content}</div>
		{/if}
	{/each}
</div>

<style>
	/* Optional styles already handled by Tailwind */
</style>
