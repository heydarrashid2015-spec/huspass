# Dependency reproducibility review — 2026-11-03

## Verified facts
- `package.json` specifies exact Next.js and React versions, but Supabase JS, Capacitor, and TypeScript use caret (`^`) version ranges.
- The repository has no committed `package-lock.json`.
- Web CI uses `npm install --no-package-lock`, so dependency resolution may change between builds.
- A passing build does not prove that the same transitive dependency versions will be installed in the next build.

## Recommended change (not applied to production)
1. In a controlled environment with registry access, run `npm install --package-lock-only --ignore-scripts` using the repository's Node 22 / npm toolchain.
2. Review the generated lockfile, dependency changes, and `npm audit` output; commit the reviewed `package-lock.json` to the feature branch.
3. Replace `npm install --no-package-lock` and other CI `npm install` commands with `npm ci`.
4. Run web build, static tests, Android build and signing checks on the same commit.
5. Only merge after verification and release approval.

Do not generate a fake lockfile or switch CI to `npm ci` before a valid lockfile exists. Do not deploy or modify Supabase production settings as part of this task.

## Supabase security review (read-only)
- RLS is enabled on public.homes, public.tasks, public.documents and public.support_messages.
- Policies require matching `auth.uid()` for row ownership; tasks and documents also check related home ownership for inserts and updates.
- Storage buckets `home-documents` and `home-images` are private, with owner-scoped object policies.
- Security advisor warns that leaked-password protection is disabled. Supabase documentation states this feature requires Pro or above; no paid upgrade is authorized.
- Performance advisor reported six unused indexes (informational only); do not remove indexes based on this finding alone.

These checks are not a substitute for cross-account integration tests, mobile end-to-end tests, or an external security audit.
