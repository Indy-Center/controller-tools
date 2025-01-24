<script lang="ts">
	import AreaButton from './AreaButton.svelte';

	type Area = {
		id: string;
		short: string;
		long: string;
		category: string;
		tag: string | null;
		color: string;
		geojson: unknown;
	};

	type Group = {
		name: string;
		color: string;
		areas: string[];
	};

	type AreaGridProps = {
		areas: Area[];
		areasByCategory: Record<string, Area[]>;
		activeGroup: Group;
		activeGroupIndex: number;
		groups: Group[];
		getAreaGroup: (areaId: string) => Group | undefined;
		onAreaClick: (area: Area) => void;
	};

	let props: AreaGridProps = $props();
</script>

<div class="grid grid-cols-3 gap-8 p-2">
	{#each Object.entries(props.areasByCategory).sort() as [categoryName, areas]}
		<div>
			<label
				for={`areas-${categoryName}`}
				class="mb-2 block font-medium text-content dark:text-content-dark">{categoryName}</label
			>
			<div id={`areas-${categoryName}`} role="group" class="grid grid-cols-2 gap-2">
				{#each areas as area}
					{@const areaGroup = props.getAreaGroup(area.id)}
					{@const isOwnerArea = props.groups.some((g) => g.name === area.short)}
					<AreaButton
						{area}
						{areaGroup}
						activeGroup={props.activeGroup}
						{isOwnerArea}
						onClick={() => props.onAreaClick(area)}
						disabled={isOwnerArea ||
							(props.activeGroupIndex === 0 && (!areaGroup || areaGroup === props.groups[0]))}
					/>
				{/each}
			</div>
		</div>
	{/each}
</div>
