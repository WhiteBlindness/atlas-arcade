# Asset provenance

Atlas Arcade uses sourced photographs, national flags, map data, fonts, interface icons, and a local profile icon. The [Credits page](/credits) reads file-level records from [assetProvenance.json](../src/data/assetProvenance.json), exposed through [assetCredits.ts](../src/lib/assetCredits.ts). This document explains how those records are maintained.

Reviewed: 07/10/2026

## How the records were checked

The city and Peaks & Valleys image references were read from src/data/cities.ts and src/data/peaksValleys.ts. Each unique Wikimedia file title was checked against its own file-description page and MediaWiki image metadata. A file's license and credit belong to that file; they are not inherited from a neighboring image or from Wikimedia generally. The inventory keeps the source-page URL, file title, returned license label and URL, creator when supplied, and any separate restrictions marker.

The recorded status has a specific meaning:

- VERIFIED: a usable license or public-domain status is identified, no extra restriction marker was returned, and the listed use fits the stated copyright terms.
- CONDITIONAL: the source and license are identified, but reuse carries listed credit, license, share-alike, notice, brand, or separate-rights conditions that still need to be followed.
- UNKNOWN: the available source evidence does not establish permission for the app's use.
- REMOVE_OR_REPLACE: a record that should not ship until it is replaced or a suitable permission is obtained. No current inventory row has this status.

The commercialUse, modifications, attributionRequired, restrictions, and notes fields separate the kind of condition. CONDITIONAL does not mean that every reuse permission is unknown. It means the specific conditions in that row matter. An UNKNOWN row has unresolved permission evidence.

Wikimedia Commons explains that each file page states its own licensing terms, that additional trademark, privacy, personality, or other rights may apply, and that the site does not warrant the accuracy of the rights metadata. Review the linked file page and applicable license before changing or reusing an asset. See [Commons reuse guidance](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) and the [MediaWiki API documentation](https://commons.wikimedia.org/wiki/Commons:API/MediaWiki).

## Source families

- Wikimedia city and landscape images have one manifest row per unique source file. Duplicate placements are joined in that row's usedIn field.
- FlagCDN supplies flag images used in Flag Rush, One Strike, and Stat Attack. Flagpedia's terms say its flag images are public domain. The manifest keeps a conditional note because the game loads many national symbols dynamically and their non-copyright rules were not checked country by country.
- World Atlas serves the TopoJSON country boundaries used by Globle, Skyline Silhouette, Border Blitz, Frontier Face-Off, and Tectonic Snap. Its README identifies the boundaries as Natural Earth data. The runtime URL uses the mutable npm @2 alias.
- src/data/worldCountries.json combines country information from mledoze/countries with population data from samayo/country-json. Its generator fetches both upstream repositories from mutable @master URLs. The mledoze-derived database is subject to ODbL 1.0; the population dataset carries its MIT notice. The public machine-readable snapshot and grouped license notice are [world-countries.json](../public/licenses/world-countries.json) and [world-countries.md](../public/licenses/world-countries.md).
- Profile avatars use a local Lucide User icon. The app does not load a third-party avatar image.
- The project uses Lucide React 1.24.0 icons, plus Press Start 2P and VT323 fonts from Fontsource. Their package license files and upstream notices are linked from the manifest.
- The OAuth button label uses the self-hosted Latin 500 subset of Google Sans from @fontsource/google-sans 5.3.1 as distributed by the package. Atlas Arcade does not modify the package font files. The package's SIL Open Font License 1.1 notice is published at [google-sans-OFL.txt](../public/licenses/google-sans-OFL.txt) and recorded as a separate font entry.
- The Google G mark in the OAuth button is an inline SVG. Google branding rules are included because the sign-in mark follows brand-use guidance rather than an open image license.

The app icon and map paths are drawn as inline SVG in project code. The source scan found no separate third-party image file for those vector shapes. No Google Maps or third-party map-tile URL appears in the map components; the interactive maps use the TopoJSON boundary data described above.

## Adding or changing an asset

Before adding an image, font, flag, avatar style, or map dataset:

1. Record the exact asset or file title and the actual URL used by the app.
2. Check the source's own license or terms page. Do not infer a license from the hosting service, a filename, a search result, or a similar asset.
3. Record the creator, required credit wording, license link, commercial-use terms, modification terms, and separate restrictions. Keep unknown values unknown.
4. Add the record to src/data/assetProvenance.json and confirm that the typed export and Credits page display it.
5. Recheck versioned or remotely hosted assets when their URL or source version changes.

For Creative Commons files, the credited author, source, license link, and modification notice should follow the exact license version on the file page. CC BY-SA, FAL, and GFDL terms can add obligations when material is adapted. The [CC BY deed](https://creativecommons.org/licenses/by/4.0/) and [CC BY-SA deed](https://creativecommons.org/licenses/by-sa/4.0/) summarize version 4.0; individual manifest rows link the license version for each file.
