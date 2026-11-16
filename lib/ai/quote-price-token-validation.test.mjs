import test from "node:test";
import assert from "node:assert/strict";
import { extractDocumentedDkkPrices, selectUnambiguousQuotePrice } from "./quote-price-evidence.mjs";

test("reads ungrouped amounts without truncation", () => {
  for (const [input, expected] of [["DKK 12500",12500],["12500 kr",12500],["DKK 1234567,50",1234567.5]]) {
    const result = selectUnambiguousQuotePrice(input);
    assert.equal(result.price?.amountDkk, expected, input);
    assert.equal(result.price?.evidence, input);
  }
});
test("rejects malformed grouping rather than accepting a partial number", () => {
  for (const input of ["DKK 12.34", "DKK 12.34.567", "DKK 1,234", "DKK 1.23,45"]) {
    assert.equal(selectUnambiguousQuotePrice(input).status, "missing", input);
  }
});
test("accepts Danish thousands separators and decimal comma", () => {
  for (const input of ["DKK 12.500,50", "12 500,50 kr"]) {
    assert.equal(selectUnambiguousQuotePrice(input).price?.amountDkk, 12500.5);
  }
});
test("does not infer VAT or verify a quote", () => {
  const result = selectUnambiguousQuotePrice("DKK 12500");
  assert.equal(result.status, "candidate_unverified");
  assert.equal(result.price.vatIncluded, null);
});
