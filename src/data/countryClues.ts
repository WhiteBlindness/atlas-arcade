// Progressive-clue data for the GeoRadar (Globle) Atlas Jackpot round.
// Keyed by ISO 3166-1 numeric (must match src/data/countries.ts). Capital comes
// from COUNTRY_META and hemisphere/initial are derived — this file adds the
// harder tiers: region, population, and a fun fact. The mashup mystery pool is
// restricted to these well-known countries so every difficulty tier stays fair.

export interface CountryClue {
  region: string;
  population: number; // approximate, for a "~NNN M" hint
  funFact: string;
}

export const COUNTRY_CLUES: Record<number, CountryClue> = {
  840: { region: "North America",       population: 335_000_000, funFact: "Has no official national language at the federal level." },
  826: { region: "Northern Europe",     population: 67_000_000,  funFact: "Its postboxes and phone booths made red a national symbol." },
  250: { region: "Western Europe",      population: 68_000_000,  funFact: "The most-visited country in the world by tourists." },
  276: { region: "Western Europe",      population: 84_000_000,  funFact: "The autobahn has stretches with no speed limit." },
  724: { region: "Southern Europe",     population: 48_000_000,  funFact: "Home to the world's oldest still-operating restaurant." },
  380: { region: "Southern Europe",     population: 59_000_000,  funFact: "Fully surrounds two other countries entirely." },
  620: { region: "Southern Europe",     population: 10_000_000,  funFact: "One of the oldest fixed borders in Europe." },
  528: { region: "Western Europe",      population: 18_000_000,  funFact: "About a quarter of its land sits below sea level." },
  56:  { region: "Western Europe",      population: 12_000_000,  funFact: "Invented the modern comic strip and produces famous chocolate." },
  756: { region: "Western Europe",      population: 9_000_000,   funFact: "Has four official national languages." },
  40:  { region: "Western Europe",      population: 9_000_000,   funFact: "The waltz and Mozart both call it home." },
  752: { region: "Northern Europe",     population: 10_000_000,  funFact: "Has the most islands of any country on Earth." },
  578: { region: "Northern Europe",     population: 5_000_000,   funFact: "The midnight sun shines here all summer." },
  208: { region: "Northern Europe",     population: 6_000_000,   funFact: "Regularly ranks among the happiest countries." },
  246: { region: "Northern Europe",     population: 6_000_000,   funFact: "Has more saunas than cars." },
  372: { region: "Northern Europe",     population: 5_000_000,   funFact: "The only country with a harp as its national symbol." },
  616: { region: "Eastern Europe",      population: 38_000_000,  funFact: "Home to Europe's oldest salt mine still tourable today." },
  300: { region: "Southern Europe",     population: 10_000_000,  funFact: "Birthplace of the Olympic Games and democracy." },
  804: { region: "Eastern Europe",      population: 38_000_000,  funFact: "The largest country entirely within Europe." },
  643: { region: "Eastern Europe",      population: 144_000_000, funFact: "The largest country on Earth, spanning 11 time zones." },
  792: { region: "Middle East",         population: 85_000_000,  funFact: "Straddles two continents across a single strait." },
  352: { region: "Northern Europe",     population: 380_000,     funFact: "Runs almost entirely on renewable geothermal energy." },
  76:  { region: "South America",       population: 216_000_000, funFact: "Home to most of the Amazon rainforest." },
  32:  { region: "South America",       population: 46_000_000,  funFact: "Home to both the highest and lowest points of the Americas." },
  484: { region: "North America",       population: 129_000_000, funFact: "Introduced chocolate, chilis and corn to the world." },
  124: { region: "North America",       population: 39_000_000,  funFact: "Has the longest coastline of any country." },
  152: { region: "South America",       population: 20_000_000,  funFact: "Home to the driest non-polar desert on Earth." },
  170: { region: "South America",       population: 52_000_000,  funFact: "The world's second most biodiverse country." },
  604: { region: "South America",       population: 34_000_000,  funFact: "Birthplace of the potato and Machu Picchu." },
  192: { region: "North America",       population: 11_000_000,  funFact: "The largest island in the Caribbean." },
  156: { region: "East Asia",           population: 1_411_000_000, funFact: "Its Great Wall stretches over 21,000 km." },
  392: { region: "East Asia",           population: 124_000_000, funFact: "Has the world's oldest continuous monarchy." },
  356: { region: "South Asia",          population: 1_428_000_000, funFact: "The world's most populous country." },
  410: { region: "East Asia",           population: 52_000_000,  funFact: "Has the fastest average internet in the world." },
  764: { region: "Southeast Asia",      population: 72_000_000,  funFact: "The only Southeast Asian nation never colonized." },
  704: { region: "Southeast Asia",      population: 99_000_000,  funFact: "The world's largest exporter of cashew nuts." },
  360: { region: "Southeast Asia",      population: 278_000_000, funFact: "An archipelago of over 17,000 islands." },
  36:  { region: "Oceania",             population: 26_000_000,  funFact: "The only nation that is also a whole continent." },
  554: { region: "Oceania",             population: 5_000_000,   funFact: "Has more sheep than people, by far." },
  818: { region: "North Africa",        population: 112_000_000, funFact: "Home to the only surviving Ancient Wonder." },
  710: { region: "Sub-Saharan Africa",  population: 60_000_000,  funFact: "The only country with three capital cities." },
  566: { region: "Sub-Saharan Africa",  population: 223_000_000, funFact: "Africa's most populous country." },
  404: { region: "Sub-Saharan Africa",  population: 55_000_000,  funFact: "Home to the Great Rift Valley and record marathoners." },
  504: { region: "North Africa",        population: 37_000_000,  funFact: "You can see Europe across its northern strait." },
  682: { region: "Middle East",         population: 37_000_000,  funFact: "Holds roughly a sixth of the world's oil reserves." },
  376: { region: "Middle East",         population: 9_000_000,   funFact: "Has more startups per capita than almost anywhere." },
  // Smaller states. NOTE: every country with population < 1,000,000 MUST have an
  // entry here — the GeoRadar weighted target-picker treats any country absent
  // from this map as >= 1,000,000. Luxembourg (existing) is included for that.
  442: { region: "Western Europe",      population: 660_000,     funFact: "One of the world's last remaining sovereign grand duchies." },
  499: { region: "Southern Europe",     population: 620_000,     funFact: "Its name means 'Black Mountain'." },
  470: { region: "Southern Europe",     population: 540_000,     funFact: "One of the world's smallest and most densely populated nations." },
  20:  { region: "Southern Europe",     population: 80_000,      funFact: "Co-ruled by a French president and a Spanish bishop." },
  492: { region: "Western Europe",      population: 38_000,      funFact: "The world's most densely populated sovereign state." },
  674: { region: "Southern Europe",     population: 34_000,      funFact: "Claims to be the world's oldest surviving republic." },
  438: { region: "Western Europe",      population: 40_000,      funFact: "A doubly landlocked country famed for exporting false teeth." },
  462: { region: "South Asia",          population: 520_000,     funFact: "The lowest-lying country on Earth." },
  659: { region: "North America",       population: 48_000,      funFact: "The smallest sovereign state in the Americas." },
  336: { region: "Southern Europe",     population: 800,         funFact: "The smallest country in the world." },
  196: { region: "Middle East",         population: 1_300_000,   funFact: "Its capital is the last divided capital in Europe." },
  48:  { region: "Middle East",         population: 1_500_000,   funFact: "An island nation linked to Saudi Arabia by a causeway." },
  96:  { region: "Southeast Asia",      population: 450_000,     funFact: "Ruled by one of the world's wealthiest monarchs." },
  64:  { region: "South Asia",          population: 780_000,     funFact: "Measures success by Gross National Happiness." },
  242: { region: "Oceania",             population: 930_000,     funFact: "Made up of more than 330 islands." },
  44:  { region: "North America",       population: 410_000,     funFact: "Spread across some 700 islands and cays." },
  52:  { region: "North America",       population: 280_000,     funFact: "Became a republic in 2021." },
  626: { region: "Southeast Asia",      population: 1_360_000,   funFact: "One of Asia's youngest nations." },
  748: { region: "Sub-Saharan Africa",  population: 1_200_000,   funFact: "One of the world's last absolute monarchies." },
  262: { region: "Sub-Saharan Africa",  population: 1_100_000,   funFact: "Guards a key Red Sea shipping chokepoint." },
  132: { region: "Sub-Saharan Africa",  population: 590_000,     funFact: "An Atlantic archipelago off West Africa." },
  328: { region: "South America",       population: 810_000,     funFact: "The only South American country with English as its official language." },
  740: { region: "South America",       population: 620_000,     funFact: "The most forested country on Earth by percentage." },
  84:  { region: "North America",       population: 410_000,     funFact: "Home to the second-largest barrier reef in the world." },
  780: { region: "North America",       population: 1_500_000,   funFact: "The birthplace of the steelpan and calypso." },
  426: { region: "Sub-Saharan Africa",  population: 2_300_000,   funFact: "Entirely surrounded by a single other country." },
  270: { region: "Sub-Saharan Africa",  population: 2_700_000,   funFact: "The smallest country in mainland Africa." },
};

/** "~335 M" style population hint. */
export function formatPopulation(n: number): string {
  if (n >= 1_000_000_000) return `~${(n / 1_000_000_000).toFixed(1)} B`;
  if (n >= 1_000_000) return `~${Math.round(n / 1_000_000)} M`;
  return `~${Math.round(n / 1_000)} K`;
}
