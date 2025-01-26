<script lang="ts">
	import MdiEyeRemoveOutline from 'virtual:icons/mdi/eye-remove-outline';
	import MdiStar from 'virtual:icons/mdi/star';

	type SplitNameProps = {
		name: string;
		isDefault: boolean;
		isPublished: boolean;
	};

	const { name, isDefault, isPublished }: SplitNameProps = $props();
</script>

<div class="flex items-center gap-x-2">
	{#if !isPublished}
		<div class="text-accent dark:text-accent-dark"><MdiEyeRemoveOutline /></div>
	{/if}
	{#if isDefault}
		<div class="text-accent dark:text-accent-dark"><MdiStar /></div>
	{/if}

	<div>
		{name}
	</div>
</div>
