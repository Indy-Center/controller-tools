<script lang="ts">
	import MdiIcon from '../MdiIcon.svelte';

	type SplitNameProps = {
		name: string;
		isDefault: boolean;
		isPublished: boolean;
	};

	const { name, isDefault, isPublished }: SplitNameProps = $props();
</script>

<div class="flex items-center gap-x-2">
	{#if !isPublished}
		<div class="text-accent dark:text-accent-dark"><MdiIcon name="eye-remove-outline" /></div>
	{/if}
	{#if isDefault}
		<div class="text-accent dark:text-accent-dark"><MdiIcon name="star" /></div>
	{/if}

	<div>
		{name}
	</div>
</div>
