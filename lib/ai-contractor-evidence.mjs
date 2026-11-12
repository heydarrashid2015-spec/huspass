// Offline evidence validation for contractor discovery.
// A source URL is an audit pointer, NOT proof that the page was fetched or CVR verified.
const OFFICIAL_HOSTS = new Set(['datacvr.virk.dk', 'virk.dk', 'www.virk.dk', 'datacvr.virk.dk']);
function httpsUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return null;
    if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) return null;
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) || url.hostname.includes(':')) return null;
    return url;
  } catch { return null; }
}
export function inspectContractorEvidence(candidate) {
  const cvr = String(candidate?.cvr ?? '').replace(/\s/g, '');
  const source = httpsUrl(candidate?.sourceUrl);
  const registry = httpsUrl(candidate?.registryUrl);
  const registryHost = registry?.hostname.toLowerCase();
  const registryPointer = Boolean(registry && OFFICIAL_HOSTS.has(registryHost));
  const registryMatchesCvr = registryPointer && /^\d{8}$/.test(cvr) &&
    registry.searchParams.get('cvr') === cvr;
  // An official registry pointer does not establish that the registry returned a valid record.
  const officialVerification = candidate?.registryEvidence?.status === 'verified' &&
    candidate.registryEvidence.cvr === cvr &&
    candidate.registryEvidence.source === 'official_registry_response' &&
    registryMatchesCvr && Boolean(candidate.registryEvidence.checkedAt);
  return {
    cvr,
    attributableSource: Boolean(source),
    registryPointer: Boolean(registryPointer),
    registryMatchesCvr: Boolean(registryMatchesCvr),
    officialVerification: Boolean(officialVerification),
    verificationStatus: officialVerification ? 'verified_evidence_supplied' : 'unverified',
  };
}
export function shortlistWithEvidence(candidates, project) {
  if (!Array.isArray(candidates)) throw new TypeError('candidates must be an array');
  const category = String(project?.category ?? '').trim().toLocaleLowerCase('da-DK');
  const postcode = String(project?.postcode ?? '').trim();
  if (!category || !/^\d{4}$/.test(postcode)) return [];
  const seen = new Set();
  return candidates.flatMap(candidate => {
    const evidence = inspectContractorEvidence(candidate);
    const name = String(candidate?.name ?? '').trim();
    const services = Array.isArray(candidate?.services) ? candidate.services.map(s => String(s).trim().toLocaleLowerCase('da-DK')) : [];
    const postcodes = Array.isArray(candidate?.servicePostcodes) ? candidate.servicePostcodes.map(String) : [];
    if (!name || !evidence.attributableSource || !services.includes(category) || !postcodes.includes(postcode)) return [];
    const key = evidence.cvr && /^\d{8}$/.test(evidence.cvr) ? 'cvr:' + evidence.cvr : 'name:' + name.toLocaleLowerCase('da-DK');
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ name, cvr: evidence.cvr || null, sourceUrl: candidate.sourceUrl,
      registryUrl: evidence.registryPointer ? candidate.registryUrl : null,
      verificationStatus: evidence.verificationStatus,
      score: 50 + (evidence.officialVerification ? 20 : 0),
      scoreEvidence: ['documented_category', 'declared_service_postcode', ...(evidence.officialVerification ? ['supplied_registry_verification'] : [])],
      quoteStatus: 'not_requested', quotedPrice: null }];
  }).sort((a,b) => b.score-a.score || a.name.localeCompare(b.name,'da')).slice(0,3);
}
