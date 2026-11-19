import test from "node:test";
import assert from "node:assert/strict";
import {selectPdfPageText} from "../lib/document-ocr.js";

test("scanner OCR with only vendor metadata cannot erase a payable amount already in the PDF layer",()=>{
 const layer="Faktura 2026-184\nDato: 18.11.2026\nAt betale 1.250,00 DKK";
 const recognized="Scanned with CamScanner\nExample ApS\nFaktura 2026-184\nDato: 18.11.2026";
 assert.equal(selectPdfPageText(layer,recognized),layer);
});

test("scanner OCR with a payable amount can replace metadata-only PDF text",()=>{
 const layer="Faktura 2026-184\nDato: 18.11.2026";
 const recognized="Scanned with CamScanner\nExample ApS\nAt betale 1.250,00 DKK";
 assert.equal(selectPdfPageText(layer,recognized),recognized);
});


test("scanner OCR missing payable must not erase a valid PDF-layer amount",()=>{
 const layer="Faktura 2026-184\nAt betale 1.250,00 DKK";
 const recognized="Scanned with CamScanner\nExample ApS\nDato: 18.11.2026";
 assert.equal(selectPdfPageText(layer,recognized),layer);
});

test("scanner OCR with a different valid payable takes precedence for user review",()=>{
 const layer="Faktura 2026-184\nAt betale 1.250,00 DKK";
 const recognized="Scanned with CamScanner\nAt betale 1.350,00 DKK";
 assert.equal(selectPdfPageText(layer,recognized),recognized);
});
