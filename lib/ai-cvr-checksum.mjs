/** Syntax validation only: a valid checksum does not prove CVR registration or activity. */
export function validateDanishCvr(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  const raw = String(value).trim();
  const match = /^(?:CVR(?:-nr\.)?\s*:?[ \t]*)?(\d{2})[ \t]?(\d{2})[ \t]?(\d{2})[ \t]?(\d{2})$/i.exec(raw);
  if (!match) return false;
  const digits = match.slice(1).join('').split('').map(Number);
  const weights = [2, 7, 6, 5, 4, 3, 2, 1];
  return digits.some(n => n !== 0) && digits.reduce((sum, n, i) => sum + n * weights[i], 0) % 11 === 0;
}

/** Caller-provided metadata cannot establish official registry verification. */
export function classifyCvrEvidence(record) {
  const checksumValid = validateDanishCvr(record?.cvr);
  return { checksumValid, registryVerified: false,
    label: checksumValid ? 'checksum_only_unverified' : 'invalid_cvr' };
}
