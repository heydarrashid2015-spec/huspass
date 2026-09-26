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

## Store assets still required before publication
- Final high-resolution app icon
- Feature graphic
- Android phone screenshots from the final release candidate
- Content-rating questionnaire in Play Console
- Data Safety form based on the production data flows
- App-access instructions for Google review if login is required

Do not claim publication readiness until the signed release bundle and Play Console declarations have been reviewed.
