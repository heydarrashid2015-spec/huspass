# HusPass store assets – release candidate 1.0.0

All public store artwork must use only the approved HusPass brand and fictional demo data. Never use a real customer's address, email, documents, expenses, images, notifications or account details.

## Play Store icon
- Source of truth: `public/huspass-icon.svg` and the approved generated launcher artwork.
- Export target for Play Console: 512 × 512 PNG.
- Preserve the approved white rounded-square, navy house, cyan/blue sweep and green leaf/check.
- No text or customer information inside the icon.

## Feature graphic
- Required canvas: 1024 × 500.
- Use HusPass branding and a concise Danish product message only.
- Do not advertise AI, scanning, household sharing, Plus or other future functionality until it is actually released.
- Keep important logo/text away from the outer crop area.

Suggested copy:
**HusPass**
*Din bolig samlet ét sted*

Optional supporting line:
*Vedligeholdelse · dokumenter · udgifter*

## Phone screenshots
Create screenshots from the final Android release candidate using a dedicated fictional test account. Recommended sequence:
1. Overblik — fictional home summary.
2. Min bolig — fictional property information and generic home image.
3. Vedligehold — fictional planned/in-progress/completed tasks.
4. Dokumenter — fictional document names only.
5. Mere — account/support/privacy controls.

Before export, inspect every screenshot for status-bar identifiers, notifications, email addresses, real addresses, filenames, documents, photos or expenses. Crop/redact anything not fictional.

## Store text
Short description:
> Din bolig, vedligeholdelse, dokumenter og udgifter samlet ét sted.

Release 1.0.0 notes:
> Første version af HusPass til Android. Saml boligoplysninger, vedligeholdelsesopgaver, dokumenter og relevante udgifter ét sted med personlig adgang.

## Privacy links
- Privacy: https://huspass.dk/privatliv
- Terms: https://huspass.dk/vilkaar
- Account deletion: https://huspass.dk/slet-konto

## Release gate
Do not mark screenshots or the feature graphic final until they have been visually checked against the final Android build. Permanent signing credentials and reviewer credentials must never be placed in this repository.
