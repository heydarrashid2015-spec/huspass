/** Offline CVR syntax/check-digit screening only. Not registry verification. */
export function inspectDanishCvr(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return { valid: false, reason: 'invalid_type' };
  const raw = String(value).trim();
  // Never silently strip arbitrary characters: doing so can turn an attacker-controlled
  // identifier into a different company's CVR.
  if (!/^\d{8}$/.test(raw)) return { valid: false, reason: 'invalid_format' };
  const weights = [2, 7, 6, 5, 4, 3, 2, 1];
  const checksum = [...raw].reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
  if (checksum % 11 !== 0) return { valid: false, reason: 'invalid_checksum' };
  return { valid: true, cvr: raw, reason: null, registryVerified: false };
}

/** Require independent, server-fetched registry evidence before calling a CVR verified. */
export function isVerifiedCvrMatch(cvr, registryRecord) {
  const check = inspectDanishCvr(cvr);
  return check.valid && registryRecord?.source === 'server_registry_lookup'
    && registryRecord?.verified === true
    && registryRecord?.cvr === check.cvr
    && registryRecord?.active === true;
}
