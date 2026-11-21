import test from "node:test";
import assert from "node:assert/strict";
import {parseDanishDocumentText} from "../lib/document-intelligence.js";
import {selectPdfPageText,needsPdfPageOcr} from "../lib/document-ocr.js";

test("scanned invoice metadata must not override a readable payable amount",()=>{
 const layer="Faktura\nNord Service ApS\nCVR 12345678\nAt betale: 1.250,00 DKK";
 const scanner="Scanned with mobile scanner\nFaktura\nDato: 12.11.2026";
 const chosen=selectPdfPageText(layer,scanner);
 assert.equal(chosen,layer);
 const fields=parseDanishDocumentText(chosen);
 assert.equal(fields.amount,1250);
 assert.equal(fields.requiresReview,true);
});

test("conflicting payable totals across PDF pages are never suggested as a confirmed amount",()=>{
 const pages=["Faktura\nNord Service ApS\nAt betale: 1.250,00 DKK","Side 2\nAt betale: 1.350,00 DKK"];
 const fields=parseDanishDocumentText(pages.join("\n"));
 assert.equal(fields.amount,null);
 assert.equal(fields.requiresReview,true);
});

test("missing total on a partially extracted PDF page triggers raster OCR even if another total is present",()=>{
 const page="Faktura\nAt betale: 1.250,00 DKK\nTotal:";
 assert.equal(needsPdfPageOcr(page),true);
});

test("conflicting warranty expiry dates require manual review",()=>{
 const fields=parseDanishDocumentText("Faktura\nNord Service ApS\nGaranti udløber: 12.11.2027\nGaranti udløber: 12.11.2028");
 assert.equal(fields.warrantyEnd,null);
 assert.equal(fields.requiresReview,true);
});
