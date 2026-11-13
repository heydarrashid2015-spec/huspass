// Evidence-based contractor shortlisting. This module does not search the web or invent quotes.
// Input records must come from verified, attributable discovery sources.
export function rankContractors(candidates, project, { limit = 3 } = {}) {
  if (!Array.isArray(candidates)) throw new TypeError('candidates must be an array');
  const category = String(project?.category || '').trim().toLocaleLowerCase('da-DK');
  const postcode = String(project?.postcode || '').trim();
  const seen = new Set();
  return candidates.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const name = String(candidate.name || '').trim();
    const website = String(candidate.website || '').trim();
    const sourceUrl = String(candidate.sourceUrl || '').trim();
    const services = Array.isArray(candidate.services) ? candidate.services.map(s => String(s).toLocaleLowerCase('da-DK')) : [];
    // Never display an untraceable company or an unverified claim as a recommendation.
    if (!name || !/^https:\/\//i.test(sourceUrl) || !services.includes(category)) return [];
    const key = (candidate.cvr ? 'cvr:' + String(candidate.cvr).replace(/\D/g, '') : 'name:' + name.toLocaleLowerCase('da-DK'));
    if (seen.has(key)) return [];
    seen.add(key);
    const evidence = [];
    let score = 50;
    if (postcode && Array.isArray(candidate.servicePostcodes) && candidate.servicePostcodes.map(String).includes(postcode)) {
      score += 25; evidence.push('documented_service_area');
    }
    if (candidate.cvrVerified === true && /^\d{8}$/.test(String(candidate.cvr || ''))) {
      score += 15; evidence.push('verified_cvr');
    }
    if (candidate.specialismVerified === true) {
      score += 10; evidence.push('verified_specialism');
    }
    return [{ ...candidate, name, website, sourceUrl, score, evidence, quoteStatus: 'not_requested', quotedPrice: null }];
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'da')).slice(0, Math.max(0, Math.min(3, Math.trunc(limit) || 0)));
}

export function compareVerifiedQuotes(quotes) {
  if (!Array.isArray(quotes)) throw new TypeError('quotes must be an array');
  return quotes.map((quote) => {
    const price = Number(quote?.totalPrice);
    const verified = quote?.sourceType === 'contractor_document' && Boolean(quote?.documentId) &&
      Number.isFinite(price) && price >= 0 && quote?.currency === 'DKK';
    const missing = ['scope', 'materials', 'vatIncluded', 'warranty', 'validUntil'].filter(k =>
      quote?.[k] === undefined || quote?.[k] === null || quote?.[k] === '');
    return { ...quote, comparable: verified && missing.length === 0, verifiedPrice: verified ? price : null,
      missingFields: missing, warning: !verified ? 'price_not_verified' : missing.length ? 'terms_incomplete' : null };
  });
}
