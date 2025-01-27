import { adarRecordsTable } from '$lib/db/schema';
import { db } from '$lib/server/db';

export async function load() {
	const records = await db.select().from(adarRecordsTable).orderBy(adarRecordsTable.order);

	// Sort records by departure and arrival airports
	return {
		records: records.sort((a, b) => {
			// First compare by departure airports
			const aDep = (a.departureAirports as string[])[0] || '';
			const bDep = (b.departureAirports as string[])[0] || '';
			if (aDep !== bDep) return aDep.localeCompare(bDep);

			// Then by arrival airports
			const aArr = (a.arrivalAirports as string[])[0] || '';
			const bArr = (b.arrivalAirports as string[])[0] || '';
			return aArr.localeCompare(bArr);
		})
	};
}
