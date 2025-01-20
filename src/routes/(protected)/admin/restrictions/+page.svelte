<script lang="ts">
	import MdiPencil from 'virtual:icons/mdi/pencil';
	import MdiDelete from 'virtual:icons/mdi/delete';
	import MdiPlusThick from 'virtual:icons/mdi/plus-thick';
	import AddUpdateRestrictionForm from './AddUpdateRestrictionForm.svelte';
	import ConfirmationModal from '$lib/ConfirmationModal.svelte';

	let { data } = $props();

	let restrictionForm: ReturnType<typeof AddUpdateRestrictionForm>;
	let confirmModal: ReturnType<typeof ConfirmationModal>;
	let searchQuery = $state('');

	let filteredRestrictions = $derived.by(() => {
		return data.restrictions.filter((r) => {
			if (searchQuery !== '') {
				return `${r.airport} ${r.route} ${r.priority} ${r.from} ${r.restriction} ${r.to}`
					.toLowerCase()
					.includes(searchQuery.toLowerCase());
			}
			return true;
		});
	});

	async function deleteRestriction(id: string) {
		const formData = new FormData();
		formData.append('id', id);

		await fetch('?/delete', {
			method: 'POST',
			body: formData
		});
	}
</script>

<svelte:head>
	<title>ICCT - Restrictions Management</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<AddUpdateRestrictionForm {data} areas={data.areas} bind:this={restrictionForm} />
	<ConfirmationModal
		bind:this={confirmModal}
		action="?/delete"
		message="Are you sure you want to delete this restriction? This action cannot be undone."
	/>

	<h1 class="text-content dark:text-content-dark text-2xl font-bold">Restrictions Management</h1>

	<!-- Search Box and Add Button -->
	<div class="flex flex-col gap-2">
		<input
			type="text"
			placeholder="Search by airport, route, or priority"
			bind:value={searchQuery}
			class="border-surface-tertiary focus:ring-surface-tertiary dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark w-full rounded-md border p-2 text-sm focus:outline-none focus:ring"
		/>
		<button
			class="bg-action-success flex items-center justify-center rounded px-4 py-2 text-sm text-white hover:bg-green-600 focus:ring focus:ring-green-300"
			onclick={() => restrictionForm.create()}
		>
			<MdiPlusThick class="mr-2" />
			Add Restriction
		</button>
	</div>

	<!-- Header Row -->
	<div class="hidden grid-cols-5 items-center p-4 font-semibold md:grid lg:grid-cols-10">
		<div class="text-content dark:text-content-dark">Airport</div>
		<div class="text-content dark:text-content-dark">Route</div>
		<div class="text-content dark:text-content-dark">Priority</div>
		<div class="text-content dark:text-content-dark">From</div>
		<div class="text-content dark:text-content-dark">Restriction</div>
		<div class="text-content dark:text-content-dark">To</div>
		<div class="text-content dark:text-content-dark">Notes</div>
		<div class="text-content dark:text-content-dark">Validity</div>
		<div class="text-content dark:text-content-dark">Actions</div>
	</div>

	<!-- Restrictions List -->
	<div
		class="divide-surface-tertiary border-surface-tertiary dark:divide-surface-dark-tertiary dark:border-surface-dark-tertiary divide-y rounded-md border"
	>
		{#each filteredRestrictions as restriction (restriction.id)}
			<div class="flex grid-cols-5 flex-col items-start gap-1 p-2 md:grid lg:grid-cols-10 lg:p-4">
				<div class="text-content dark:text-content-dark font-bold">{restriction.airport}</div>
				<div class="text-content dark:text-content-dark">{restriction.route}</div>
				<div class="text-content dark:text-content-dark">{restriction.priority}</div>
				<div class="text-content dark:text-content-dark">{restriction.from}</div>
				<div class="text-content dark:text-content-dark">{restriction.restriction}</div>
				<div class="text-content dark:text-content-dark">{restriction.to}</div>
				<div class="text-content dark:text-content-dark">{restriction.notes}</div>
				<div class="text-content dark:text-content-dark">{restriction.validAt || 'N/A'}</div>
				<div class="flex space-x-2">
					<button
						type="button"
						class="text-md bg-action-primary rounded p-2 text-white hover:bg-sky-600 focus:ring focus:ring-sky-300"
						onclick={() => restrictionForm.edit(restriction)}
					>
						<MdiPencil />
					</button>
					<button
						onclick={() => confirmModal.prompt({ id: restriction.id })}
						class="text-md bg-action-danger rounded p-2 text-white hover:bg-red-600 focus:ring focus:ring-red-300"
					>
						<MdiDelete />
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>
