<script lang="ts">
	import { sayNoToKilo } from './helpers';
	import atisConfigs from './atisConfigs.json';

	let atis: Atis = $props();

	function getPresetConfig(atis: Atis): PresetConfig | null {
		const facilityConfig = atisConfigs[atis.facility];

		if (!facilityConfig) {
			console.error(`Error: Facility ${atis.facility} not found.`);
			return null;
		}

		const presetConfig = facilityConfig.presets[atis.preset];

		if (!presetConfig) {
			console.error(`Error: Preset ${atis.preset} not found for facility ${atis.facility}.`);
			return null;
		}

		return presetConfig;
	}

	const config = getPresetConfig(atis);
</script>

<table
	class="text-grey-100 w-1/4 border-separate border bg-zinc-500 font-medium text-white dark:bg-zinc-700"
>
	<tbody>
		<tr>
			<td class="border text-center align-middle">{sayNoToKilo(atis.facility.toUpperCase())}</td>
			<td class="border bg-zinc-200 p-2 text-zinc-900 dark:bg-zinc-900" rowspan="3"
				>KLAX 311853Z 26003KT 4SM BR FEW009 SCT013 BKN140 12/09 A3010 RMK AO2 SLP191 T01220094 $</td
			>
			<td class="border text-center align-middle">{config?.arrivalRunway}</td>
		</tr>
		<tr>
			<td class="border text-center align-middle text-5xl font-bold" rowspan="2"
				>{atis.atisLetter.toUpperCase()}</td
			>
			<td class="border text-center align-middle">{config?.departureRunway}</td>
		</tr>
		<tr>
			<td class="border text-center align-middle" class:bg-green-700={true}
				>{config?.approachesInUse}</td
			>
		</tr>
		<tr>
			<td class="border" rowspan="2">NOTAMS</td>
			<td class="border bg-zinc-200 p-2 p-2 text-zinc-900 dark:bg-zinc-900" colspan="2" rowspan="2"
				>{atis.notams}</td
			>
		</tr>
		<tr></tr><!--This empty row keeps the bottom boarder from skipping town-->
	</tbody>
</table>
