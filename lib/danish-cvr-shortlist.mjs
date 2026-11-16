// Pure Danish CVR validation and evidence-based shortlist. No network access or outreach.
// Registry verification must be supplied by a trusted backend, not the browser.
// These checks validate shape only; they do not authenticate registry evidence.
const weights = [2,7,6,5,4,3,2,1];
export function isValidDanishCvr(value) {
  if (typeof value !== 'string' || !/^\d{8}$/.test(value)) return false;
  return [...value].reduce((sum,digit,index)=>sum+Number(digit)*weights[index],0)%11===0;
}
export function isSafeEvidenceUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) &&
      !url.username && !url.password && !url.hash &&
      !/\s/.test(value);
  } catch { return false; }
}
// A syntactically safe URL is not proof of an official CVR source.
// Only the exact official registry host is accepted for registry evidence;
// lookalike subdomains and arbitrary HTTPS sites must not pass this gate.
export function isOfficialRegistryEvidenceUrl(value) {
  if (!isSafeEvidenceUrl(value)) return false;
  try {
    const url = new URL(value);
    return url.hostname === 'datacvr.virk.dk' && url.port === '';
  } catch { return false; }
}
export function shortlistVerifiedContractors(candidates, {category, municipality}) {
  if (!Array.isArray(candidates) || typeof category!=='string' || !category.trim() ||
      typeof municipality!=='string' || !municipality.trim()) return [];
  const eligible = candidates.filter(c=>c && isValidDanishCvr(c.cvr) &&
    c.registryVerified === true && c.registryStatus === 'active' &&
    isOfficialRegistryEvidenceUrl(c.registryEvidenceUrl) &&
    typeof c.name === 'string' && c.name.trim().length > 0 && c.name.length <= 200 &&
    Array.isArray(c.categories) && c.categories.includes(category) &&
    Array.isArray(c.municipalities) && c.municipalities.includes(municipality) &&
    Number.isInteger(c.verifiedRelevantJobs) && c.verifiedRelevantJobs >= 0 &&
    c.verifiedRelevantJobs <= 100000);
  // Duplicate CVR entries are not independent evidence. Conservatively discard
  // conflicting records rather than silently picking the first or highest score.
  const byCvr = new Map();
  const conflicts = new Set();
  for (const c of eligible) {
    const previous = byCvr.get(c.cvr);
    if (previous && (previous.name !== c.name ||
        previous.registryEvidenceUrl !== c.registryEvidenceUrl ||
        previous.verifiedRelevantJobs !== c.verifiedRelevantJobs)) conflicts.add(c.cvr);
    else if (!previous) byCvr.set(c.cvr,c);
  }
  return [...byCvr.values()].filter(c=>!conflicts.has(c.cvr))
    .sort((a,b)=>b.verifiedRelevantJobs-a.verifiedRelevantJobs || a.cvr.localeCompare(b.cvr))
    .slice(0,3).map(c=>Object.freeze({cvr:c.cvr,name:c.name,registryEvidenceUrl:c.registryEvidenceUrl,
      verifiedRelevantJobs:c.verifiedRelevantJobs}));
}
