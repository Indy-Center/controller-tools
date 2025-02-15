<script lang="ts">
	import type { ControllersResponse } from '$lib/api/controllers';
	import dayjs from 'dayjs';
	import duration from 'dayjs/plugin/duration';
	import utc from 'dayjs/plugin/utc';

	dayjs.extend(duration);
	dayjs.extend(utc);

	let { controller }: { controller: ControllersResponse[number] } = $props();

	let formattedTime = $derived(dayjs.utc(controller.online_since).format('HH:mm'));

	let formattedDuration = $derived.by(() => {
		const logonMoment = dayjs.utc(controller.online_since);
		const now = dayjs.utc();

		const duration = now.diff(logonMoment); // Get the difference in milliseconds

		// Use dayjs to calculate the duration in various units
		const hours = dayjs.duration(duration).hours();
		const minutes = dayjs.duration(duration).minutes();

		// Create a fuzzy output
		let timeString = '';
		if (hours > 0) {
			timeString += `${hours} Hour${hours > 1 ? 's' : ''}`;
		}
		if (minutes > 0) {
			if (timeString) timeString += ', ';
			timeString += `${minutes} Minute${minutes > 1 ? 's' : ''}`;
		}

		return timeString || '< 1 minute'; // In case the duration is less than a minute
	});
</script>

<div class="w-full px-4 py-2">
	<div class="flex justify-between">
		<div class="font-medium text-content dark:text-content-dark">{controller.position}</div>
		<div class="font-light text-content dark:text-content-dark">
			{controller.controller.first_name}
			{controller.controller.last_name} ({controller.controller.operating_initials})
		</div>
	</div>
	<div class="flex justify-between">
		<div class="text-xs font-light text-content-secondary dark:text-content-dark-secondary">
			{formattedTime}
		</div>
		<div class="text-xs font-light text-content-secondary dark:text-content-dark-secondary">
			{formattedDuration}
		</div>
		<div class="text-xs font-light text-content-secondary dark:text-content-dark-secondary">
			{controller.frequency}
		</div>
	</div>
</div>
