import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeTimeBoundContractorContact as check, MAX_CONSENT_AGE_MS as MAX } from './contractor-consent-validity.mjs';
const now = 1794800000000;
const input = (grantedAt, expiresAt) => ({
 ownerId:'owner-a', projectId:'project-a', contractorCvr:'12345678', now,
 consent:{status:'approved',ownerId:'owner-a',projectId:'project-a',contractorCvr:'12345678',grantedAt,expiresAt}
});
test('allows a recent consent within its thirty-day validity window', () => {
 assert.equal(check(input(now - 1000, now + 1000)).allowed, true);
});
test('rejects consent that remains active beyond thirty days from grant', () => {
 assert.equal(check(input(now - 1000, now + MAX)).reason, 'consent_validity_window_exceeded');
});
test('rejects an old grant even if its expiry is in the future', () => {
 assert.equal(check(input(now - MAX - 1, now + 1)).allowed, false);
});
test('preserves fail-closed behavior for revoked consent and mismatched owners', () => {
 const revoked = input(now - 1000, now + 1000); revoked.consent.status='revoked';
 assert.equal(check(revoked).allowed, false);
 const other = input(now - 1000, now + 1000); other.ownerId='other';
 assert.equal(check(other).allowed, false);
});
