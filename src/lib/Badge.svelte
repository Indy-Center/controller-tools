<script lang="ts">
	const { classes, children }: {classes: string[]; children: any } = $props();
</script>

<div class="rounded-md px-2 py-1 text-xs font-medium {classes.join(' ')}">
	{@render children()}
</div>