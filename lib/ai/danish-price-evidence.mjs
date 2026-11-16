// Parse only explicit Danish kroner amounts appearing in contractor evidence.
// This does not determine VAT, quote authenticity, or whether a price is a total.
export function extractDanishPriceEvidence(sourceText) {
  if (typeof sourceText !== "string" || sourceText.length > 20000) throw new TypeError("invalid evidence");
  const results = [];
  // Require a currency marker and Danish decimal comma; thousands groups must be valid.
  const pattern = /(^|[^\p{L}\p{N}])((?:[1-9]\d{0,2}(?:\.\d{3})+|(?:0|[1-9]\d{0,11})),\d{2})\s*(kr\.?|DKK)(?![\p{L}\p{N}])/giu;
  for (const match of sourceText.matchAll(pattern)) {
    const raw = match[2];
    const major = raw.split(",")[0].replaceAll(".", "");
    if (major.length > 12) continue;
    const ore = BigInt(major) * 100n + BigInt(raw.split(",")[1]);
    results.push(Object.freeze({ literal: match[2] + " " + match[3], amountOre: ore.toString(), start: match.index + match[1].length, currency: "DKK" }));
  }
  return Object.freeze(results);
}
