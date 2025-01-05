// This removes the K from airport codes for APIs and visual applications that need just the FAA code.
export function sayNoToKilo(input: string): string | void {
	if (input[0]?.toLowerCase() === 'k') {
		return input.slice(1); // Remove that kilo
	}
	return input; // Return the string unchanged if it doesn't have the kilo
}

//this function should take a code and ensure its an ICAO code. This may not work in all cases, but the somewhat blind functionality is needed some weather APIs prefix all FAA codes with a K blindly...so..
//input: EGLL output: EGLL
//input: I69 output: KI69 -- not an ICAO needed for wx AIPs
//input: IND output: KIND
//input: KSDF output: KSDF
//input <3 or >4 errors
function processAirportCode(input: string): string | void {
	// Ensure the string length is valid
	if (input.length < 3 || input.length > 4) {
		console.error('Error: The string may not be an airport code.');
		return;
	}

	// Handle 3-character codes
	if (input.length === 3) {
		return `K${input.toUpperCase()}`; // Add 'K' and ensure uppercase
	}

	// Handle 4-character codes
	if (input.length === 4) {
		return input.toUpperCase(); // Return the string in uppercase
	}

	// Fallback (shouldn't reach here if logic is correct)
	console.error('Error: Unexpected input.');
}

// Define a function to determine the flight category based on METAR
export function getFlightCategory(metar: string): 'VFR' | 'IFR' | 'MVFR' | 'LIFR' {
	// Regular expressions for visibility and cloud base
	const visibilityRegex = /(\d{1,2})SM/; // Look for visibility in statute miles (e.g., "10SM")
	const cloudBaseRegex = /([BKN|OVC])(\d{3})/g; // Look for cloud layers like FEW015, BKN036, BKN100

	// Extract visibility and cloud bases
	const visibilityMatch = metar.match(visibilityRegex);
	const cloudBaseMatches = [...metar.matchAll(cloudBaseRegex)];

	const visibility = visibilityMatch ? parseInt(visibilityMatch[1]) : 10; // Default to 10SM if not found
	const cloudBaseHeights = cloudBaseMatches.map((match) => parseInt(match[2])); // Extract cloud base heights

	// Determine the lowest cloud base (if any)
	const lowestCloudBase = cloudBaseHeights.length > 0 ? Math.min(...cloudBaseHeights) : 99999;

	// Flight category determination based on cloud base and visibility
	if (visibility < 1 || lowestCloudBase < 5) {
		return 'LIFR'; // Low IFR: cloud base < 1000 feet (i.e., < 10 in hundreds of feet)
	} else if (visibility < 3 || lowestCloudBase < 5) {
		return 'IFR'; // IFR: cloud base between 1000-2000 feet (i.e., between 10 and 20 in hundreds of feet)
	} else if (visibility <= 5 || lowestCloudBase < 30) {
		return 'MVFR'; // MVFR: cloud base between 2000-3000 feet (i.e., between 20 and 30 in hundreds of feet)
	} else {
		return 'VFR'; // VFR: cloud base above 3000 feet (i.e., > 30 in hundreds of feet)
	}
}
