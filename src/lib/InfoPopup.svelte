<script lang="ts">
	import MdiInfo from 'virtual:icons/mdi/bookmark-box-multiple-outline';
	import ThemeToggle from './ThemeToggle.svelte';
	import MdiBookOpenVariant from 'virtual:icons/mdi/book-open-variant';
	import MdiRadar from 'virtual:icons/mdi/radar';
	import MdiLink from 'virtual:icons/mdi/link';
	import MdiAccountConvert from 'virtual:icons/mdi/account-convert';
	import ControllerChangeDiag from './ControllerChangeDiag.svelte';
	import Modal from './Modal.svelte';

	let modal: ReturnType<typeof Modal>;
	let controllerPopup: ReturnType<typeof Modal>;

	const quickLinks = [
		{ title: 'Indy Center Website', link: 'https://zidartcc.org', Icon: MdiLink },
		{
			title: 'vZID Controller Documents',
			link: 'https://wiki.zidartcc.org/docs/home',
			Icon: MdiBookOpenVariant
		},
		{ title: 'CRC Documentation', link: 'https://crc.virtualnas.net/docs/#/', Icon: MdiRadar }
	];
</script>

<button
	class="text-accent-secondary dark:text-accent-dark-secondary hover:text-accent text-2xl transition-colors duration-300 dark:hover:text-accent-dark"
	onclick={() => modal.open()}
>
	<MdiInfo />
</button>

<Modal title="Information" bind:this={modal}>
	<div class="flex flex-col gap-6">
		<div class="flex flex-col gap-2">
			<h1 class="text-content dark:text-content-dark font-bold">Quick Links</h1>
			{#each quickLinks as { link, title, Icon }}
				<a
					class="text-content dark:text-content-dark hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary flex items-center gap-1 rounded-md p-1 text-3xl"
					href={link}
					target="_blank"
				>
					<Icon />
					<span class="text-sm">{title}</span>
				</a>
			{/each}
			<button
				onclick={() => controllerPopup.open()}
				aria-label="controller change popup"
				class="text-content dark:text-content-dark hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary flex items-center gap-1 rounded-md p-1 text-3xl"
			>
				<MdiAccountConvert />
				<span class="text-sm">Controller Change Procedures</span>
			</button>
		</div>
		<div class="flex flex-col gap-2">
			<h2 class="text-content dark:text-content-dark font-bold">Settings</h2>
			<div class="text-content dark:text-content-dark flex items-center gap-1 rounded-md p-1">
				<span>Toggle Theme:</span>
				<ThemeToggle />
			</div>
		</div>
		<div class="flex flex-col gap-2">
			<a
				href="http://wiki.zidartcc.org/docs/icct"
				target="_blank"
				rel="noopener noreferrer"
				class="text-content dark:text-content-dark text-sm underline hover:no-underline"
			>
				Read the user manual
			</a>
			<a
				href="https://github.com/Indy-Center/controller-tools/issues"
				target="_blank"
				rel="noopener noreferrer"
				class="text-content dark:text-content-dark text-sm underline hover:no-underline"
			>
				Report Issues on GitHub
			</a>
		</div>
	</div>
</Modal>

<Modal title="Controller Change Procedures" bind:this={controllerPopup}>
	<ControllerChangeDiag />
</Modal>
