# Asset licensing audit

Atlas Arcade asset inventory, checked 07/10/2026.

## Inventory result

The source scan found 229 Wikimedia image entries in the source datasets: 73 city image entries and 156 Peaks & Valleys entries. They resolve to 219 unique file titles, with 10 repeated source entries. The 73 city images are used in both Skyline Silhouette and Urban Legends, so the manifest records 302 game placements in total: 73 for each city game and 156 for Peaks & Valleys. The official MediaWiki API returned metadata for all 219 titles, with no missing pages or request errors. There are 217 Commons file pages and two English Wikipedia file pages. The manifest preserves every file-level source link, license label, creator value when supplied, and restriction marker. Three metadata records did not return a creator name; those records leave the creator field empty and link to the source page.

| Wikimedia file-level status | Records | Meaning |
| --- | ---: | --- |
| VERIFIED | 33 | CC0 or public-domain status with no separate restriction marker |
| CONDITIONAL | 185 | Identified licenses with compliance requirements, or separate rights markers |
| UNKNOWN | 1 | Permission is not established by the source evidence |
| REMOVE_OR_REPLACE | 0 | No current row has this status |

The source metadata labels break down into 9 CC0, 31 public-domain, 50 CC BY-family, 123 CC BY-SA-family, 2 FAL, and 2 GFDL records, plus one Flickr Commons "No known copyright restrictions" record and one ESA record whose API label was only "Attribution". ESA's asset page explicitly offers CC BY-SA 3.0 IGO or ESA Standard Licence. This inventory relies on the CC BY-SA option and records the required ESA/Copernicus credit. Within the 31 public-domain rows, seven have a separate flag or insignia restrictions marker and remain conditional. The complete manifest contains 227 entries: 219 unique Wikimedia file records and eight other source, brand, font, icon, map or dataset records.

The single UNKNOWN file is [Lake Baikal.jpg](https://commons.wikimedia.org/wiki/File:Lake_Baikal.jpg). Its source describes the image as having "no known copyright restrictions", which is not an affirmative license or a verified grant of commercial and modification rights. The manifest records that distinction rather than treating the image as public domain.

## Conditions that need attention

CC BY and CC BY-SA files permit commercial reuse under their license terms, with required credit, a source and license link, and change disclosure where the exact version requires it. CC BY-SA adds share-alike terms when a use creates an adaptation. FAL and GFDL files have their own attribution and license conditions. Public-domain and CC0 records do not acquire those copyright conditions, though a Commons restrictions marker can point to other rights.

The code applies display filters to the sourced images: Skyline Silhouette uses brightness and contrast until the answer is revealed; Peaks & Valleys uses grayscale and contrast. No filtered image file is stored. Whether a particular on-screen filter is an adaptation is not determined by this inventory. The manifest records the effect so a release owner can review it against the exact file license.

Wikimedia returned separate restriction markers for seven national flags or insignia, the Hollywood sign, an Italian cultural-property image, and a photograph tagged for personality rights. Copyright status does not settle trademark, national-emblem, cultural-property, privacy, or personality rights. Each marker is listed with its exact asset row.

The ESA Great Barrier Reef image needs the credit stated by ESA: "Contains modified Copernicus Sentinel data (2024), processed by ESA." Its selected CC BY-SA 3.0 IGO option requires a link to the license and share-alike terms for adaptations. The record links both the Commons file page and the ESA source page.

The current OAuth button uses the standard-color Google G on white, a 1px #747775 border, #1f1f1f text in self-hosted Google Sans Medium at 14/20, a 20px mark, a 10px icon-to-text gap and 12px horizontal padding. These details match the published light-button color, type and inset-spacing specifications. Google branding guidance covers the sign-in mark and button presentation; the font has a separate SIL Open Font License 1.1 record.

## Other visual and map sources

| Source | App use | Audit result |
| --- | --- | --- |
| FlagCDN / Flagpedia | Flag Rush, One Strike, Stat Attack | Flagpedia says its flag images are public domain and may be used freely. The app requests flags dynamically; country-specific emblem rules were not reviewed individually. |
| World Atlas / Natural Earth | TopoJSON world boundaries in five map games | Natural Earth identifies its map data as public domain. The TopoJSON file comes from World Atlas, whose README describes the Natural Earth source. The CDN URL is @2, not a patch-pinned version. |
| Generated country data | Country facts, names, coordinates, and populations | CONDITIONAL. The checked-in database combines ODbL mledoze data and MIT samayo population data. ODbL permits commercial use but sets attribution and share-alike duties for publicly used derivative databases. The [public JSON snapshot](../../public/licenses/world-countries.json) matches src/data/worldCountries.json at review (SHA-256: CD7201CB18EB7A67BB925C6B333FF09BC8AE74FACB88B95BF5AE257CB7D80373); see the [grouped license notice](../../public/licenses/world-countries.md). |
| Lucide React 1.24.0 | Interface icons | ISC license with a listed MIT notice for Feather-derived icons. Keep the applicable notices available with redistributed copies. |
| Press Start 2P and VT323 | Self-hosted UI fonts | SIL Open Font License 1.1 in both installed Fontsource packages. The bundled font files are not modified. |
| Google Sans 5.3.1 | Latin 500 subset for the Google OAuth button | Self-hosted from @fontsource/google-sans under SIL Open Font License 1.1. The complete copyright and license notice is published at [google-sans-OFL.txt](../../public/licenses/google-sans-OFL.txt). Atlas Arcade uses the package files as distributed. |

The Skyline Silhouette folder contains only public/skylines/README.txt, which lists intended city PNG filenames and describes a placeholder. No skyline PNGs or other local skyline image binaries are present, so there is no stored silhouette derivative to hash or license. The game currently renders the city photographs from src/data/cities.ts with a CSS filter.

The map components load https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json and draw country polygons. The source scan found no Google Maps, raster-tile, or third-party vector-tile endpoint. It also found no other locally stored image files under public/.

The current profile uses a local Lucide User icon. The former DiceBear 9.x image endpoint is no longer used; its version-specific license was not verified, so it is excluded from the current inventory.

## Verification sources

- [Wikimedia Commons reuse guidance](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) and [MediaWiki API](https://commons.wikimedia.org/wiki/Commons:API/MediaWiki)
- [ESA Great Barrier Reef source page](https://www.esa.int/ESA_Multimedia/Images/2025/04/Earth_from_Space_Great_Barrier_Reef_Australia), [Commons file page](https://commons.wikimedia.org/wiki/File:Earth_from_Space-_Great_Barrier_Reef,_Australia_ESA508080.jpg), and [CC BY-SA 3.0 IGO](https://creativecommons.org/licenses/by-sa/3.0/igo/)
- [Flickr Commons use information](https://www.flickr.com/commons/usage/)
- [Flagpedia terms](https://flagpedia.net/terms)
- [World Atlas data README](https://github.com/topojson/world-atlas/blob/master/README.md), [World Atlas license](https://github.com/topojson/world-atlas/blob/master/LICENSE), and [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/)
- [mledoze countries license](https://github.com/mledoze/countries/blob/master/LICENSE), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), and [samayo country-json](https://github.com/samayo/country-json)
- [Google Sign in with Google branding guidelines](https://developers.google.com/identity/branding-guidelines?hl=en)
- [Lucide license](https://github.com/lucide-icons/lucide/blob/main/LICENSE), [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P), [VT323](https://fonts.google.com/specimen/VT323), [Google Sans](https://fonts.google.com/specimen/Google+Sans), and [SIL Open Font License](https://openfontlicense.org/)

The file-level records are in [assetProvenance.json](../../src/data/assetProvenance.json), exposed through [assetCredits.ts](../../src/lib/assetCredits.ts). This audit records source evidence and release conditions. It does not determine how a jurisdiction would classify every transformed image or settle separate rights in flags, landmarks, or identifiable people.
