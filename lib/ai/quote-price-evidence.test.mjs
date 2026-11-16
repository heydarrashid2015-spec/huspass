import test from "node:test";
import assert from "node:assert/strict";
import { extractDocumentedDkkPrices, selectUnambiguousQuotePrice } from "./quote-price-evidence.mjs";

test("extracts explicit DKK and preserves exact source span", () => {
  const input = "Tilbud: 12.500,50 kr. inkl. moms";
  const [price] = extractDocumentedDkkPrices(input);
  assert.equal(price.amountDkk, 12500.5);
  assert.equal(input.slice(price.start, price.end), price.evidence);
  assert.equal(price.vatIncluded, null);
});
test("does not invent price from bare numbers", () => {
  assert.equal(selectUnambiguousQuotePrice("CVR 12345678, 12 timer").status, "missing");
});
test("multiple monetary values require review", () => {
  assert.equal(selectUnambiguousQuotePrice("DKK 1000 plus DKK 250").status, "ambiguous");
});
test("empty or non-text input fails closed", () => {
  assert.deepEqual(extractDocumentedDkkPrices(null), []);
  assert.deepEqual(extractDocumentedDkkPrices(""), []);
});
test("preserves explicit zero but does not claim verified", () => {
  const result = selectUnambiguousQuotePrice("DKK 0");
  assert.equal(result.price.amountDkk, 0);
  assert.equal(result.status, "candidate_unverified");
});
test("rejects excessively long input", () => {
  assert.deepEqual(extractDocumentedDkkPrices("a".repeat(100001)), []);
});
