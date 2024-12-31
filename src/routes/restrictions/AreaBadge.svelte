<script lang="ts">
	import Badge from '$lib/Badge.svelte';

	let { label }: {label: string} = $props()

	const areaClassesMap: Record<string, string[]> = {
		'Area 1': ['text-red-500', 'bg-red-100', 'border-red-500', 'dark:text-red-300', 'dark:bg-red-700', 'dark:border-red-600'],
		'Area 2': ['text-yellow-500', 'bg-yellow-100', 'border-yellow-500', 'dark:text-yellow-300', 'dark:bg-yellow-700', 'dark:border-yellow-600'],
		'Area 3': ['text-green-500', 'bg-green-100', 'border-green-500', 'dark:text-green-300', 'dark:bg-green-700', 'dark:border-green-600'],
		'Area 4': ['text-blue-500', 'bg-blue-100', 'border-blue-500', 'dark:text-blue-300', 'dark:bg-blue-700', 'dark:border-blue-600'],
		'Area 5': ['text-indigo-500', 'bg-indigo-100', 'border-indigo-500', 'dark:text-indigo-300', 'dark:bg-indigo-700', 'dark:border-indigo-600'],
		'Area 6': ['text-purple-500', 'bg-purple-100', 'border-purple-500', 'dark:text-purple-300', 'dark:bg-purple-700', 'dark:border-purple-600'],
		'Area 7': ['text-pink-500', 'bg-pink-100', 'border-pink-500', 'dark:text-pink-300', 'dark:bg-pink-700', 'dark:border-pink-600'],
		'Area 8': ['text-gray-500', 'bg-gray-100', 'border-gray-500', 'dark:text-gray-300', 'dark:bg-gray-700', 'dark:border-gray-600'],
	}

	const defaultAreaClasses = ['text-zinc-500','bg-zinc-100', 'border-zinc-500'];
</script>

<Badge classes={areaClassesMap[label] || defaultAreaClasses}>{label}</Badge>