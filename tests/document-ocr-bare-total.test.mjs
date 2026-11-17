import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/document-ocr.js", import.meta.url), "utf8");
const { needsPdfPageOcr } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));

test("metadata-only invoice with a bare Total label must request OCR", () => {
  const layer = "Faktura\nEksempel ApS\nCVR: 12345678\nDato: 17.11.2026\nTotal";
  assert.equal(needsPdfPageOcr(layer), true);
});

test("invoice with an actual total amount retains usable text layer", () => {
  const layer = "Faktura\nEksempel ApS\nCVR: 12345678\nDato: 17.11.2026\nTotal: 1.250,00 kr";
  assert.equal(needsPdfPageOcr(layer), false);
});
