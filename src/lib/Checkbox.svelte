<script lang="ts">
	let { id, label, checked = $bindable(), disabled = false } = $props();
</script>

<label for={id} class="text-md flex items-center space-x-1">
	<input
		class="form-checkbox h-4 w-4 rounded border-gray-400 bg-gray-200 align-middle text-gray-600 accent-zinc-600 focus:ring-gray-500"
		type="checkbox"
		{id}
		{disabled}
		bind:checked
	/>
	<span class="mt-[-2px] align-middle">{label}</span>
</label>
