# Household sharing: authorization contract

Status: design and test contract, **not deployed**. Never grant cross-account access until every scenario below is tested against two separate authenticated users.

## User journey
1. Owner selects their existing home and chooses **Invitér til min bolig**.
2. Owner enters invitee email and chooses **Se boligen** or **Redigér boligen**. Default is view-only.
3. Server validates home ownership, normalizes email, rate-limits invitations, generates a cryptographically random single-use token, stores only its hash, and sends a link. Expire after 48 hours. Do not expose tokens in logs or URLs forwarded to third parties.
4. Recipient signs in with a verified email matching the invitation. Server atomically consumes the token and creates membership for the **same home_id**.
5. Owner can list members and revoke membership immediately; membership never changes home.user_id.

## Authorization boundaries
- Only owner can invite, change roles, remove members, delete the home or transfer ownership (ownership transfer is out of scope).
- Viewer may read selected home fields and tasks, but not change them.
- Editor may update approved home fields and create/update tasks; cannot change home.user_id, memberships, invitations, billing, private account settings, or permissions.
- Documents, file paths, image storage and task offers remain owner-only until separately audited and explicitly opted in.
- Use a server-authorized membership lookup in RLS for homes and tasks; never trust client-supplied home_id, role or email. Maintain both SELECT and UPDATE policies with WITH CHECK to prevent cross-home reassignment.
- Existing client queries filter by user_id, so shared-home reads and writes require explicit refactoring; adding RLS alone will **not** make sharing work.
- Revocation must stop new database reads/writes and issuance of new file URLs immediately. **Previously issued Supabase Storage signed URLs are bearer credentials and can remain usable until expiration even after membership revocation.** Never promise immediate revocation of an already issued signed URL. Keep shared files private by default; before enabling shared documents, choose a documented mitigation (short-lived signed URLs with a clearly bounded exposure window, or an authenticated server proxy that rechecks current membership on every request), and test direct URL reuse after revocation. No service-role key in browser.

## Required integration tests before enabling
1. Owner invites a second verified account; invitation cannot be accepted by another email.
2. Expired, reused, revoked, forged, or malformed token is rejected.
3. Viewer cannot insert, update, delete or invite; editor cannot invite or modify ownership.
4. Editor updates a permitted field; owner sees it on the same home after reload.
5. Editor cannot edit a different home by replacing home_id or user_id in a request.
6. Revoked member immediately loses read/write access to home and tasks.
7. Documents, storage objects, offers and private profile remain inaccessible; attempt direct object paths and guessed document IDs across accounts. Test that a signed URL issued before revocation behaves according to the chosen revocation design, and that no new URL can be issued afterward.
8. Existing single-user workflows continue to work with no memberships.
9. Parallel acceptance and revocation cannot create duplicate memberships.
10. Audit log captures who changed what and when, without storing invite tokens.

## Release gate
Do not merge as functional sharing, apply database grants, or enable the invitation button until these tests pass in a non-production environment. No payment or subscription changes.
