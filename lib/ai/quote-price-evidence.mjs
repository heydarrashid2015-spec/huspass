// Conservative text-only extraction. This does not authenticate the contractor or document.
export function extractDocumentedDkkPrices(text) {
  if (typeof text !== "string" || text.length > 100000) return [];
  const pattern = /(?:\bDKK\s*|\bkr\.?\s*)(\d{1,3}(?:[. ]\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)|(?:\b)(\d{1,3}(?:[. ]\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:DKK\b|kr\.?\b)/gi;
  const found = [];
  for (const match of text.matchAll(pattern)) {
    const raw = match[1] ?? match[2];
    const normalized = raw.replace(/[. ]/g, "").replace(",", ".");
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1000000000) continue;
    const start = match.index;
    const end = start + match[0].length;
    found.push({ amountDkk: amount, evidence: match[0], start, end, currency: "DKK", vatIncluded: null });
  }
  return found;
}

export function selectUnambiguousQuotePrice(text) {
  const prices = extractDocumentedDkkPrices(text);
  if (prices.length !== 1) return { status: prices.length ? "ambiguous" : "missing", price: null, evidence: prices };
  return { status: "candidate_unverified", price: prices[0], evidence: prices };
}
