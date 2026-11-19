import test from "node:test";
import assert from "node:assert/strict";
import {selectPdfPageText} from "../lib/document-ocr.js";

test("OCR subtotal must not erase explicit payable in PDF layer",()=>{
 const layer="Faktura 2026-184\nAt betale 1.250,00 DKK";
 const ocr="Faktura 2026-184\nSubtotal 1.000,00 DKK\nTotal 1.000,00 DKK";
 assert.equal(selectPdfPageText(layer,ocr),layer);
});

test("explicit OCR payable can supersede PDF-layer payable for review",()=>{
 const layer="Faktura 2026-184\nAt betale 1.250,00 DKK";
 const ocr="Faktura 2026-184\nTotal 1.000,00 DKK\nAt betale 1.350,00 DKK";
 assert.equal(selectPdfPageText(layer,ocr),ocr);
});
