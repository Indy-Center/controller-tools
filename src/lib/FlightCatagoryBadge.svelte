<script lang="ts">
	const { category }: { category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR' } = $props();

	const colorMap = {
		VFR: 'border-green-500 bg-green-50 text-green-500 dark:border-green-300 dark:bg-green-800 dark:text-green-100',
		MVFR: 'border-blue-500 bg-blue-50 text-blue-500 dark:border-blue-300 dark:bg-blue-800 dark:text-blue-100',
		IFR: 'border-red-500 bg-red-50 text-red-500 dark:border-red-300 dark:bg-red-800 dark:text-red-100',
		LIFR: 'border-pink-500 bg-pink-50 text-pink-500 dark:border-pink-300 dark:bg-pink-800 dark:text-pink-100'
	};
</script>

<div class="rounded-md px-2 py-1 text-xs font-medium ${colorMap[category]}">
	{category}
</div>
