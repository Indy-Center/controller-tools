<script lang="ts">
	import AddUpdateRestrictionForm from './AddUpdateRestrictionForm.svelte';
	import ConfirmationModal from '$lib/ConfirmationModal.svelte';
	import MdiIcon from '$lib/components/MdiIcon.svelte';

	let { data } = $props();

	let restrictionForm: ReturnType<typeof AddUpdateRestrictionForm>;
	let confirmModal: ReturnType<typeof ConfirmationModal>;
	let searchQuery = $state('');

	let filteredRestrictions = $derived.by(() => {
		return data.restrictions.filter((r) => {
			if (searchQuery !== '') {
				return `${r.airport} ${r.route} ${r.priority}`
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
	<title>ICT - Restrictions Management</title>
</svelte:head>

<AddUpdateRestrictionForm {data} areas={data.areas} bind:this={restrictionForm} />
<ConfirmationModal
	bind:this={confirmModal}
	action="?/delete"
	message="Are you sure you want to delete this restriction? This action cannot be undone."
/>

<div class="flex h-full w-full flex-col space-y-6 p-6">
	<!-- Header Section -->
	<div class="flex flex-col gap-y-2">
		<h1 class="text-2xl font-bold text-content dark:text-content-dark">Restrictions Management</h1>
		<p class="text-content-secondary dark:text-content-dark-secondary">
			Configure airspace restrictions based on Letters of Agreement (LOAs) and Standard Operating
			Procedures (SOPs). These restrictions help ensure compliance with inter-facility coordination
			requirements.
		</p>
	</div>

	<!-- Search and Add Section -->
	<div class="flex items-center gap-4">
		<div class="relative flex-1">
			<MdiIcon
				name="magnify"
				class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-content-tertiary dark:text-content-dark-tertiary"
			/>
			<input
				type="text"
				placeholder="Search restrictions..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-surface-tertiary bg-surface py-2.5 pl-10 pr-3 text-sm text-content shadow-sm transition-all placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-surface-dark-tertiary dark:bg-surface-dark dark:text-content-dark dark:placeholder:text-content-dark-tertiary dark:focus:border-accent-dark dark:focus:ring-accent-dark/20"
			/>
		</div>
		<button
			type="button"
			onclick={() => restrictionForm.create()}
			class="flex items-center justify-center gap-2 rounded-md bg-action-success px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
		>
			<MdiIcon name="plus-thick" />
			<span>Add Restriction</span>
		</button>
	</div>

	<!-- Restrictions Table -->
	<div class="rounded-lg border border-surface-tertiary dark:border-surface-dark-tertiary">
		<!-- Header Row -->
		<div
			class="hidden grid-cols-5 items-center rounded-t-lg border border-surface-tertiary bg-surface-secondary p-4 font-medium text-content md:grid lg:grid-cols-10 dark:border-surface-dark-tertiary dark:bg-surface-dark-secondary dark:text-content-dark"
		>
			<div>Airport</div>
			<div>Route</div>
			<div>Priority</div>
			<div>From</div>
			<div>Restriction</div>
			<div>To</div>
			<div>Notes</div>
			<div>Validity</div>
			<div>Actions</div>
		</div>

		<!-- Restrictions List -->
		<div
			class="divide-y divide-surface-tertiary rounded-b-lg border-x border-b border-surface-tertiary bg-surface shadow-sm dark:divide-surface-dark-tertiary dark:border-surface-dark-tertiary dark:bg-surface-dark"
		>
			{#each filteredRestrictions as restriction (restriction.id)}
				<div class="flex grid-cols-5 flex-col items-start gap-2 p-4 md:grid lg:grid-cols-10">
					<div class="font-medium text-content dark:text-content-dark">{restriction.airport}</div>
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
							class="rounded-md bg-action-primary px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-sky-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20"
							onclick={() => restrictionForm.edit(restriction)}
						>
							<MdiIcon name="pencil" />
						</button>
						<button
							onclick={() => confirmModal.prompt({ id: restriction.id })}
							class="rounded-md bg-action-danger px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500/20"
						>
							<MdiIcon name="delete" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
