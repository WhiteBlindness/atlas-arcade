// Continent membership by country name — names must match src/data/countries.ts
// exactly; they are resolved to ISO numeric codes at runtime.

export interface ContinentRound {
  id: string;
  label: string;
  countries: string[];
}

export const CONTINENT_ROUNDS: ContinentRound[] = [
  {
    id: "south-america",
    label: "SOUTH AMERICA",
    countries: [
      "Argentina", "Bolivia", "Brazil", "Chile", "Colombia",
      "Ecuador", "Paraguay", "Peru", "Uruguay", "Venezuela",
    ],
  },
  {
    id: "africa",
    label: "AFRICA",
    countries: [
      "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
      "Cameroon", "Central African Republic", "Chad",
      "Democratic Republic of the Congo", "Republic of the Congo",
      "Egypt", "Eritrea", "Ethiopia", "Gabon", "Ghana", "Guinea",
      "Ivory Coast", "Kenya", "Liberia", "Libya", "Madagascar", "Malawi",
      "Mali", "Mauritania", "Morocco", "Mozambique", "Namibia", "Niger",
      "Nigeria", "Rwanda", "Senegal", "Sierra Leone", "Somalia",
      "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo",
      "Tunisia", "Uganda", "Zambia", "Zimbabwe",
    ],
  },
  {
    id: "europe",
    label: "EUROPE",
    countries: [
      "Albania", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina",
      "Bulgaria", "Croatia", "Czech Republic", "Denmark", "Estonia",
      "Finland", "France", "Germany", "Greece", "Hungary", "Iceland",
      "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Moldova",
      "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal",
      "Romania", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden",
      "Switzerland", "Ukraine", "United Kingdom",
    ],
  },
];
