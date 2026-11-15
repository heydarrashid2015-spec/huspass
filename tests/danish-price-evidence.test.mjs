import test from "node:test";
import assert from "node:assert/strict";
import { extractDanishPriceEvidence } from "../lib/ai/danish-price-evidence.mjs";
test("extracts only explicit Danish currency with precise øre", () => {
  assert.deepEqual(extractDanishPriceEvidence("Pris 1.234,50 kr. og 99,05 DKK").map(x=>x.amountOre), ["123450","9905"]);
});
test("rejects ambiguous separators, non-currency and embedded identifiers", () => {
  for(const text of ["1.23,50 kr", "12,50", "x12,50 kr", "12,500 kr", "12.34,50 DKK"]) assert.equal(extractDanishPriceEvidence(text).length,0);
});
test("never infers VAT or scope from the evidence", () => {
  const [price]=extractDanishPriceEvidence("Total 12.000,00 kr");
  assert.equal(price.amountOre,"1200000");
  assert.equal(Object.hasOwn(price,"vat"),false);
  assert.equal(Object.hasOwn(price,"scope"),false);
});
test("rejects oversized evidence",()=>assert.throws(()=>extractDanishPriceEvidence("x".repeat(20001)),TypeError));
