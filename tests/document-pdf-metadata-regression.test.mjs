import test from "node:test";
import assert from "node:assert/strict";
import { needsPdfPageOcr } from "../lib/document-ocr.js";

test("OCR is required when invoice PDF text contains only supplier metadata", () => {
  const layer = ["Faktura", "Nordlys VVS ApS", "CVR 12345678", "Fakturadato: 12.11.2026", "Fakturanr: 2048", "Total", "Moms"].join("\n");
  assert.equal(needsPdfPageOcr(layer), true);
});

test("OCR is required for scanned PDF with a total heading but no amount", () => {
  const layer = ["Scanned with Mobile Scanner", "Faktura", "CVR 12345678", "Dato: 12.11.2026", "Total"].join("\n");
  assert.equal(needsPdfPageOcr(layer), true);
});

test("OCR is not forced for scanned invoice text containing a monetary total", () => {
  const layer = ["Scanned with Mobile Scanner", "Faktura", "Nordlys VVS ApS", "Dato: 12.11.2026", "Total 1.250,00 kr."].join("\n");
  assert.equal(needsPdfPageOcr(layer), false);
});
