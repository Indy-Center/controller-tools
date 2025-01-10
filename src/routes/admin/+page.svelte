<script lang="ts">
	import { applyAction } from '$app/forms';

	let { data } = $props();
</script>

{JSON.stringify(data)}
<form class="header-nav-item" action="/logout" method="POST">
	<button type="submit">logout</button>
</form>
