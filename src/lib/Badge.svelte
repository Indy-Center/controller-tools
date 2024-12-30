<script lang="ts">
	const { classes, children } = $props<{classes: string[]; children: any }>();
</script>

<div class="rounded-md px-2 py-1 text-xs font-medium {classes.join(' ')}">
	{@render children()}
</div>