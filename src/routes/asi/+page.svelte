<script>
	import Atis from '$lib/Atis.svelte';

	const atisList = [
		{
			facility: 'KLAX',
			preset: 'NOISE',
			atisLetter: 't',
			atisType: 'combined',
			airportConditions:
				'ILS APP IN PROG RWY 6R OR VCTR FOR VIS APP WILL BE PROVIDED. OPPOSITE DRCTN TFC DEPTG RWY 25R.',
			notams:
				'ASDE-X SYSTEM IN USE. ACTIVATE TRANSPONDER WITH MODE C ON ALL TWYS AND RWYS. READBACK ALL RWY HOLD SHORT INSTRUCTIONS.',
			timestamp: '11/27/2024 15:39:59',
			version: '4.1.0-beta.1'
		}
	];
</script>

<!--To dos
- pull notam from awc based on facility
- Airport color coded to flight conditions.
- load the rest of our configs
- Implement vatis API end point to take a POST request in the same shape as the atis type.
- implement user interface for updating the configs
-->
<span>0101:32Z</span>

{#each atisList as a}
	<Atis {...a} />
{/each}
