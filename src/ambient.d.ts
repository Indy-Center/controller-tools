type RestrictionFilters = {
	areas: string[];
	search: string;
};

type RestrictionConfig = {
	includeIncoming: boolean;
	hideInternal: boolean;
	dimIncoming: boolean;
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

type VatsimDataResponse = {
	atis: {
		cid: number;
		name: string;
		callsign: string;
		frequency: string;
		facility: number;
		rating: number;
		server: string;
		visual_range: number;
		atis_code: string;
		text_atis: string[];
		last_updated: string;
	}[];
};

type PresetConfig = {
	departureRunway: string;
	arrivalRunway: string;
	approachesInUse: string[];
};

type Airport = {
	icao: string;
	name: string;
	latitude: number;
	longitude: number;
	fir: string;
};

type Metar = {
	id: string;
	metar: string;
};

type Controller = {
	callsign: string;
	name: string;
	logon_time: string;
};

type User = {
	cid: string;
	firstName: string;
	lastName: string;
	isAdmin: boolean;
};
