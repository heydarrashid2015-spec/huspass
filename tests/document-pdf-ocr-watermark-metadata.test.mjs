import test from "node:test";
import assert from "node:assert/strict";
import {selectPdfPageText} from "../lib/document-ocr.js";

test("OCR scanner watermark with pagination does not replace useful invoice metadata",()=>{
 const layer="Faktura 2026-184\nDato: 18.11.2026\nCVR 12345678";
 assert.equal(selectPdfPageText(layer,"Scanned with CamScanner\nPage 1"),layer);
});
test("OCR scanner watermark with date and URL does not replace invoice metadata",()=>{
 const layer="Faktura 2026-184\nAt betale 1.250,00 DKK";
 assert.equal(selectPdfPageText(layer,"Scanned with CamScanner\nhttps://scanner.example\nDato: 18.11.2026"),layer);
});
test("OCR with scanner watermark and actual financial content remains usable",()=>{
 const layer="Faktura 2026-184\nDato: 18.11.2026";
 const recognized="Scanned with CamScanner\nFaktura 2026-184\nAt betale 1.250,00 DKK";
 assert.equal(selectPdfPageText(layer,recognized),recognized);
});
