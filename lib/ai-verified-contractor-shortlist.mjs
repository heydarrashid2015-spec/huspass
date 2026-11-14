// Production-facing shortlist gate. A ranking score is not proof of CVR validity.
// CVR verification must be performed upstream against an authoritative registry.
import { rankContractors } from './ai-contractor-ranking.mjs';

const own = (record, key) => Object.hasOwn(record, key);
const safeRecord = value => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype ||
  Object.getPrototypeOf(value) === null) &&
  Object.values(Object.getOwnPropertyDescriptors(value)).every(d => own(d, 'value'));

// Reject URL authority spoofing (userinfo), non-HTTPS protocols, and malformed hosts.
// This is syntactic provenance hygiene, not evidence that the source is authoritative.
export function isSafeEvidenceUrl(value) {
  if (typeof value !== 'string' || /[\\\u0000-\u0020\u007f]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !!url.hostname &&
      !url.username && !url.password && !url.port &&
      !url.hash && !url.hostname.endsWith('.') &&
      url.hostname.includes('.') && !url.hostname.startsWith('.') &&
      // Never accept local or IP-literal evidence hosts (including IPv6).
      !url.hostname.includes(':') &&
      !/^\d+(?:\.\d+){3}$/.test(url.hostname) &&
      !/\\.(?:localhost|local|internal|test|invalid|example)$/.test(url.hostname) &&
      !['localhost', 'example.com', 'example.org', 'example.net'].includes(url.hostname);
  } catch { return false; }
}

export function shortlistVerifiedContractors(candidates, project) {
  if (!Array.isArray(candidates)) throw new TypeError('candidates must be an array');
  if (!safeRecord(project) || typeof project.category !== 'string' ||
      !project.category.trim() || typeof project.postcode !== 'string' ||
      !/^\d{4}$/.test(project.postcode)) return [];
  const vetted = candidates.filter(c => {
    if (!safeRecord(c)) return false;
    const required = ['cvr','cvrVerified','sourceUrl','name','services','servicePostcodes'];
    if (!required.every(k => own(c,k))) return false;
    if (c.cvrVerified !== true || typeof c.cvr !== 'string' ||
        !/^\d{8}$/.test(c.cvr)) return false;
    if (!isSafeEvidenceUrl(c.sourceUrl)) return false;
    if (!Array.isArray(c.services) || !c.services.every(s => typeof s === 'string')) return false;
    if (!Array.isArray(c.servicePostcodes) ||
        !c.servicePostcodes.every(s => typeof s === 'string')) return false;
    // An explicit service area match is mandatory, not just a ranking bonus.
    return c.servicePostcodes.includes(project.postcode);
  });
  return rankContractors(vetted, project, {limit:3});
}
