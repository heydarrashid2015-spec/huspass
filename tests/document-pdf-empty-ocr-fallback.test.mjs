import test from "node:test";
import assert from "node:assert/strict";
import {selectPdfPageText} from "../lib/document-ocr.js";

test("empty OCR result preserves a nonempty PDF text layer",()=>{
 assert.equal(selectPdfPageText("Faktura 123\nCVR 12345678","  \n"),"Faktura 123\nCVR 12345678");
});
test("recognized scanned content supersedes incomplete PDF metadata",()=>{
 assert.equal(selectPdfPageText("Faktura 123","Faktura 123\nAt betale 250,00 DKK"),"Faktura 123\nAt betale 250,00 DKK");
});
test("both empty inputs remain empty and trigger existing no-text handling",()=>{
 assert.equal(selectPdfPageText("  ","\n"),"");
});
