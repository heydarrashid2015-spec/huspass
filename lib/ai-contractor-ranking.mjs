// Evidence-based contractor shortlisting. This module does not search the web or invent quotes.
// Input records must come from verified, attributable discovery sources.
export function rankContractors(candidates, project, { limit = 3 } = {}) {
  if (!Array.isArray(candidates)) throw new TypeError('candidates must be an array');
  const category = String(project?.category || '').trim().toLocaleLowerCase('da-DK');
  const postcode = String(project?.postcode || '').trim();
  const seen = new Set();
  return candidates.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    // Only trust evidence explicitly present on the record, not inherited prototype properties.
    const own = (key) => Object.hasOwn(candidate, key) ? candidate[key] : undefined;
    const name = String(own('name') || '').trim();
    const website = String(own('website') || '').trim();
    const sourceUrl = String(own('sourceUrl') || '').trim();
    const services = Array.isArray(own('services')) ? own('services').map(s => String(s).toLocaleLowerCase('da-DK')) : [];
    if (!name || !/^https:\/\//i.test(sourceUrl) || !services.includes(category)) return [];
    const normalizedCvr = typeof own('cvr') === 'string' ? own('cvr').trim() : String(own('cvr') ?? '');
    // Malformed CVRs must not collapse unrelated businesses into one identity; valid CVRs remain deduplicated pending official verification.
    const key = /^\d{8}$/.test(normalizedCvr)
      ? 'cvr:' + normalizedCvr
      : 'name:' + name.toLocaleLowerCase('da-DK');
    const evidence = [];
    let score = 50;
    if (postcode && Array.isArray(own('servicePostcodes')) && own('servicePostcodes').map(String).includes(postcode)) {
      score += 25; evidence.push('documented_service_area');
    }
    if (own('cvrVerified') === true && /^\d{8}$/.test(normalizedCvr)) {
      score += 15; evidence.push('verified_cvr');
    }
    if (own('specialismVerified') === true) {
      score += 10; evidence.push('verified_specialism');
    }
    return [{ ...candidate, name, website, sourceUrl, score, evidence, dedupKey: key, quoteStatus: 'not_requested', quotedPrice: null }];
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'da')).filter(candidate => { if (seen.has(candidate.dedupKey)) return false; seen.add(candidate.dedupKey); return true; }).slice(0, Math.max(0, Math.min(3, Math.trunc(limit) || 0))).map(({ dedupKey, ...candidate }) => candidate);
}

export function compareVerifiedQuotes(quotes) {
  if (!Array.isArray(quotes)) throw new TypeError('quotes must be an array');
  return quotes.map((quote) => {
    // Provenance and commercial terms must be explicit own fields, never inherited.
    const own = (key) => quote !== null && typeof quote === 'object' &&
      Object.hasOwn(quote, key) ? quote[key] : undefined;
    // Never coerce absent, blank, boolean or object values into a fabricated DKK 0 price.
    const rawPrice = own('totalPrice');
    const validType = typeof rawPrice === 'number' ||
      (typeof rawPrice === 'string' && /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(rawPrice.trim()));
    const price = validType ? Number(rawPrice) : NaN;
    const verified = own('sourceType') === 'contractor_document' &&
      typeof own('documentId') === 'string' && own('documentId').trim().length > 0 &&
      Number.isFinite(price) && price >= 0 && own('currency') === 'DKK';
    const missing = ['scope', 'materials', 'warranty', 'validUntil'].filter(k =>
      typeof own(k) !== 'string' || own(k).trim().length === 0);
    if (typeof own('vatIncluded') !== 'boolean') missing.push('vatIncluded');
    return { ...(quote && typeof quote === 'object' ? quote : {}),
      comparable: verified && missing.length === 0, verifiedPrice: verified ? price : null,
      missingFields: missing, warning: !verified ? 'price_not_verified' : missing.length ? 'terms_incomplete' : null };
  });
}
