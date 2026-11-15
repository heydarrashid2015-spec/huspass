import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const load=async path=>{
 const source=await readFile(new URL(path,import.meta.url),"utf8");
 return import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
};
const {extractPdfPageText}=await load("../lib/document-ocr.js");
const {parseDanishDocumentText}=await load("../lib/document-intelligence.js");

// Functional integration of PDF.js glyph-run reconstruction and the review-first
// invoice parser. No OCR or Android execution is implied by these fixtures.
test("split PDF invoice glyphs produce review-only Danish invoice suggestions",()=>{
 const text=extractPdfPageText([
  {str:"Nord El ApS",hasEOL:true},
  {str:"Faktura",hasEOL:true},
  {str:"Fakturadato:",hasEOL:true},
  {str:"05.11.2026",hasEOL:true},
  {str:"CVR: 1234",hasEOL:false},
  {str:"5678",hasEOL:true},
  {str:"Total inkl. moms: 1.250,",hasEOL:false},
  {str:"00",hasEOL:true},
  {str:"Garanti udløber: 05.11.2028",hasEOL:true}
 ]);
 const result=parseDanishDocumentText(text);
 assert.equal(result.type,"Faktura");
 assert.equal(result.documentDate,"2026-11-05");
 assert.equal(result.amount,1250);
 assert.equal(result.cvr,"12345678");
 assert.equal(result.warrantyEnd,"2028-11-05");
 assert.equal(result.requiresReview,true);
});

test("conflicting totals in reconstructed PDF text cannot be auto-accepted",()=>{
 const text=extractPdfPageText([
  {str:"Faktura",hasEOL:true},
  {str:"Total: 1.250,00",hasEOL:true},
  {str:"At betale: 1.350,00",hasEOL:true}
 ]);
 const result=parseDanishDocumentText(text);
 assert.equal(result.amount,null);
 assert.equal(result.requiresReview,true);
});
