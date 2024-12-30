<script lang="ts">
	const { restriction }: { restriction: any} = $props()
</script>

<div class="flex border-b border-b-zinc-200 last:border-0 text-sm">
	<div class="w-5/12">{restriction.route}</div>
	<div class="w-1/12">{restriction.from}</div>
	<div class="w-1/12">{restriction.to}</div>
	<div class="w-3/12">{restriction.restriction}</div>
	<div class="w-2/12">{restriction.notes}</div>
</div>