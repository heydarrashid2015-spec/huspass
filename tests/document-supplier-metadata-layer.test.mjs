import test from "node:test";
import assert from "node:assert/strict";
import {needsPdfPageOcr} from "../lib/document-ocr.js";

test("supplier metadata-only text layer must trigger OCR",()=>{
 const layer="Faktura\nNordlys VVS ApS\nCVR: 12 34 56 78\nDato: 12.11.2026\nFakturanr: 1007";
 assert.equal(needsPdfPageOcr(layer),true);
});
test("supplier metadata with financial totals should retain text layer",()=>{
 const layer="Faktura\nNordlys VVS ApS\nCVR: 12 34 56 78\nDato: 12.11.2026\nTotal: 1.250,00 kr";
 assert.equal(needsPdfPageOcr(layer),false);
});
