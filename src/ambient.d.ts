type RestrictionFilters = {
	areas: string[];
	airport: string;
	includeIncoming: boolean;
};

type Atis = {
	facility: string;
	preset: string;
	atisLetter: string;
	atisType: string;
	airportConditions: string;
	notams: string;
	timestamp: string;
	version: string;
};

type PresetConfig = {
	departureRunway: string;
	arrivalRunway: string;
	approachesInUse: string[];
};
