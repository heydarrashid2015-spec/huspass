import test from "node:test";
import assert from "node:assert/strict";
import { compareDocumentedQuotes } from "../lib/ai/quote-evidence-comparison.mjs";

const quote = (overrides = {}) => ({ id: "q1", amountDkk: "1200.05", vat: "included", sourceText: "Written contractor quote: 1200.05 DKK", ...overrides });
test("preserves exact øre and documented scope without guessing", () => {
  const [result] = compareDocumentedQuotes([quote()]);
  assert.equal(result.amountOre, "120005");
  assert.equal(result.materials, null);
  assert.equal(result.warranty, null);
  assert.equal(result.scope, null);
  assert.equal(result.comparablePrice, true);
});
test("unknown or excluded VAT is not comparable to VAT-included pricing", () => {
  assert.equal(compareDocumentedQuotes([quote({vat:"unknown"})])[0].comparablePrice, false);
  assert.equal(compareDocumentedQuotes([quote({vat:"excluded"})])[0].comparablePrice, false);
});
test("rejects undocumented prices, unsafe floats and absent evidence", () => {
  for (const changes of [{amountDkk: 1200.05}, {amountDkk: "1e3"}, {amountDkk: "1.234"}, {sourceText:""}]) {
    assert.throws(() => compareDocumentedQuotes([quote(changes)]), TypeError);
  }
});
test("rejects duplicate identifiers and unsupported VAT", () => {
  assert.throws(() => compareDocumentedQuotes([quote(), quote()]), TypeError);
  assert.throws(() => compareDocumentedQuotes([quote({vat:"assumed"})]), TypeError);
});

test("rejects price absent from contractor evidence or embedded in another amount", () => {
  for (const sourceText of ["Written quote only", "11200.05 DKK", "1200.050 DKK", "1200,05 DKK"]) {
    assert.throws(() => compareDocumentedQuotes([quote({ sourceText })]), /price must occur verbatim/);
  }
});
test("accepts only an exact explicitly quoted decimal amount", () => {
  assert.equal(compareDocumentedQuotes([quote({ sourceText: "Total 1200.05 kr incl. moms" })])[0].amountOre, "120005");
});
