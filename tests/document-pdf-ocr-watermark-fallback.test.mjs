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

test("OCR scanner footer and bare invoice heading must not erase invoice metadata",()=>{
 const layer="Faktura 2026-184\nDato: 18.11.2026\nCVR 12345678";
 const recognized="Faktura\nScanned with CamScanner\nPage 1";
 assert.equal(selectPdfPageText(layer,recognized),layer);
});
test("OCR with a payable amount must supersede incomplete PDF metadata despite scanner footer",()=>{
 const layer="Faktura 2026-184\nDato: 18.11.2026\nCVR 12345678";
 const recognized="Faktura\nAt betale 1.250,00 DKK\nScanned with CamScanner";
 assert.equal(selectPdfPageText(layer,recognized),recognized);
});

test("OCR scanner metadata with invoice number must not erase PDF invoice data",()=>{
 const layer="Faktura 2026-184\nDato: 18.11.2026\nCVR 12345678";
 const recognized="Scanned with CamScanner\nFakturanr: 2026-184\nDato: 18.11.2026\nPage 1";
 assert.equal(selectPdfPageText(layer,recognized),layer);
});
test("OCR with a genuine payable amount is retained even with scanner metadata",()=>{
 const layer="Faktura 2026-184\nDato: 18.11.2026";
 const recognized="Scanned with CamScanner\nFakturanr: 2026-184\nAt betale 1.250,00 DKK";
 assert.equal(selectPdfPageText(layer,recognized),recognized);
});
