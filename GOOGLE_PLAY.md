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
- [x] Final app/launcher icon integrated in Web/PWA/Android build
- [ ] Final Play Store feature graphic (1024×500; create from approved HusPass branding only, no customer data)
- [ ] Final Android screenshots (use fictional test account/data only)
- [ ] Play Console Data Safety declaration
- [ ] Play Console content rating
- [ ] Private reviewer test access
- [x] Android install/launch test completed successfully on a physical device with the approved launcher icon build
- [ ] Full final release-candidate functional test on Android

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

## Pre-release test plan
Run these checks on the final signed Android release candidate before Play submission:
- Fresh install: install on a device that has never had HusPass installed.
- Launch: app opens directly inside HusPass with no blank screen and no unexpected browser redirect.
- Authentication: sign up, email confirmation, login, logout and password recovery.
- Persistence: close/reopen the app and confirm the authenticated session and private data behave correctly.
- Home data: create/edit property information and verify it is isolated to the signed-in account.
- Maintenance: create, edit and delete a task.
- Documents: upload, open and delete an allowed test file.
- Images: upload/change a fictional home image and verify private access.
- Account deletion: verify the test account and its HusPass data are removed as designed.
- External links: only intentional external destinations may leave the app.
- Network recovery: verify a useful state after temporary loss and restoration of internet access.
- Upgrade: once a signed v1.0.0 baseline exists, future builds must preserve the same package ID and signing identity.

Use only fictional test data. Never use a real customer's personal data for release testing or screenshots.

## HusPass visual identity direction
For the final Android/store identity, keep one consistent HusPass mark across launcher icon, Play Store icon, website and future iOS build.

Current production direction:
- Brand name: HusPass
- Approved primary mark: white rounded-square field, navy house with four-pane white window, cyan/blue sweep and green leaf/checkmark.
- Approved palette: #102F68 navy, #0876C9 blue, #20BFE7 cyan, #008D62 green and white background.
- Visual language: clean Danish home-management product; readable at small icon sizes.
- The approved mark is now integrated in the web interface, PWA icons and Android launcher build.
- Do not place customer data, addresses, personal names or screenshots inside the icon.
- Store graphics must not imply features that the released app does not actually provide.
- Launcher icon has been installed successfully on a physical Android device; re-check once more on the final signed v1.0.0 release candidate.

The HusPass house + checkmark concept has been approved as the visual direction. The final production artwork should preserve this concept while being recreated as clean standalone brand assets (not cropped from a promotional mockup) for Android, web/PWA, Play Store and future iOS use.

## Store assets still required before publication
- Final high-resolution app icon: integrated across Android, web/PWA and Apple icon routes; physical Android installation succeeded.
- Feature graphic
- Android phone screenshots from the final release candidate
- Content-rating questionnaire in Play Console
- Data Safety form based on the production data flows
- App-access instructions for Google review if login is required

Do not claim publication readiness until the signed release bundle and Play Console declarations have been reviewed.


## Prepared Data Safety answers (draft for Play Console)
These answers are based on the current HusPass production code and must be re-checked immediately before submission.

- Data is transmitted over HTTPS.
- Account email is used for authentication and account management.
- Home/property information, tasks, expense-related entries, documents and images are user-provided app content used to provide HusPass functionality.
- Support messages are provided by the user for support handling.
- Private files are stored in private storage and accessed through authenticated/time-limited access flows.
- HusPass currently has no advertising SDK in the application dependencies.
- The Android configuration does not intentionally request location, camera or microphone access for current HusPass functionality.
- Users can initiate account deletion from inside HusPass.
- Do not mark data as sold. Any Play Console question about third-party processing/sharing must be answered from the final production provider configuration and Google's current definitions at submission time.

## Reviewer instructions draft (DA)
HusPass kræver login for adgang til private boligdata. Google Play-revieweren skal bruge en særskilt testkonto med fiktive oplysninger. Testkontoens loginoplysninger må kun indsættes i Play Console under App access og må aldrig gemmes i dette repository. Efter login kan revieweren teste boligoplysninger, vedligeholdelsesopgaver, dokumenter og kontofunktioner.

## Privacy release gate
Before every public release:
1. Use only fictional/test data for screenshots and reviewer access.
2. Confirm no secrets, customer addresses, emails, documents or images are present in repository/store assets.
3. Confirm private storage and row-level access controls remain enabled.
4. Confirm account deletion still removes the user's HusPass data as designed.
5. Re-check production dependencies before completing Google Play Data Safety.


## Security verification – 26 Sep 2026
- Production database tables checked: homes, tasks, documents and support_messages all have Row Level Security enabled.
- Current Supabase security advisor reports no database RLS vulnerability; the only security warning is leaked-password protection being disabled.
- Leaked-password protection is not being enabled during the zero-cost preparation stage because the current project configuration does not provide it as a free setting. Re-check before public launch and do not claim it is enabled.
- Performance advisor currently reports three unused indexes. They are informational findings only; do not remove them solely because a low-traffic pre-launch database has not used them yet.
- No customer data was copied into store assets or this checklist during this verification.


## Zero-cost readiness checkpoint – 26 Sep 2026
Completed without activating a paid service:
- Public Android test download is available from huspass.dk/download.
- Current web UI deployment is healthy on Vercel.
- Android package identity remains dk.huspass.app, version 1.0.0 / versionCode 1.
- CI verifies release identity and fails if Android signing secrets are only partially configured.
- CI produces a debug test APK plus an unsigned release AAB.
- Permanent Play signing/upload credentials are intentionally not created or committed yet.
- Store screenshots and feature graphic must use fictional data only.

### Next gate requiring owner action/payment
Google Play publication itself is intentionally paused until the owner chooses to create/activate the Google Play developer account and its required fee. Before any Play upload, create a permanent private upload key, store it only as protected repository secrets, build a signed release AAB, and run the full release-candidate test plan above.


## Store-listing copy ready for paste (DA)
**Appnavn:** HusPass

**Kort beskrivelse:** Din bolig, vedligeholdelse, dokumenter og udgifter samlet ét sted.

**Release note 1.0.0:** Første Android-version af HusPass. Få samlet overblik over boligoplysninger, vedligeholdelsesopgaver, dokumenter og relevante udgifter med personlig adgang.

**Category:** House & Home

The text above is prepared for direct entry in Play Console. Do not add claims about features that are not enabled in the release candidate.


## Play Console setup order (owner-action stage)
When the Google Play developer account is activated, use this order to avoid unnecessary backtracking:
1. Create the app as **HusPass**, default language **Danish**, app/game = **App**, free app.
2. Complete App access using a dedicated fictional reviewer account; never place its credentials in this repository.
3. Enter Ads declaration based on the release candidate (current code intentionally contains no advertising SDK).
4. Complete Data Safety from the verified production data inventory in this document.
5. Complete Content rating from the actual app behavior.
6. Add privacy-policy URL and store contact details.
7. Upload approved icon, 1024×500 feature graphic, and Android screenshots made only with fictional data.
8. Generate and upload the signed AAB only after the permanent upload key is protected as repository secrets.
9. Use an internal/closed test track first; verify install, login, private data isolation, documents, image change, logout and account deletion before production submission.

## Signing-key safety gate
The repository already ignores *.jks, *.keystore, *.p12, *.pem, key.properties, keystore.properties and Play service-account files. The permanent Android upload key must never be committed to GitHub or pasted into public documentation. Its encrypted/base64 form and passwords belong only in protected GitHub Actions secrets when the owner reaches the signing stage.


## Release-candidate acceptance criteria
HusPass v1.0.0 may be marked ready for Play upload only when all of these are true:
- Production website, privacy policy and terms return successfully over HTTPS.
- Android build uses package dk.huspass.app and versionCode 1 / versionName 1.0.0.
- No unexpected camera, microphone or location permission is present.
- Production dependency audit has no high/critical finding that blocks release.
- Login/logout and account deletion work on Android.
- Property data, tasks, documents and home image remain isolated to the authenticated test account.
- Fresh install and reopen work without blank page or unintended browser handoff.
- Final screenshots contain fictional data only.
- Permanent upload key exists privately and the release AAB is signed with it.
- Play Console Data Safety, App Access and Content Rating are completed from the final build.

Until the last two Play/signing items are completed, label the downloadable APK as a test build rather than an official Google Play release.
