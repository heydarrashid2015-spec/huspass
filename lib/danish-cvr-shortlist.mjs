// Pure Danish CVR validation and evidence-based shortlist. No network access or outreach.
// Registry verification must be supplied by a trusted backend, not the browser.
const weights = [2,7,6,5,4,3,2,1];
export function isValidDanishCvr(value) {
  if (typeof value !== 'string' || !/^\\d{8}$/.test(value)) return false;
  return [...value].reduce((sum,digit,index)=>sum+Number(digit)*weights[index],0)%11===0;
}
export function shortlistVerifiedContractors(candidates, {category, municipality}) {
  if (!Array.isArray(candidates) || typeof category!=='string' || !category.trim() ||
      typeof municipality!=='string' || !municipality.trim()) return [];
  const eligible = candidates.filter(c=>c && isValidDanishCvr(c.cvr) &&
    c.registryVerified === true && c.registryStatus === 'active' &&
    typeof c.registryEvidenceUrl === 'string' && /^https:\/\//.test(c.registryEvidenceUrl) &&
    Array.isArray(c.categories) && c.categories.includes(category) &&
    Array.isArray(c.municipalities) && c.municipalities.includes(municipality));
  const unique = new Map();
  for(const c of eligible) if(!unique.has(c.cvr)) unique.set(c.cvr,c);
  // No fabricated scores: only explicit, bounded verified evidence counts.
  return [...unique.values()].filter(c=>Number.isInteger(c.verifiedRelevantJobs) &&
    c.verifiedRelevantJobs>=0 && c.verifiedRelevantJobs<=100000)
    .sort((a,b)=>b.verifiedRelevantJobs-a.verifiedRelevantJobs || a.cvr.localeCompare(b.cvr))
    .slice(0,3).map(c=>Object.freeze({cvr:c.cvr,name:c.name,registryEvidenceUrl:c.registryEvidenceUrl,
      verifiedRelevantJobs:c.verifiedRelevantJobs}));
}
