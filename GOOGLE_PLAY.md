# HusPass – Google Play listing draft

Status: preparation only. No paid Google Play account or publication has been activated.

## App identity
- App name: HusPass
- Package ID: dk.huspass.app
- Initial release: 1.0.0 (versionCode 1)
- Default language: Danish
- Category suggestion: House & Home

## Short description (DA)
Din bolig, vedligeholdelse, dokumenter og udgifter samlet ét sted.

## Full description (DA)
HusPass hjælper boligejere med at samle vigtige oplysninger om boligen ét sted.

Med HusPass kan du holde styr på boligoplysninger, planlægge vedligeholdelse, gemme dokumenter og følge relevante udgifter. Appen er udviklet med fokus på et enkelt overblik og sikker adgang til dine egne oplysninger.

Funktioner:
- Samlet overblik over din bolig
- Vedligeholdelsesopgaver og status
- Dokumenter knyttet til boligen
- Registrering af relevante udgifter
- Konto med personlig adgang
- Mulighed for at slette kontoen

HusPass udvikles til boligejere i Danmark. Funktioner kan blive udvidet og forbedret over tid.

## Privacy and support
- Privacy policy: https://huspass.dk/privatliv
- Terms: https://huspass.dk/vilkaar
- Website: https://huspass.dk
- Support email: heydar.rashid2015@gmail.com

## Google Play data-safety preparation
Based on the current HusPass production design, the Play Console Data Safety declaration must be completed from the final release behavior, not guessed from this document. Current user-facing data categories include account email plus user-entered home information, tasks, expenses, images, documents, and support messages. Authentication, database and private file storage are provided through HusPass backend services. Account deletion is available in HusPass. Re-check all production SDKs and data flows immediately before submitting the declaration.

## Reviewer access preparation
HusPass requires login for private account features. Before review, provide Google Play reviewers with valid app-access instructions through Play Console. Do not put reviewer credentials, passwords, API keys, or test-account secrets in this public repository.

## Release checklist
- [x] Stable Android package ID: dk.huspass.app
- [x] Initial release version: 1.0.0 / versionCode 1
- [x] HTTPS-only production host
- [x] Debug APK build
- [x] Release AAB build
- [x] Public privacy-policy URL
- [x] Public terms URL
- [x] Account deletion available in HusPass
- [x] Danish store-description draft
- [ ] Permanent private Android upload key
- [ ] Signed release AAB
- [ ] Final Play Store icon and feature graphic
- [ ] Final Android screenshots
- [ ] Play Console Data Safety declaration
- [ ] Play Console content rating
- [ ] Private reviewer test access
- [ ] Final release-candidate test on Android

## Release notes – 1.0.0 (DA)
Første version af HusPass til Android. Saml boligoplysninger, vedligeholdelsesopgaver, dokumenter og relevante udgifter ét sted med personlig adgang.

## Play Console declaration worksheet
Use this only as a preparation worksheet and verify it against the final production build before submission.

### Account and access
- Core private features require a HusPass account and login.
- Google review must receive private test-access instructions through Play Console, never through the public repository.
- Users can request/delete their HusPass account from the app.

### Current data inventory to verify in Data Safety
- Account identifier: email address.
- User-provided home information: address and property details.
- User-provided app content: maintenance tasks, expenses, documents, images and support messages.
- Files are intended to remain private to the authenticated owner.
- No advertising SDK is intentionally included in the current codebase.
- No location permission is intentionally requested by the current mobile configuration.

### Final verification before answering Play Console
Check the final release candidate, Supabase production configuration and every production SDK/provider. Google Play declarations must reflect actual collection, sharing, purpose, retention, deletion and security behavior at submission time.

## Content-rating preparation
HusPass is a home-management utility. The current product design does not intentionally include gambling, sexual content, violence, drugs, user-to-user social posting, or public user-generated content. Answer the official Play Console questionnaire from the final production build; do not copy assumptions from this file without verification.

## Store listing asset specification
Prepare final assets from the release candidate, not from private customer data:
- App icon: final HusPass brand artwork, high resolution, no personal/customer information.
- Feature graphic: HusPass branding and product value only.
- Phone screenshots: use a dedicated test account with fictional property data.
- Never capture a real user's address, documents, email, expenses, images, or support messages in store screenshots.
- Review every screenshot before upload for notification text, status-bar identifiers, or other accidental personal information.

## Store assets still required before publication
- Final high-resolution app icon
- Feature graphic
- Android phone screenshots from the final release candidate
- Content-rating questionnaire in Play Console
- Data Safety form based on the production data flows
- App-access instructions for Google review if login is required

Do not claim publication readiness until the signed release bundle and Play Console declarations have been reviewed.
