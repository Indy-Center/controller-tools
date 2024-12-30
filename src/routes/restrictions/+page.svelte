<script>
	const { data } = $props();
</script>

<svelte:head>
	<title>ICCT - Restrictions</title>
</svelte:head>

<div class="text-center">
	<table>
		<thead>
		<tr>
			<th>Airport</th>
			<th>Route</th>
			<th>From</th>
			<th>To</th>
			<th>Restriction</th>
			<th>Notes</th>
		</tr>
		</thead>
		<tbody>
		{#each data.restrictions as restriction}
			<tr>
				<td>{restriction.airport}</td>
				<td>{restriction.route}</td>
				<td>{restriction.from}</td>
				<td>{restriction.to}</td>
				<td>{restriction.restriction}</td>
				<td>{restriction.notes}</td>
			</tr>
		{/each}
		</tbody>
	</table>
</div>