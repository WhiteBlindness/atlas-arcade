# Privacy and legal release audit

**Scope:** source-code review of the current repository and confirmed Vercel production deployment metadata
**Inventory date:** 07/10/2026
**Status:** operator and legal review required for a complete privacy notice

This report records behavior visible in the repository and the confirmed Vercel production deployment configured for region iad1. It does not verify the live Supabase project, provider contracts, authenticated production cookies, server logs, backups or database functions that are absent from the repository. The public policy pages preserve those unknowns as explicit owner actions.

## Data inventory

| Data or storage | Evidence and use | Recipient or location | Retention known? | Consent assessment |
| --- | --- | --- | --- | --- |
| Email, password credential, account ID and auth session | Email/password sign-up, password reset, Google sign-in and Supabase Auth session handling | Supabase Auth; Google only when the player chooses Google sign-in | No. Provider settings and retention were not supplied. | Prior consent under Article 5(1) is the default. A cookie may qualify for an exception only if it is technical storage or access solely to transmit a communication, or is strictly necessary for a service expressly requested by the user. Classification is unconfirmed. Verify production cookie names, scope, attributes and duration; assess the GDPR basis separately. |
| Username and profile row | Sign-up username; profile lookup; profile UUID; referral code; referred-by account; account creation date and admin flag | Supabase profiles table; username may be returned by public leaderboard RPC | No | Account data is necessary for current account functions, but the operator must document the appropriate GDPR basis. The leaderboard query and public fields need production verification. |
| High scores | saveHighScore upserts game slug, score and timestamp for signed-in players | Supabase high_scores; public leaderboard API is designed to expose username and score | No | No device storage consent is implicated by the database write. GDPR purpose and basis require owner review. Public visibility must be clear before sign-up. |
| Daily/premium coins | Account-linked balances, regeneration dates and premium token totals | Supabase user_coins; guest balance is local instead | No | Explain as gameplay/account state. GDPR legal basis and retention require owner review. No purchase flow found. |
| Language, theme and sound | atlas-arcade-settings Zustand persistence | Browser localStorage | Browser-controlled; no application expiry | Optional preference storage. Prior consent applies unless legal review confirms a specific Article 5(2) exception. The app saves the key after a preference change, with no separate storage-consent choice. Whether the interaction supplies valid consent has not been assessed. |
| Daily results and streak | atlas-arcade-daily Zustand persistence stores day, score, performance, share squares and streak state | Browser localStorage | Browser-controlled; stale daily result is ignored by app logic, but not necessarily removed | Prior consent applies unless storage is strictly necessary for the information-society service expressly requested. The app saves this key as game state without a separate storage-consent choice. Whether a game interaction supplies valid consent or the strict-necessity exception applies is unconfirmed. |
| Guest coin state | atlas-arcade-guest-tokens stores balance and accrual timestamps | Browser localStorage | Browser-controlled; code has no fixed expiry | Prior consent applies unless storage is strictly necessary for the information-society service expressly requested. The app saves this key as game state without a separate storage-consent choice. Whether a game interaction supplies valid consent or the strict-necessity exception applies is unconfirmed. |
| Pending referral code | Stored only when the landing URL contains ?ref=; the query is then removed. The code is kept for redemption after sign-in. | Browser localStorage, then Supabase referral RPC and profile relation | Cleared after a definitive RPC response; retained after a transport error. No time expiry. | Prior consent applies unless an Article 5(2) exception is confirmed. Whether opening the link expressly requests this referral feature and whether storage is strictly necessary are unresolved; no separate storage-consent choice gates the write. |
| Profile avatar | ProfileModal displays a local icon; no remote avatar request or account-ID egress is present | Browser UI | Not applicable | No third-party avatar request is identified in the current code. |
| Map geometry and flags | Browser requests world-atlas geometry from jsDelivr and flags from FlagCDN during play | jsDelivr and FlagCDN | Provider retention unknown | No user account fields are included in these URLs. Standard request metadata still reaches each provider. |
| Trivia questions | Border Blitz calls OpenTDB endpoints; a session token may be included on subsequent requests | OpenTDB | Provider retention unknown | Requests contain game parameters and an OpenTDB token, not the account ID in application code. Confirm provider terms and data handling. |
| City, landscape and game images | Image URLs are loaded from Wikimedia Commons and other manifest-listed sources | The image host named by each URL | Provider retention unknown | No account ID is added by the image URL. Photographs and their preload use anonymous CORS, excluding cross-origin cookies; providers still receive ordinary network metadata. See /credits for asset source and licence status. |
| Request and application logs | Auth callback and email-confirmation routes write a generic message to console.error for unexpected exceptions. The keep-alive and leaderboard endpoints return generic failure messages instead of provider details. The Vercel deployment region is iad1. | Vercel runtime logs if captured; Supabase project logs may also apply | Unknown | Source review found no application-level analytics SDK, advertising tag or ad-provider integration. Confirm production log fields, access, retention and deletion. |
| Clipboard share | Share button writes result text to clipboard after an explicit click | Browser clipboard; no app endpoint receives it in the inspected code | Controlled by the player/device | User-initiated feature. No tracking integration found. |

### Browser storage and consent classification

The current dependency manifest and source contain no analytics SDK, advertising tag, marketing pixel, sessionStorage or IndexedDB use. That source review cannot rule out scripts injected by the hosting project or production configuration.

| Item | Source-based classification | Release action |
| --- | --- | --- |
| Supabase authentication cookies | Prior consent is the default. An exception may apply only if the cookie is technical storage/access solely for communication or strictly necessary for the sign-in service expressly requested; legal classification is unconfirmed. | Confirm production purpose, scope, security flags and lifetime before relying on an exception. |
| Daily results and guest coin balance | Prior consent applies unless storage is strictly necessary for the information-society service expressly requested; neither item has been legally classified. | Confirm each item against Article 5(2). If an item does not qualify, obtain prior consent or remove that persistence after reviewing the game flow. |
| Saved preferences | Optional device storage. Prior consent applies unless a specific Article 5(2) exception is confirmed. | The app saves the key after a preference change. Confirm whether the user-facing information and interaction supply valid prior consent or whether a specific exception applies. |
| Referral attribution | Prior consent applies unless an Article 5(2) exception is confirmed. Whether opening the invite link expressly requests the referral feature and whether storage is strictly necessary remain unresolved. | Make a case-specific legal decision. No separate storage-consent choice gates the write; if neither valid prior consent nor an exception applies, change persistence after reviewing the referral flow. |
| Analytics and advertising storage | None found in the reviewed source | Do not add a general-purpose banner without a storage purpose. Re-audit if production tags or ad integrations are introduced. |

This is a technical triage, not a legal opinion. Article 5 of Law 41/2004, as amended and republished by Law 46/2012, makes prior consent based on clear and complete information, including the purposes, the default for terminal storage or access. It provides exceptions for technical storage or access whose sole purpose is to transmit a communication, and for storage or access strictly necessary for a provider to supply an information-society service expressly requested by the user. CNPD guidance confirms that the amended rule applies. The EDPB's final Guidelines 2/2023, version 2.0, address technical scope, not exemptions; they leave exemption assessments to case-by-case review under national law and competent-authority guidance. This audit does not certify an exception for any feature.

## Legal and product checklist

| Checklist item | Status | Evidence or next action |
| --- | --- | --- |
| Controller/operator identity | **Owner input required** | Legal person, trading name and contact details are absent. Do not publish invented identity. |
| Postal address, establishment and jurisdiction | **Owner input required** | Confirm establishment country and applicable rules before setting governing law or complaint routes. |
| Privacy contact and rights-request channel | **Owner input required** | No monitored contact or request process is in the repo. Add a working route before collecting account data. |
| Notice at account creation | **Implemented** | The sign-up modal links to the privacy notice and terms beside the account fields. |
| Data protection officer | **Legal review** | No DPO contact appears in code. Determine whether appointment is required; do not state that no DPO is required without assessment. |
| Data categories and purposes | **Code inventory complete, operator review required** | See the data inventory above and the user-facing privacy page. |
| GDPR lawful basis by purpose | **Legal review** | Source shows behavior, not the operator's legal basis or balancing records. Document each purpose. |
| Recipients/processors and contracts | **Owner/provider confirmation** | Supabase, optional Google OAuth, jsDelivr, FlagCDN, OpenTDB, Wikimedia hosts and Vercel need contract/role review. |
| Data locations and international transfers | **Owner/provider confirmation** | Vercel reports deployment region iad1. The Supabase region, provider configuration and applicable transfer safeguards were not supplied. |
| Retention and backup deletion | **Owner/provider confirmation** | No application retention schedule or backup policy is in the repository. Set periods and verify providers. |
| Access, correction, restriction, objection, portability and erasure | **Owner input required** | No privacy request contact/process is documented. Publish how to exercise applicable rights. |
| In-app account deletion | **Not verified** | ProfileModal calls delete_own_user, but this branch contains no migration defining that RPC. Verify the deployed function and deletion scope before claiming account removal works. |
| Public leaderboard disclosure | **Production verification required** | API is designed to return username and score. The database RPC definition is not in this branch. Confirm exact output, RLS and cache behavior. |
| Cookie/storage information | **Implemented with open legal decisions** | Page lists Supabase auth cookies and all four localStorage keys. Confirm production config and consent classification. |
| Consent-required storage | **Legal decision pending** | No separate storage-consent choice gates the four writes. The settings key follows preference changes, daily and guest state follow gameplay, and referral storage follows an invite URL. This does not establish whether an interaction supplies valid prior consent or an Article 5(2) exception applies. Assess each key; where neither route is available, obtain valid prior consent or change persistence after reviewing product impact. |
| Age and child-safety policy | **Owner decision and legal review** | No birth date, age gate or minimum age exists in code. Define audience and applicable safeguards. |
| Security measures and incident process | **Owner/provider confirmation** | Code review alone cannot verify production configuration, access control, incident response or supplier security. |
| Analytics and advertising | **No integration found in the reviewed source** | No analytics SDK, ad tag, ad provider or ad prompt was found. The current out-of-coins modal shows a guest token balance and refill time. Re-audit if production tags or an advertising integration are introduced. |
| Purchases, subscriptions and payments | **Not applicable to reviewed code** | No checkout, payment, subscription, automatic renewal or real-money conversion flow found. Reassess if introduced. |
| Refunds for paid purchases | **Not applicable to reviewed code** | No paid purchase exists in the current code. This is not a waiver of mandatory consumer rights if the business model changes or a payment is later taken. |
| Consumer information and digital-service remedies | **Legal review** | Free access alone does not settle which consumer rules apply when account data is used. Review Portuguese Decree-Law 84/2021, Directive (EU) 2019/770 and the Consumer Protection Act against the actual offer. |
| Reviews, ratings and testimonials | **Not applicable to current feature set** | No user review, rating or testimonial submission/display flow found. A username and score are leaderboard results, not reviews. |
| User-generated content and moderation | **Limited feature, owner review** | Users choose a username and submit scores. There is no general post/comment feature. Confirm reporting/moderation needs for the public username board. |
| Referral marketing | **Legal review** | Invite codes connect accounts and award game tokens. Confirm user notice and storage consent decision; avoid describing this as advertising tracking without evidence. |
| Third-party asset credits and licensing | **Tracked separately** | The /credits page renders records from src/data/assetProvenance.json through the typed export in src/lib/assetCredits.ts; unknown and conditional records remain visible. See the asset licensing audit. |
| Changes to terms and privacy notice | **Owner process required** | Set a publication/effective-date process. The code inventory date is not an effective date or approval. |

## Source evidence reviewed

- src/store/settingsStore.ts, src/store/dailyStore.ts, src/store/coinStore.ts
- src/lib/supabase/client.ts, src/lib/supabase/server.ts, src/lib/supabase/profile.ts, src/lib/supabase/coins.ts, src/lib/supabase/scores.ts, src/lib/supabase/leaderboard.ts
- src/components/auth/AuthModal.tsx, src/components/auth/AuthProvider.tsx, src/components/ui/ProfileModal.tsx, src/components/ui/LeaderboardModal.tsx, src/components/ui/OutOfCoinsModal.tsx
- src/app/api/leaderboard/route.ts, src/app/api/cron/keep-alive/route.ts, src/app/auth/callback/route.ts, src/app/auth/confirm/route.ts
- src/components/games/BorderBlitz.tsx, remote flag/map requests, and image references in src/data/cities.ts and game data
- package.json, vercel.json, supabase/migrations/

## Primary references

- [GDPR, Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [EDPB data subject rights](https://www.edpb.europa.eu/topics/key-gdpr-concepts/data-subject-rights_en)
- [CNPD information note on cookies (25/06/2021)](https://www.cnpd.pt/media/x2zdus50/nota-informativa-cnpd_cookies_20210625.pdf)
- [CNPD guidance on consent](https://www.cnpd.pt/organizacoes/areas-tematicas/consentimento/)
- [Law 46/2012, amending and republishing Law 41/2004](https://diariodarepublica.pt/dr/detalhe/lei/46-2012-174793)
- [EDPB Guidelines 2/2023, final version 2.0 on the technical scope of Article 5(3)](https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacydirective_en)
- [Portuguese Decree-Law 84/2021](https://diariodarepublica.pt/dr/detalhe/decreto-lei/84-2021-172938301)
- [Directive (EU) 2019/770](https://eur-lex.europa.eu/eli/dir/2019/770/oj)
- [Portuguese Consumer Protection Act, Law 24/96](https://diariodarepublica.pt/dr/legislacao-consolidada/lei/1996-34491075-43834175)

## External image storage observed in the public browser

The clean public session stored `WMF-Uniq` after a Wikimedia photograph loaded. Wikimedia lists visitor measurement, experiments and DDoS protection, with a 365-day duration refreshed weekly. This finding prevents a general claim that external content performs no tracking. The branch uses anonymous CORS for all city and landscape images and the Peaks preload. A regression test seeds an existing provider cookie and attempts to set another: neither is transmitted or stored. Representative provider responses permit anonymous CORS. Network metadata and provider-side logs remain outside that browser-cookie protection.

Sources: [Wikimedia cookie statement](https://foundation.wikimedia.org/wiki/Policy:Cookie_statement), [HTML CORS settings attributes](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#cors-settings-attributes).
