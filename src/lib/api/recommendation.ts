import { adarRecordsTable, type AdarRecord } from '$lib/db/schema';
import { db } from '$lib/server/db';
import type { FlightPlan, VatsimFlightPlan } from './flightPlans';

let adar: AdarRecord[] = [];

export async function evaluateFlightPlans(flightPlans: FlightPlan[]): Promise<Recommendation[]> {
	adar = await db.select().from(adarRecordsTable).orderBy(adarRecordsTable.order);

	const recommendations: Recommendation[] = [];

	for (const flightPlan of flightPlans) {
		const recommendation = evaluateFlightPlan(flightPlan);
		recommendations.push(recommendation);
	}

	return recommendations;
}

export function evaluateFlightPlan(flightPlan: FlightPlan): Recommendation {
	// Find all records for the departure airport and arrival airport
	const matches = adar.filter((record: any) => {
		return (
			record.departureAirports.includes(flightPlan.flight_plan.departure) &&
			record.arrivalAirports.includes(flightPlan.flight_plan.arrival)
		);
	});

	// No matches, then we don't have any recommendations to make.
	if (matches.length === 0) {
		return {
			status: 'no_match',
			cid: flightPlan.cid,
			name: flightPlan.name,
			callsign: flightPlan.callsign,
			departure: flightPlan.flight_plan.departure,
			arrival: flightPlan.flight_plan.arrival,
			originalFlightPlan: flightPlan.flight_plan
		};
	}

	// Check if the route matches, if it does return success
	if (
		matches.some(
			(match) =>
				parseRecommendationRoute(match.routeString) ===
					parseVatsimRoute(flightPlan.flight_plan.route) &&
				// Altitude must be between the range if one exists
				isAltitudeInRange(flightPlan, match) &&
				// They must also be RNAV Capable if it's an RNAV match
				isRnavCapable(flightPlan.flight_plan.aircraft_faa) &&
				(match.starId || match.departureId)
		)
	) {
		return {
			status: 'success',
			cid: flightPlan.cid,
			name: flightPlan.name,
			callsign: flightPlan.callsign,
			departure: flightPlan.flight_plan.departure,
			arrival: flightPlan.flight_plan.arrival,
			originalFlightPlan: flightPlan.flight_plan
		};
	}

	if (matches.length) {
		const recommendedMatch = recommendRoute(flightPlan, matches);

		if (!recommendedMatch) {
			return {
				status: 'success',
				cid: flightPlan.cid,
				name: flightPlan.name,
				callsign: flightPlan.callsign,
				departure: flightPlan.flight_plan.departure,
				arrival: flightPlan.flight_plan.arrival,
				originalFlightPlan: flightPlan.flight_plan
			};
		}

		// Determine if the user's altitude is in range for the recommended route
		const userAlt = parseInt(flightPlan.flight_plan.altitude, 10);
		const minAlt = recommendedMatch.lowerAltitude ?? 0;
		const maxAlt = recommendedMatch.upperAltitude ?? 99000;
		let suggestedAltitude: string | undefined = undefined;
		if (userAlt < minAlt) {
			suggestedAltitude = minAlt.toString();
		} else if (userAlt > maxAlt) {
			suggestedAltitude = maxAlt.toString();
		}

		return {
			status: 'needs_reroute',
			cid: flightPlan.cid,
			name: flightPlan.name,
			callsign: flightPlan.callsign,
			departure: flightPlan.flight_plan.departure,
			arrival: flightPlan.flight_plan.arrival,
			originalFlightPlan: flightPlan.flight_plan,
			recommendedFlightPlan: {
				route: parseRecommendationRoute(recommendedMatch.routeString) || undefined,
				lowerAltitude: recommendedMatch.lowerAltitude,
				upperAltitude: recommendedMatch.upperAltitude,
				altitude: suggestedAltitude
			}
		};
	}

	return {
		status: 'no_match',
		cid: flightPlan.cid,
		name: flightPlan.name,
		callsign: flightPlan.callsign,
		departure: flightPlan.flight_plan.departure,
		arrival: flightPlan.flight_plan.arrival,
		originalFlightPlan: flightPlan.flight_plan
	};
}

function isAltitudeInRange(flightPlan: FlightPlan, match: AdarRecord): boolean {
	console.log(
		`Checking if ${flightPlan.flight_plan.altitude} is in range ${match.lowerAltitude} - ${match.upperAltitude}`
	);
	return (
		parseInt(flightPlan.flight_plan.altitude, 10) >= (match.lowerAltitude ?? 0) &&
		parseInt(flightPlan.flight_plan.altitude, 10) <= (match.upperAltitude ?? 99000)
	);
}

// The recommendation routes look like this '.MEARZ7.BVT..VINNE..BRAVE..EXARR
// We want to parse this into the VATSIM format of 'MEARZ7 BVT VINNE BRAVE EXARR'
function parseRecommendationRoute(route: string | null): VatsimFlightPlan['route'] | null {
	if (!route) {
		return null;
	}

	// Replace dots and double dots with a single space
	return route.replace(/\.+/g, ' ').trim();
}

// The VATSIM route looks like BVT EON JOT DPA which is usually good.
// Sometimes there are extra things like step climbs that we need to parse out
function parseVatsimRoute(route: string): VatsimFlightPlan['route'] {
	// Remove DCT from the route strings, handling all cases with a single pattern
	return route.replace(/\s*\/?\w*DCT\w*\/?\s*/g, ' ').trim();
}

// We can check the equipment code to determine if they're RNAV Capable
function isRnavCapable(aircraft: string): boolean {
	const RNAV_EQUIPMENT_CODES = ['L', 'Z', 'I', 'G'];
	return RNAV_EQUIPMENT_CODES.some((code) => aircraft.includes(`/${code}`));
}

// If the route from the flight plan doesn't match any in the matches, then we
// need to suggest one based on the equipment code. If they've filed a matching one,
// no recommendations are needed.
function recommendRoute(flightPlan: FlightPlan, matches: AdarRecord[]): AdarRecord | null {
	const requestedAltitude = parseInt(flightPlan.flight_plan.altitude, 10);

	// Filter matches by altitude range
	const altitudeFiltered = matches.filter((match) => {
		const min = match.lowerAltitude ?? 0;
		const max = match.upperAltitude ?? 99000;
		return requestedAltitude >= min && requestedAltitude <= max;
	});

	// Check if the route matches any of the matches (with altitude filter)
	const matchingMatch: AdarRecord | undefined = altitudeFiltered.find((match) => {
		return (
			parseRecommendationRoute(match.routeString) === flightPlan.flight_plan.route &&
			requestedAltitude >= (match.lowerAltitude ?? 0) &&
			requestedAltitude <= (match.upperAltitude ?? 99000)
		);
	});

	if (matchingMatch) {
		console.log(
			`Route matches for ${flightPlan.callsign} ${flightPlan.flight_plan.route} matches ${matchingMatch.routeString}`
		);
		// If the route matches, then we don't need to recommend anything
		return null;
	}

	// If no match for their altitude, but a route exists for a different altitude, suggest the closest valid altitude
	let suggestedMatch: AdarRecord | null = null;
	let suggestedAltitude: number | undefined = undefined;
	for (const match of matches) {
		const min = match.lowerAltitude ?? 0;
		const max = match.upperAltitude ?? 99000;
		if (requestedAltitude < min) {
			suggestedMatch = match;
			suggestedAltitude = min;
			break;
		} else if (requestedAltitude > max) {
			suggestedMatch = match;
			suggestedAltitude = max;
			break;
		}
	}

	if (suggestedMatch) {
		return suggestedMatch;
	}

	if (isRnavCapable(flightPlan.flight_plan.aircraft_faa)) {
		const rnavMatch: AdarRecord | undefined = altitudeFiltered.find(
			(match) => match.starId || match.departureId
		);
		if (rnavMatch) {
			return rnavMatch;
		}
	}

	const nonRnavMatch: AdarRecord | undefined = altitudeFiltered.find(
		(match) => !match.starId && !match.departureId
	);
	if (nonRnavMatch) {
		return nonRnavMatch;
	}

	return null;
}

export type Recommendation = {
	cid: number;
	name: string;
	callsign: string;
	status: 'success' | 'needs_reroute' | 'no_match';
	departure: string;
	arrival: string;
	originalFlightPlan: VatsimFlightPlan;
	recommendedFlightPlan?: Partial<Pick<VatsimFlightPlan, 'route' | 'remarks' | 'altitude'>> & {
		lowerAltitude?: number;
		upperAltitude?: number;
	};
};
