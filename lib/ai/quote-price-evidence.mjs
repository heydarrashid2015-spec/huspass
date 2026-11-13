// Conservative text-only extraction. This does not authenticate the contractor or document.
export function extractDocumentedDkkPrices(text) {
  if (typeof text !== "string" || text.length > 100000) return [];
  // Capture complete numeric tokens first; never accept a truncated prefix as a price.
  const pattern = /(?:\bDKK\s*|\bkr\.?\s*)(\d[\d.,]*(?: \d{3}(?:,\d{1,2})?)*)|(\d[\d.,]*(?: \d{3}(?:,\d{1,2})?)*)\s*(?:DKK\b|kr\.?\b)/gi;
  const validAmount = /^(?:\d{1,3}(?:[. ]\d{3})+|\d+)(?:,\d{1,2})?$/;
  const found = [];
  for (const match of text.matchAll(pattern)) {
    // Reject partial numeric tokens (e.g. DKK 12.34 or 12.34 kr).
    // A regex match alone does not guarantee that the entire adjacent amount was parsed.
    const before = text[match.index - 1] ?? "";
    const after = text[match.index + match[0].length] ?? "";
    if (/[\d.,]/.test(before) || /[\d.,]/.test(after)) continue;
    const raw = match[1] ?? match[2];
    if (!validAmount.test(raw)) continue;
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
