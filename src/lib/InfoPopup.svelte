<script lang="ts">
	import ModalPopup from './ModalPopup.svelte';
	import MdiInfo from 'virtual:icons/mdi/info';
	import ThemeToggle from './ThemeToggle.svelte';
	import IndyLogo from '$lib/IndyLogo.svelte';
	import MdiBookOpenVariant from 'virtual:icons/mdi/book-open-variant';
	import MdiAccountConvert from 'virtual:icons/mdi/account-convert';
	import logo from '$lib/assets/vnas-logo.png';
	import ControllerChangeDiag from './ControllerChangeDiag.svelte';
	import PopupModal from './ModalPopup.svelte';
	let modal: any;
	let controllerPopup: any;
</script>

<button class="text-2xl text-white" onclick={() => modal.openModal()}>
	<MdiInfo />
</button>

<ModalPopup closeButton={true} bind:this={modal}>
	<div class="flex flex-col items-center gap-4 text-xl">
		<div class="hidden md:flex xl:basis-0">
			<div id="buttons" class="align-center ml-6 flex gap-3">
				<div class="tooltip w-8">
					<a class="text-3x" href="https://zidartcc.org" target="_blank">
						<IndyLogo />
						<span class="tooltip-text primary text-sm">Indy Center Website</span>
					</a>
				</div>
				<div class="tooltip">
					<a
						href="https://wiki.zidartcc.org/docs/home"
						target="_blank"
						class="text-3xl"
						aria-label="Controller Procedures"
					>
						<MdiBookOpenVariant />
						<span class="tooltip-text primary text-sm">vZID Controller Documents</span>
					</a>
				</div>
				<div class="tooltip w-8">
					<a
						href="https://crc.virtualnas.net/docs/#/"
						target="_blank"
						aria-label="CRC Documentation"
						class=""
					>
						<img src={logo} alt="vNAS Logo" width="30px" class="pt-1" />
						<span class="tooltip-text bg-zinc-900 text-sm">CRC Documentation</span>
					</a>
				</div>
				<div class="tooltip">
					<button
						onclick={() => controllerPopup.openModal()}
						aria-label="controller change popup"
						class="block text-3xl"
					>
						<MdiAccountConvert />
						<span class="tooltip-text bg-zinc-900 text-sm">Controller Change Procedures</span>
					</button>
				</div>
				<h3 class="mb-4 text-2xl font-bold">Settings</h3>
				<div class="flex items-center gap-2">
					<span>Toggle Theme:</span>
					<ThemeToggle />
				</div>
				<a
					href="http://wiki.zidartcc.org/docs/icct"
					target="_blank"
					rel="noopener noreferrer"
					class="underline hover:no-underline"
				>
					Read the user manual
				</a>
				<a
					href="https://github.com/Indy-Center/controller-tools/issues"
					target="_blank"
					rel="noopener noreferrer"
					class="underline hover:no-underline"
				>
					Report Issues on GitHub
				</a>
			</div>
		</div>
	</div>
</ModalPopup>

<PopupModal closeButton={true} bind:this={controllerPopup}>
	<ControllerChangeDiag />
</PopupModal>

<style>
	#buttons .tooltip {
		position: relative;
		display: inline-block;
	}

	#buttons .tooltip .tooltip-text {
		visibility: hidden;
		width: 120px;
		background-color: black;
		color: #fff;
		text-align: center;
		border-radius: 0.5rem;
		padding: 3px 0;
		top: 107%;
		left: 50%;
		margin-left: -60px;
		position: absolute;
		z-index: 40;
		opacity: 91%;
	}

	#buttons .tooltip:hover .tooltip-text {
		visibility: visible;
	}
</style>
