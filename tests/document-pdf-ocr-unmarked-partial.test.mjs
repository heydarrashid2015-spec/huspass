import test from "node:test";
import assert from "node:assert/strict";
import {selectPdfPageText} from "../lib/document-ocr.js";

test("unmarked partial OCR cannot erase a payable amount from PDF text",()=>{
 const layer="Faktura 2026-184\nAt betale 1.250,00 DKK";
 const recognized="Example ApS\nFaktura 2026-184\nDato: 18.11.2026";
 assert.equal(selectPdfPageText(layer,recognized),layer);
});

test("unmarked OCR with a recognized payable still takes precedence",()=>{
 const layer="Faktura 2026-184\nAt betale 1.250,00 DKK";
 const recognized="Example ApS\nAt betale 1.350,00 DKK";
 assert.equal(selectPdfPageText(layer,recognized),recognized);
});
