<script lang="ts">
	import { goto } from '$app/navigation';
	import MdiAccountGroup from 'virtual:icons/mdi/account-group';
	import MdiMap from 'virtual:icons/mdi/map';
	import MdiTextureBox from 'virtual:icons/mdi/texture-box';
	import MdiAirplaneEdit from 'virtual:icons/mdi/airplane-edit';
	import MdiTableEdit from 'virtual:icons/mdi/table-edit';
	import MdiBookOpen from 'virtual:icons/mdi/book-open';
	import MdiGithub from 'virtual:icons/mdi/github';
	import MdiHelpCircle from 'virtual:icons/mdi/help-circle';

	const quickActions = [
		{
			title: 'Manage Users',
			description: 'Add, remove, or modify user permissions',
			icon: MdiAccountGroup,
			href: '/admin/users'
		},
		{
			title: 'Manage Areas',
			description: 'Define and edit operational areas',
			icon: MdiMap,
			href: '/admin/areas'
		},
		{
			title: 'Manage Splits',
			description: 'Create and modify airspace splits',
			icon: MdiTextureBox,
			href: '/admin/splits'
		},
		{
			title: 'Manage Restrictions',
			description: 'Set up traffic flow restrictions',
			icon: MdiAirplaneEdit,
			href: '/admin/restrictions'
		},
		{
			title: 'Table Export',
			description: 'Generate restriction tables',
			icon: MdiTableEdit,
			href: '/admin/restrictions/table-maker'
		}
	];

	const resources = [
		{
			title: 'Documentation',
			description: 'Read the user manual',
			icon: MdiBookOpen,
			href: 'http://wiki.zidartcc.org/docs/icct',
			external: true
		},
		{
			title: 'GitHub',
			description: 'Report issues or contribute',
			icon: MdiGithub,
			href: 'https://github.com/Indy-Center/controller-tools/issues',
			external: true
		},
		{
			title: 'Support',
			description: 'Get help with the tools',
			icon: MdiHelpCircle,
			href: 'http://wiki.zidartcc.org/docs/icct/support',
			external: true
		}
	];
</script>

<svelte:head>
	<title>ICT - Admin</title>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<h1 class="mb-8 text-2xl font-bold text-content dark:text-content-dark">
		Administration Dashboard
	</h1>

	<!-- Quick Actions -->
	<section class="mb-12">
		<h2 class="mb-4 text-lg font-semibold text-content dark:text-content-dark">Quick Actions</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each quickActions as action}
				<button
					onclick={() => goto(action.href)}
					class="flex items-start gap-4 rounded-lg border border-surface-tertiary bg-surface p-4 text-left transition-colors hover:border-accent hover:bg-surface-secondary dark:border-surface-dark-tertiary dark:bg-surface-dark dark:hover:border-accent-dark dark:hover:bg-surface-dark-secondary"
				>
					<svelte:component
						this={action.icon}
						class="h-6 w-6 shrink-0 text-content-secondary dark:text-content-dark-secondary"
					/>
					<div>
						<div class="font-medium text-content dark:text-content-dark">{action.title}</div>
						<div class="mt-1 text-sm text-content-secondary dark:text-content-dark-secondary">
							{action.description}
						</div>
					</div>
				</button>
			{/each}
		</div>
	</section>

	<!-- Resources -->
	<section>
		<h2 class="mb-4 text-lg font-semibold text-content dark:text-content-dark">Resources</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each resources as resource}
				<a
					href={resource.href}
					target={resource.external ? '_blank' : undefined}
					rel={resource.external ? 'noopener noreferrer' : undefined}
					class="flex items-start gap-4 rounded-lg border border-surface-tertiary bg-surface p-4 transition-colors hover:border-accent hover:bg-surface-secondary dark:border-surface-dark-tertiary dark:bg-surface-dark dark:hover:border-accent-dark dark:hover:bg-surface-dark-secondary"
				>
					<svelte:component
						this={resource.icon}
						class="h-6 w-6 shrink-0 text-content-secondary dark:text-content-dark-secondary"
					/>
					<div>
						<div class="font-medium text-content dark:text-content-dark">{resource.title}</div>
						<div class="mt-1 text-sm text-content-secondary dark:text-content-dark-secondary">
							{resource.description}
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>
</div>
