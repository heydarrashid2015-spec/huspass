import test from "node:test";
import assert from "node:assert/strict";
import {extractPdfPageText} from "../lib/document-ocr.js";

test("PDF extraction skips null and malformed glyphs without losing invoice text",()=>{
 const text=extractPdfPageText([
  {str:"Faktura",hasEOL:true},null,undefined,42,
  {str:"At betale"},null,{str:" 1.250,00",hasEOL:true}
 ]);
 assert.equal(text,"Faktura\nAt betale 1.250,00");
});
