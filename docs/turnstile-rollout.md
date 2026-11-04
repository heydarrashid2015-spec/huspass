# HusPass Turnstile rollout checklist

Status: **not enabled in production**. Do not merge until validated.

## Configuration
- `NEXT_PUBLIC_TURNSTILE_ENABLED` defaults to disabled; set `true` only for a dedicated test deployment initially.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is public and must be set explicitly; if absent, the challenge stays disabled. Use a Cloudflare testing site key for local/preview tests or a widget whose allowed hostname matches the test URL.
- **Never** put the Cloudflare secret key in `NEXT_PUBLIC_*` variables or GitHub source. Enter it only in Supabase Auth CAPTCHA settings when ready.
- The Supabase Auth CAPTCHA toggle must stay off in production until the frontend is deployed and confirmed compatible. Enabling it prematurely may block logins.

## Release gates
1. GitHub web build succeeds (necessary, not sufficient).
2. Validate Turnstile script loading, completion, expiration, retry, and errors on mobile and desktop browsers.
3. Validate signup, sign-in, password recovery, and resend confirmation with Supabase CAPTCHA enabled in an **isolated test project**. A preview connected to production Supabase cannot fully test server enforcement safely.
4. Verify email confirmation and return-to-login behavior. The old background password sign-in is disabled when CAPTCHA is enabled; users may need to log in manually.
5. Verify Android WebView access to challenges.cloudflare.com and supported hostnames.
6. Confirm production widget hostname, server-side secret in Supabase, and rollback plan before enabling CAPTCHA for real users.

## Rollback
If users cannot authenticate, disable Supabase Auth CAPTCHA immediately using the dashboard; roll back frontend feature flag/deployment separately. Never expose secret keys in tickets or screenshots.

## Recovery callback and session handling
The password recovery request now uses `window.location.origin`, not a fixed production hostname. The originating URL must be included in the Supabase redirect allowlist. Static regression tests protect the recovery screen from subsequent `SIGNED_IN` events and initial session lookup, but actual email-link and Android WebView navigation still require manual testing. Do not point preview authentication at the live customer database.

## Verification matrix (pending manual end-to-end validation)
| Scenario | Expected result |
| --- | --- |
| Existing account, correct password and valid challenge | Sign-in succeeds |
| Existing account, incorrect password | Generic error; challenge resets for retry |
| Signup, valid challenge | Confirmation email sent; no unexpected sign-in |
| Confirmation link opened in another browser/device | User can explicitly sign in afterward; do not rely on automatic polling |
| Password reset request with valid challenge | Email callback returns to the originating, allowlisted origin |
| Expired or failed challenge | Form submission blocked until challenge is retried |
| Resend confirmation | Requires a fresh challenge; repeat attempts respect provider rate limits |
| Android WebView | Widget loads, challenge completes, navigation and return to app work |

**Important:** Passing GitHub Actions verifies buildability only. This matrix is not yet executed. Do not mark any scenario as passed without evidence from an isolated Supabase Auth test environment.

## Release blockers and evidence
- Automated static checks and Next.js build pass on the feature branch, but they do **not** verify CAPTCHA enforcement.
- A valid Turnstile widget response is only an input to Supabase; backend enforcement must be verified separately with CAPTCHA enabled on an isolated Auth project.
- The frontend retains production Supabase defaults only when Turnstile is disabled. When Turnstile is enabled, the build guard requires explicit isolated Supabase URL and publishable key and rejects the known production Supabase URL. CI checks the rejection path. A preview deployment must **not** be used to exercise account creation, recovery, or login against real customers.
- The current Android build is not a verified Turnstile-compatible build. Test actual WebView behavior, redirects, challenge errors and recovery on a nonproduction app build.
- Verify Cloudflare allowed hostnames and Supabase redirect allowlist for the chosen preview URL. Avoid putting any secret in public build flags.

## Single-project decision (2026-11-02)
The owner chose to keep only the existing HusPass Supabase project and avoid new charges. Accordingly, do **not** create a second project, enable production Auth CAPTCHA, merge this branch, or claim full E2E coverage. Static tests and builds can continue safely. A true server-side CAPTCHA enforcement test remains blocked without an isolated Auth backend or an explicitly approved maintenance/testing window with a rollback plan; no production authentication experiments are authorized by this decision.
