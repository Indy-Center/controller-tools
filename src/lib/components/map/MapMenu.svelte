<script lang="ts">
	type MenuAction = {
		icon?: any;
		text?: string;
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
	class="bg-surface/95 dark:bg-surface-dark/95 flex items-center justify-center gap-x-2 rounded-2xl p-2 ring-1 ring-black/5 drop-shadow-lg backdrop-blur-md dark:ring-white/10"
>
	{#each actions as action, i}
		{#if action.dividerBefore}
			<div class="bg-surface-tertiary dark:bg-surface-dark-tertiary mx-1 h-6 w-px"></div>
		{/if}
		<button
			type="button"
			class={{
				'border-accent rounded-lg border px-4 py-2 text-sm font-medium transition duration-300 focus:outline-none': true,
				'bg-accent hover:bg-accent/90 text-white': action.active,
				'bg-surface text-accent hover:bg-accent/10': !action.active,
				'dark:bg-accent dark:text-white': action.active,
				'dark:bg-surface-dark dark:text-accent': !action.active,
				'dark:hover:bg-accent/90': action.active,
				'dark:hover:bg-accent/20': !action.active
			}}
			onclick={() => handleClick(i)}
		>
			{#if action.icon}
				<action.icon />
			{:else if action.text}
				{action.text}
			{/if}
		</button>
		{#if action.dividerAfter}
			<div class="bg-surface-tertiary dark:bg-surface-dark-tertiary mx-1 h-6 w-px"></div>
		{/if}
	{/each}
</div>
