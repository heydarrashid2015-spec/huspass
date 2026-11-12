import { validateDanishCvr } from './ai-cvr-checksum.mjs';

/**
 * Select up to three independently registry-confirmed businesses.
 * verifiedRegistryRows MUST be populated by an authenticated server-side registry
 * adapter, never from request JSON or a browser-provided source/verified flag.
 * Empty/unavailable registry data intentionally yields no recommendations.
 */
export function selectVerifiedContractors(candidates, verifiedRegistryRows, { category, postalCode } = {}) {
  if (!Array.isArray(candidates) || !Array.isArray(verifiedRegistryRows)) return [];
  if (typeof category !== 'string' || !category.trim() || !/^\\d{4}$/.test(String(postalCode ?? ''))) return [];
  const registry = new Map();
  for (const row of verifiedRegistryRows) {
    if (!row || !validateDanishCvr(row.cvr) || row.active !== true || typeof row.name !== 'string' || !row.name.trim()) continue;
    registry.set(String(row.cvr).replace(/\\D/g, ''), row);
  }
  const seen = new Set();
  const eligible = [];
  for (const candidate of candidates) {
    if (!candidate || !validateDanishCvr(candidate.cvr)) continue;
    const cvr = String(candidate.cvr).replace(/\\D/g, '');
    const official = registry.get(cvr);
    if (!official || seen.has(cvr)) continue;
    if (!Array.isArray(candidate.categories) || !candidate.categories.includes(category)) continue;
    if (!Array.isArray(candidate.postalCodes) || !candidate.postalCodes.map(String).includes(String(postalCode))) continue;
    if (typeof candidate.sourceUrl !== 'string' || !/^https:\/\/[^\s]+$/i.test(candidate.sourceUrl)) continue;
    seen.add(cvr);
    eligible.push({ cvr, name: official.name, sourceUrl: candidate.sourceUrl, registryVerified: true, quoteStatus: 'not_requested', priceDkk: null });
  }
  return eligible.sort((a,b) => a.cvr.localeCompare(b.cvr)).slice(0,3);
}
