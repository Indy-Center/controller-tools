<script lang="ts">
	import ModalPopup from './ModalPopup.svelte';
	import MdiInfo from 'virtual:icons/mdi/bookmark-box-multiple-outline';
	import ThemeToggle from './ThemeToggle.svelte';
	import MdiBookOpenVariant from 'virtual:icons/mdi/book-open-variant';
	import MdiRadar from 'virtual:icons/mdi/radar';
	import MdiLink from 'virtual:icons/mdi/link';
	import MdiAccountConvert from 'virtual:icons/mdi/account-convert';
	import ControllerChangeDiag from './ControllerChangeDiag.svelte';
	import PopupModal from './ModalPopup.svelte';

	let modal: any;
	let controllerPopup: any;

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

<button class="text-2xl text-white" onclick={() => modal.openModal()}>
	<MdiInfo />
</button>

<ModalPopup closeButton={true} bind:this={modal}>
	<div class="flex flex-col gap-6">
		<div class="flex flex-col gap-2">
			<h1 class="font-bold">Quick Links</h1>
			{#each quickLinks as { link, title, Icon }}
				<a
					class="flex items-center gap-1 rounded-md p-1 text-3xl hover:bg-gray-100 dark:hover:bg-gray-800"
					href={link}
					target="_blank"
				>
					<Icon />
					<span class="text-sm">{title}</span>
				</a>
			{/each}
			<button
				onclick={() => controllerPopup.openModal()}
				aria-label="controller change popup"
				class="flex items-center gap-1 rounded-md p-1 text-3xl hover:bg-gray-100 dark:hover:bg-gray-800"
			>
				<MdiAccountConvert />
				<span class="text-sm">Controller Change Procedures</span>
			</button>
		</div>
		<div class="flex flex-col gap-2">
			<h2 class="font-bold">Settings</h2>
			<div class="flex items-center gap-1 rounded-md p-1">
				<span>Toggle Theme:</span>
				<ThemeToggle />
			</div>
		</div>
		<div>
			<a
				href="http://wiki.zidartcc.org/docs/icct"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm underline hover:no-underline"
			>
				Read the user manual
			</a>
			<a
				href="https://github.com/Indy-Center/controller-tools/issues"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm underline hover:no-underline"
			>
				Report Issues on GitHub
			</a>
		</div>
	</div>
</ModalPopup>

<PopupModal closeButton={true} bind:this={controllerPopup}>
	<ControllerChangeDiag />
</PopupModal>
