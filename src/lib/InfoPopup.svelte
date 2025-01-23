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
	class="text-2xl text-accent-secondary transition-colors duration-300 hover:text-accent dark:text-accent-dark-secondary dark:hover:text-accent-dark"
	onclick={() => modal.open()}
>
	<MdiInfo />
</button>

<Modal title="Information" bind:this={modal}>
	<div class="flex flex-col gap-6">
		<div class="flex flex-col gap-2">
			<h1 class="font-bold text-content dark:text-content-dark">Quick Links</h1>
			{#each quickLinks as { link, title, Icon }}
				<a
					class="flex items-center gap-1 rounded-md p-1 text-3xl text-content hover:bg-surface-secondary dark:text-content-dark dark:hover:bg-surface-dark-secondary"
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
				class="flex items-center gap-1 rounded-md p-1 text-3xl text-content hover:bg-surface-secondary dark:text-content-dark dark:hover:bg-surface-dark-secondary"
			>
				<MdiAccountConvert />
				<span class="text-sm">Controller Change Procedures</span>
			</button>
		</div>
		<div class="flex flex-col gap-2">
			<h2 class="font-bold text-content dark:text-content-dark">Settings</h2>
			<div class="flex items-center gap-1 rounded-md p-1 text-content dark:text-content-dark">
				<span>Toggle Theme:</span>
				<ThemeToggle />
			</div>
		</div>
		<div class="flex flex-col gap-2">
			<a
				href="http://wiki.zidartcc.org/docs/icct"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-content underline hover:no-underline dark:text-content-dark"
			>
				Read the user manual
			</a>
			<a
				href="https://github.com/Indy-Center/controller-tools/issues"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-content underline hover:no-underline dark:text-content-dark"
			>
				Report Issues on GitHub
			</a>
		</div>
	</div>
</Modal>

<Modal title="Controller Change Procedures" bind:this={controllerPopup}>
	<ControllerChangeDiag />
</Modal>
