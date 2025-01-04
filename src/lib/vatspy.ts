const dataUrl = 'https://api.vatsim.net/api/map_data/';

export async function fetchData() {
	const metadata = await fetch(`${dataUrl}`, {}).then((res) => res.json());

	const vatspyData = await fetch(metadata.vatspy_dat_url).then((res) => res.text());

	return parseDatFile(vatspyData);
}

type VatSpyData = {
	airports: {
		icao: string;
		name: string;
		latitude: number;
		longitude: number;
		iata: string;
		fir: string;
	}[];
};

async function parseDatFile(content: string): Promise<VatSpyData> {
	const lines = content
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '');

	let currentSection: string | null = null;
	const result: VatSpyData = { airports: [] };

	for (const line of lines) {
		if (line.startsWith('[') && line.endsWith(']')) {
			// It's a section header, e.g., [Airports]
			currentSection = line.substring(1, line.length - 1).toLowerCase();
		} else if (currentSection === 'airports' && !line.startsWith(';')) {
			// Skip comment lines (those starting with ;)
			const [icao, name, latitude, longitude, iata, fir] = line.split('|');
			result.airports.push({
				icao,
				name,
				latitude: parseFloat(latitude),
				longitude: parseFloat(longitude),
				iata,
				fir
			});
		}
	}

	return result;
}
