<script lang="ts">
	import type { MdiIconName } from '$lib/types/mdi';
	import MdiIcon from '../MdiIcon.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';

	type MenuAction = {
		icon?: MdiIconName;
		text?: string;
		tooltip?: string;
		active: boolean;
		onClick: () => void;
		dividerBefore?: boolean;
		dividerAfter?: boolean;
		group?: string;
	};

	let { actions = [] } = $props<{ actions: MenuAction[] }>();

	function handleClick(index: number) {
		const action = actions[index];
		action.onClick();
	}
</script>

<div
	class="flex items-center justify-center gap-x-2 rounded-2xl bg-surface/95 p-2 ring-1 ring-black/5 drop-shadow-lg backdrop-blur-md dark:bg-surface-dark/95 dark:ring-white/10"
>
	{#each actions as action, i}
		{#if action.dividerBefore}
			<div class="mx-1 h-6 w-px bg-surface-tertiary dark:bg-surface-dark-tertiary"></div>
		{/if}
		{#if action.tooltip}
			<Tooltip text={action.tooltip}>
				<button
					type="button"
					class={{
						'rounded-lg border border-accent px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none': true,
						'bg-accent text-white hover:bg-accent/90': action.active,
						'bg-surface text-accent hover:bg-accent/10': !action.active,
						'dark:bg-accent dark:text-white': action.active,
						'dark:bg-surface-dark dark:text-accent': !action.active,
						'dark:hover:bg-accent/90': action.active,
						'dark:hover:bg-accent/20': !action.active
					}}
					onclick={() => handleClick(i)}
				>
					{#if action.icon}
						<MdiIcon name={action.icon} class="h-4 w-4" />
					{:else if action.text}
						{action.text}
					{/if}
				</button>
			</Tooltip>
		{:else}
			<button
				type="button"
				class={{
					'rounded-lg border border-accent px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none': true,
					'bg-accent text-white hover:bg-accent/90': action.active,
					'bg-surface text-accent hover:bg-accent/10': !action.active,
					'dark:bg-accent dark:text-white': action.active,
					'dark:bg-surface-dark dark:text-accent': !action.active,
					'dark:hover:bg-accent/90': action.active,
					'dark:hover:bg-accent/20': !action.active
				}}
				onclick={() => handleClick(i)}
			>
				{#if action.icon}
					<MdiIcon name={action.icon} class="h-4 w-4" />
				{:else if action.text}
					{action.text}
				{/if}
			</button>
		{/if}
		{#if action.dividerAfter}
			<div class="mx-1 h-6 w-px bg-surface-tertiary dark:bg-surface-dark-tertiary"></div>
		{/if}
	{/each}
</div>
