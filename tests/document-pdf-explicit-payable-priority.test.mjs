import test from "node:test";
import assert from "node:assert/strict";
import {selectPdfPageText} from "../lib/document-ocr.js";

test("preserves explicit payable from PDF text layer when OCR only finds subtotal",()=>{
 const layer="Faktura\nAt betale: 1.250,00 DKK\nCVR 12345678";
 const ocr="Faktura\nTotal: 900,00 DKK\nScanned with scanner";
 assert.equal(selectPdfPageText(layer,ocr),layer);
});
test("allows explicit payable from OCR to supersede a text-layer payable for user review",()=>{
 const layer="Faktura\nAt betale: 1.250,00 DKK";
 const ocr="Faktura\nAt betale: 1.275,00 DKK";
 assert.equal(selectPdfPageText(layer,ocr),ocr);
});
test("does not confuse an OCR subtotal with a PDF payable when currency precedes amount",()=>{
 const layer="Beløb at betale: DKK 2.500,00";
 const ocr="Total: DKK 2.000,00";
 assert.equal(selectPdfPageText(layer,ocr),layer);
});
