<script lang="ts">
	let { icon: Icon, message } = $props<{
		icon: any;
		message: string;
	}>();
</script>

<div class="mx-auto w-full max-w-md px-4 sm:px-0">
	<div
		class="flex flex-col items-center justify-center rounded-lg border border-surface-tertiary bg-surface p-8 shadow-sm transition-all dark:border-surface-dark-tertiary dark:bg-surface-dark"
	>
		<div class="mb-4 h-12 w-12 text-content-secondary dark:text-content-dark-secondary">
			<Icon class="h-full w-full"></Icon>
		</div>
		<p class="text-center text-content-secondary dark:text-content-dark-secondary">{message}</p>
	</div>
</div>
