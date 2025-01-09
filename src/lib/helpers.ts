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

export function getFlightCategory(metar: string): 'VFR' | 'IFR' | 'MVFR' | 'LIFR' {
	// Regular expressions for visibility and cloud base
	const visibilityRegex = /(\d+)?\s?(\d+\/\d+)?SM/; // Look for visibility in statute miles (e.g., "10SM", "1/4SM", or "1 3/4SM")
	const cloudBaseRegex = /([BKN|OVC])(\d{3})/g; // Look for cloud layers like FEW015, BKN036, BKN100

	// Extract visibility and cloud bases
	const visibilityMatch = metar.match(visibilityRegex);
	const cloudBaseMatches = [...metar.matchAll(cloudBaseRegex)];

	// Parse visibility, handle fractional and mixed values like "1 3/4SM"
	let visibility = 10; // Default to 10SM if not found
	if (visibilityMatch) {
		const wholePart = visibilityMatch[1] ? parseInt(visibilityMatch[1], 10) : 0;
		const fractionPart = visibilityMatch[2]
			? (() => {
					const [numerator, denominator] = visibilityMatch[2].split('/').map(Number);
					return numerator / denominator;
				})()
			: 0;
		visibility = wholePart + fractionPart;
	}

	// Extract cloud base heights
	const cloudBaseHeights = cloudBaseMatches.map((match) => parseInt(match[2], 10));

	// Determine the lowest cloud base (if any)
	const lowestCloudBase = cloudBaseHeights.length > 0 ? Math.min(...cloudBaseHeights) : 99999;

	// Flight category determination based on cloud base and visibility
	if (visibility < 1 || lowestCloudBase < 5) {
		return 'LIFR'; // Low IFR: visibility < 1SM or cloud base < 500 feet
	} else if (visibility < 3 || lowestCloudBase < 10) {
		return 'IFR'; // IFR: visibility between 1-3SM or cloud base between 500-1000 feet
	} else if (visibility <= 5 || lowestCloudBase < 30) {
		return 'MVFR'; // MVFR: visibility between 3-5SM or cloud base between 1000-3000 feet
	} else {
		return 'VFR'; // VFR: visibility > 5SM and cloud base above 3000 feet
	}
}

export function getWindDirection(metar: string) {
	// Regex to match wind direction and speed with optional gusting winds
	const windRegex = /(\d{3})\s*\d{2,3}(G\d{2,3})?KT/;
	const match = metar.match(windRegex);

	if (match) {
		const direction = parseInt(match[1], 10); // Extract wind direction in degrees
		return direction;
	}
	return null; // If no wind data found
}

export function transformToAtis(input: VatsimDataResponse['atis'][number]): Atis {
	const facility = input.callsign.split('_')[0].toUpperCase();

	// Join `text_atis` into a single block of text
	const textAtis = input.text_atis.join(' ').replace(/\s+/g, ' ').trim();

	// Extract the ATIS letter, conditions, and NOTAMs
	const atisLetter = input.atis_code.toLowerCase();

	// Find the index of "NOTAMS" to split conditions from NOTAMs
	const notamsIndex = textAtis.toUpperCase().indexOf('NOTAMS');
	const airportConditions =
		notamsIndex !== -1 ? textAtis.slice(0, notamsIndex).trim() : textAtis.trim();
	const notams =
		notamsIndex !== -1
			? textAtis
					.slice(notamsIndex)
					.replace(/NOTAMS[\.\.\.]?/i, '')
					.trim()
			: '';

	return {
		facility,
		preset: 'NOISE', // Example, adjust if you have specific logic
		atisLetter,
		atisType: input.callsign.includes('D') ? 'departure' : 'combined', // Determine type from callsign
		airportConditions: airportConditions.replace(/\.\.\./g, '').trim(),
		notams: notams.replace(/\.\.\./g, '').trim(),
		timestamp: new Date(input.last_updated).toLocaleString(),
		version: '4.1.0-beta.1' // Example version, modify as needed
	};
}
