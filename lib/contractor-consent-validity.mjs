// Optional stricter policy around the existing consent gate.
// The server must obtain authenticated identity and persisted consent itself.
import { authorizeContractorContact } from './contractor-contact-consent.mjs';
export const MAX_CONSENT_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const field = (object, name) => {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return undefined;
  const d = Object.getOwnPropertyDescriptor(object, name);
  return d && Object.hasOwn(d, 'value') ? d.value : undefined;
};
export function authorizeTimeBoundContractorContact(input) {
  const base = authorizeContractorContact(input);
  if (!base.allowed) return base;
  const { consent, now } = input;
  const grantedAt = field(consent, 'grantedAt');
  const expiresAt = field(consent, 'expiresAt');
  if (now - grantedAt > MAX_CONSENT_AGE_MS || expiresAt - grantedAt > MAX_CONSENT_AGE_MS)
    return Object.freeze({ allowed: false, reason: 'consent_validity_window_exceeded' });
  return base;
}
