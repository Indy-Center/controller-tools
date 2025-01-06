<script lang="ts">
	import MdiChevronDown from 'virtual:icons/mdi/chevron-down';
	import MdiChevronUp from 'virtual:icons/mdi/chevron-up';
	import { writable } from 'svelte/store';

	let { status, onClose }: { status: boolean; onClose: Function } = $props();

	// State to track which sections are expanded
	const expandedSections = writable(new Set());

	// Function to toggle expansion of sections
	function toggleSection(index) {
		expandedSections.update((current) => {
			const newSet = new Set(current);
			if (newSet.has(index)) {
				newSet.delete(index);
			} else {
				newSet.add(index);
			}
			return newSet;
		});
	}

	// Task List Data
	const tasks = [
		{
			title: 'Airport/Airspace Conditions and Status',
			subtasks: ['Configuration', 'NOTAMs', 'ATIS letter/advertised information', 'TFRs']
		},
		{
			title: 'Staffing',
			subtasks: ['Adjacent/Above/Below staffing', 'Handoffs']
		},
		{
			title: 'Airport Activities',
			subtasks: ['Gate holds', 'Braking reports', 'Events']
		},
		{
			title: 'Weather',
			subtasks: ['General conditions and trends', 'PIREPs', 'SIGMETs/AIRMETs']
		},
		{
			title: 'Flow Control',
			subtasks: ['TMU initiatives', 'Coordinated restrictions', 'Delays']
		},
		{
			title: 'Training',
			subtasks: ['Known pilot/controller training', 'Over-the-Shoulder Evaluations']
		},
		{
			title: 'Traffic Information',
			subtasks: [
				'Status of all known aircraft in the airspace',
				'Mode C Intruders',
				'Aircraft released but not airborne',
				'Point-outs/APREQs',
				'Any information not current in data blocks'
			]
		}
	];
</script>

<div
	class:hidden={!status}
	class=" fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50"
>
	<div class="bg relative max-h-[90vh] w-4/5 overflow-y-auto rounded-lg p-6 shadow-lg">
		<h2 class="text-lg font-semibold">Position Relief Briefing</h2>
		<p class="p-4 text-center">
			Review specific procedures for opening, closing, and relieving positions in the <a
				href="https://wiki.zidartcc.org/docs/atc-handbook/briefings"
				target="_blank"
				class="underline"
				rel="noopener noreferrer">ATC Handbook</a
			>.
		</p>
		<!-- Popup Content -->
		<div class="mt-4 space-y-4">
			{#each tasks as task, index}
				<div class="border-secondary rounded-lg border shadow-sm">
					<!-- Checklist Item -->
					<div class="flex items-center justify-between bg-gray-100 px-4 py-2">
						<label class="flex items-center space-x-3">
							<input
								type="checkbox"
								class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span class="font-semibold">{task.title}</span>
						</label>

						<!-- Expand/Collapse Interface -->
						<button
							class="h-6 w-6 text-gray-600"
							aria-label="Toggle drawer"
							onclick={() => toggleSection(index)}
						>
							{#if $expandedSections.has(index)}
								<MdiChevronUp class="h-6 w-6" />
							{:else}
								<MdiChevronDown class="h-6 w-6" />
							{/if}
						</button>
					</div>

					<!-- Notes -->
					{#if $expandedSections.has(index)}
						<ul class="list-disc space-y-2 bg-white px-6 py-4">
							{#each task.subtasks as subtask}
								<li class="text-gray-700">{subtask}</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/each}
		</div>
		<!-- End Popup Content -->
		<button
			onclick={() => onClose()}
			class="primary absolute right-4 top-4 rounded px-4 py-2 text-white hover:bg-zinc-700"
		>
			X
		</button>
	</div>
</div>

<style>
</style>
