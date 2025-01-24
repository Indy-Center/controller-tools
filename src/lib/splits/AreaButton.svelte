<script lang="ts">
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

	type AreaButtonProps = {
		area: Area;
		areaGroup: Group | undefined;
		activeGroup: Group;
		isOwnerArea: boolean;
		disabled: boolean;
		onClick: () => void;
	};

	let props: AreaButtonProps = $props();
</script>

<button
	type="button"
	class="relative rounded border px-2 py-1.5 text-left text-sm transition-colors"
	class:cursor-not-allowed={props.isOwnerArea}
	class:border-accent={props.isOwnerArea}
	class:bg-accent-10={props.isOwnerArea}
	class:text-content-secondary={props.isOwnerArea ||
		(props.areaGroup && props.areaGroup !== props.activeGroup)}
	class:dark:text-content-dark-secondary={props.areaGroup && props.areaGroup !== props.activeGroup}
	class:text-content={props.areaGroup === props.activeGroup}
	class:dark:text-content-dark={props.areaGroup === props.activeGroup}
	class:border-surface-tertiary={!props.areaGroup && !props.isOwnerArea}
	class:bg-surface={!props.areaGroup && !props.isOwnerArea}
	class:hover:bg-surface-secondary={!props.areaGroup && !props.isOwnerArea}
	class:dark:border-surface-dark-tertiary={!props.areaGroup && !props.isOwnerArea}
	class:dark:bg-surface-dark={!props.areaGroup && !props.isOwnerArea}
	class:dark:hover:bg-surface-dark-secondary={!props.areaGroup && !props.isOwnerArea}
	style={props.areaGroup
		? `
			border-color: ${props.areaGroup.color};
			background-color: ${
				props.areaGroup === props.activeGroup
					? `${props.areaGroup.color}66` // 40% opacity for active group
					: `${props.areaGroup.color}1a` // 10% opacity for other groups
			};
			--hover-color: ${
				props.areaGroup === props.activeGroup
					? `${props.areaGroup.color}80` // 50% opacity on hover for active group
					: `${props.areaGroup.color}33` // 20% opacity on hover for other groups
			};
		`
		: ''}
	onclick={props.onClick}
	disabled={props.disabled}
>
	{props.area.short}
</button>
