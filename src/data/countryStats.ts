// Static demographic stats for the Stat Attack card battler. Authored from
// well-known figures (no runtime API — REST Countries v3.1 is deprecated).
// area = km², borders = number of land neighbours, population = people.

export interface CountryStat {
  name: string;   // English (matches the app's country naming)
  alpha2: string; // for the flag (flagcdn)
  population: number;
  area: number;
  borders: number;
}

export const COUNTRY_STATS: CountryStat[] = [
  { name: "United States", alpha2: "us", population: 335_000_000, area: 9_833_517, borders: 2 },
  { name: "China", alpha2: "cn", population: 1_411_000_000, area: 9_596_961, borders: 14 },
  { name: "India", alpha2: "in", population: 1_428_000_000, area: 3_287_263, borders: 6 },
  { name: "Brazil", alpha2: "br", population: 216_000_000, area: 8_515_767, borders: 10 },
  { name: "Russia", alpha2: "ru", population: 144_000_000, area: 17_098_242, borders: 14 },
  { name: "Canada", alpha2: "ca", population: 39_000_000, area: 9_984_670, borders: 1 },
  { name: "Australia", alpha2: "au", population: 26_000_000, area: 7_692_024, borders: 0 },
  { name: "Argentina", alpha2: "ar", population: 46_000_000, area: 2_780_400, borders: 5 },
  { name: "France", alpha2: "fr", population: 68_000_000, area: 551_695, borders: 8 },
  { name: "Germany", alpha2: "de", population: 84_000_000, area: 357_022, borders: 9 },
  { name: "Japan", alpha2: "jp", population: 124_000_000, area: 377_975, borders: 0 },
  { name: "United Kingdom", alpha2: "gb", population: 67_000_000, area: 242_495, borders: 1 },
  { name: "Egypt", alpha2: "eg", population: 112_000_000, area: 1_002_450, borders: 4 },
  { name: "South Africa", alpha2: "za", population: 60_000_000, area: 1_221_037, borders: 6 },
  { name: "Mexico", alpha2: "mx", population: 129_000_000, area: 1_964_375, borders: 3 },
  { name: "Spain", alpha2: "es", population: 48_000_000, area: 505_992, borders: 5 },
  { name: "Italy", alpha2: "it", population: 59_000_000, area: 301_340, borders: 6 },
  { name: "Saudi Arabia", alpha2: "sa", population: 37_000_000, area: 2_149_690, borders: 7 },
  { name: "Indonesia", alpha2: "id", population: 278_000_000, area: 1_904_569, borders: 3 },
  { name: "Turkey", alpha2: "tr", population: 85_000_000, area: 783_562, borders: 8 },
  { name: "Nigeria", alpha2: "ng", population: 223_000_000, area: 923_768, borders: 4 },
  { name: "Kazakhstan", alpha2: "kz", population: 19_000_000, area: 2_724_900, borders: 5 },
  { name: "Peru", alpha2: "pe", population: 34_000_000, area: 1_285_216, borders: 5 },
  { name: "Chile", alpha2: "cl", population: 20_000_000, area: 756_102, borders: 3 },
  { name: "Poland", alpha2: "pl", population: 38_000_000, area: 312_696, borders: 7 },
  { name: "Norway", alpha2: "no", population: 5_500_000, area: 385_207, borders: 3 },
  { name: "Portugal", alpha2: "pt", population: 10_000_000, area: 92_212, borders: 1 },
  { name: "Netherlands", alpha2: "nl", population: 18_000_000, area: 41_850, borders: 2 },
  { name: "Greece", alpha2: "gr", population: 10_000_000, area: 131_957, borders: 4 },
  { name: "Thailand", alpha2: "th", population: 72_000_000, area: 513_120, borders: 4 },
  { name: "Kenya", alpha2: "ke", population: 55_000_000, area: 580_367, borders: 5 },
  { name: "Mongolia", alpha2: "mn", population: 3_400_000, area: 1_564_110, borders: 2 },
  { name: "Sweden", alpha2: "se", population: 10_000_000, area: 450_295, borders: 2 },
  { name: "Vietnam", alpha2: "vn", population: 99_000_000, area: 331_212, borders: 3 },
  { name: "Iran", alpha2: "ir", population: 89_000_000, area: 1_648_195, borders: 7 },
  { name: "Colombia", alpha2: "co", population: 52_000_000, area: 1_141_748, borders: 5 },
];

export type StatKey = "population" | "area" | "borders";
