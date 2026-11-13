import test from "node:test";
import assert from "node:assert/strict";
import { selectUnambiguousQuotePrice } from "./quote-price-evidence.mjs";

test("does not accept a prefix of a malformed price token", () => {
  for (const input of ["DKK 12.34", "DKK 12.34.567", "DKK 1,234", "DKK 1.23,45", "12.34 kr", "1,234 kr"]) {
    assert.equal(selectUnambiguousQuotePrice(input).status, "missing", input);
  }
});
test("preserves legitimate Danish price formats", () => {
  for (const [input, expected] of [["DKK 12500",12500],["12.500,50 kr",12500.5],["12 500,50 kr",12500.5]]) {
    assert.equal(selectUnambiguousQuotePrice(input).price?.amountDkk, expected, input);
  }
});
