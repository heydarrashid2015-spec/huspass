import test from "node:test";
import assert from "node:assert/strict";
import {selectPdfPageText} from "../lib/document-ocr.js";

test("OCR scanner watermark must not erase useful invoice metadata",()=>{
 const layer="Faktura 2026-184\nDato: 18.11.2026\nCVR 12345678";
 assert.equal(selectPdfPageText(layer,"Scanned with CamScanner"),layer);
});
test("OCR scanner URL alone must not erase useful invoice metadata",()=>{
 const layer="Faktura 2026-184\nDato: 18.11.2026\nCVR 12345678";
 assert.equal(selectPdfPageText(layer,"Scanned with CamScanner\nhttps://scanner.example"),layer);
});
test("real OCR text still replaces incomplete PDF metadata",()=>{
 const layer="Faktura 2026-184\nDato: 18.11.2026";
 const recognized="Faktura 2026-184\nDato: 18.11.2026\nAt betale 1.250,00 DKK";
 assert.equal(selectPdfPageText(layer,recognized),recognized);
});
