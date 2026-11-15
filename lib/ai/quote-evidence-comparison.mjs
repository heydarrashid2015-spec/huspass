/**
 * Quote evidence gate: never infer VAT, materials, warranty or scope from missing fields.
 * Pure module; no network, no customer data and no contractor outreach.
 */
export function compareDocumentedQuotes(quotes) {
  if (!Array.isArray(quotes)) throw new TypeError("quotes must be an array");
  const ids = new Set();
  return quotes.map((quote) => {
    if (!quote || typeof quote !== "object" || Array.isArray(quote)) throw new TypeError("invalid quote");
    const { id, amountDkk, vat, materials, warranty, scope, sourceText } = quote;
    if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(id) || ids.has(id)) throw new TypeError("invalid or duplicate quote id");
    ids.add(id);
    if (typeof sourceText !== "string" || !sourceText.trim()) throw new TypeError("source evidence required");
    if (sourceText.length > 20000) throw new TypeError("source evidence too long");
    // Exact decimal money only. Avoid binary floating-point and inferred tax.
    const price = typeof amountDkk === "string" && /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/.test(amountDkk)
      ? BigInt(amountDkk.split(".")[0]) * 100n + BigInt((amountDkk.split(".")[1] || "").padEnd(2, "0"))
      : null;
    if (price === null) throw new TypeError("explicit decimal DKK amount required");
    // A supplied price is not evidence unless the same literal amount occurs in
    // the contractor text. Do not infer a normalized price from ambiguous formats.
    const escapedAmount = amountDkk.replace(".", "\\.");
    const amountInSource = new RegExp("(^|[^0-9.,])" + escapedAmount + "(?=$|[^0-9.,])").test(sourceText);
    if (!amountInSource) throw new TypeError("price must occur verbatim in source evidence");
    if (!["included", "excluded", "unknown"].includes(vat)) throw new TypeError("VAT status must be explicit");
    const documented = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 2000 ? value.trim() : null;
    return Object.freeze({
      id, amountOre: price.toString(), currency: "DKK", vat,
      materials: documented(materials), warranty: documented(warranty),
      scope: documented(scope), evidenceProvided: true,
      // Different VAT bases must not be ranked as if directly comparable.
      comparablePrice: vat === "included"
    });
  });
}
