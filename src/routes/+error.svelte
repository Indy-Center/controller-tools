<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="mt-4 flex items-center justify-center text-zinc-800">
	<div class="flex items-center justify-center text-3xl">
		<span class="font-thin">{page.status}</span>
		<span class="mx-2 font-thin">|</span>
		<div class="text-md text-center text-zinc-600">
			{page.error?.message || 'Something went wrong. Please try again later.'}
		</div>
	</div>
</div>
