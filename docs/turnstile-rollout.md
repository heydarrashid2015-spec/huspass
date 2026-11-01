# HusPass Turnstile rollout checklist

Status: **not enabled in production**. Do not merge until validated.

## Configuration
- `NEXT_PUBLIC_TURNSTILE_ENABLED` defaults to disabled; set `true` only for a dedicated test deployment initially.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is public. Use a Cloudflare testing site key for local/preview tests or a widget whose allowed hostname matches the test URL.
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
