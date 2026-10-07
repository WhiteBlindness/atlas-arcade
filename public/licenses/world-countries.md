# Country data license notice

Reviewed: 07/10/2026

The machine-readable snapshot at [world-countries.json](/licenses/world-countries.json) is the generated country database used by Atlas Arcade. It combines country and geographic fields from mledoze/countries with population values from samayo/country-json.

The project generator at `scripts/fetchCountries.mjs` selects fields, uses localized names when available, excludes records without the supported numeric code or coordinates, merges population values, applies project population overrides, and sorts the result. The generated source snapshot is `src/data/worldCountries.json`.

## Source data and terms

- **Country records:** [mledoze/countries](https://github.com/mledoze/countries). The source database is licensed under the [Open Data Commons Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The ODbL permits commercial use and requires attribution, a license notice, share-alike terms for publicly used derivative databases, and access to the derivative database or the changes used to create it.
- **Population values:** [samayo/country-json](https://github.com/samayo/country-json). The source repository provides its data under the [MIT License](https://github.com/samayo/country-json/blob/master/LICENSE). Its license identifies `Copyright (c) 2015 Samson Daniel`.

> Contains information from [mledoze/countries](https://github.com/mledoze/countries), which is made available under the [Open Data Commons Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/).

The machine-readable JSON snapshot is available with this notice. The ODbL applies to the derivative database rights and mledoze-derived data. The population source retains its MIT notice. This attribution does not claim ownership of upstream material or resolve separate rights that may apply to individual records.
