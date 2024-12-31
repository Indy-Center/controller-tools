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
