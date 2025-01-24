<script lang="ts">
	type GroupColorPickerProps = {
		color: string;
		onColorChange: (color: string) => void;
	};

	let props: GroupColorPickerProps = $props();
</script>

<div class="mb-4 flex items-center gap-2">
	<label for="groupColor" class="mb-2 block font-medium text-content dark:text-content-dark"
		>Group Color</label
	>
	<input
		id="groupColor"
		type="color"
		value={props.color}
		class="h-8 w-8 cursor-pointer rounded"
		oninput={(e) => props.onColorChange(e.currentTarget.value)}
	/>
</div>
