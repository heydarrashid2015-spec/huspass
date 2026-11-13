import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {extractPdfPageText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("preserves PDF text item line boundaries for invoice extraction",()=>{
 const text=extractPdfPageText([{str:"Faktura",hasEOL:true},{str:"Fakturadato: 05.11.2026",hasEOL:true},{str:"I alt: 1.250,00",hasEOL:false}]);
 assert.equal(text,"Faktura\nFakturadato: 05.11.2026\nI alt: 1.250,00");
});
test("joins adjacent PDF fragments without corrupting tokens",()=>{
 assert.equal(extractPdfPageText([{str:"I alt:",hasEOL:false},{str:"1.250,00",hasEOL:true},{str:"CVR 12345678"}]),"I alt: 1.250,00\nCVR 12345678");
});
test("handles empty and whitespace-only PDF text items",()=>{
 assert.equal(extractPdfPageText([{str:" ",hasEOL:true},{str:"Faktura",hasEOL:true},{str:""}]),"Faktura");
});

// PDF.js may split a single monetary token into separate glyph runs.
test("rejoins split decimal amount glyphs without inserting whitespace",()=>{
 assert.equal(extractPdfPageText([{str:"I alt: 1.250",hasEOL:false},{str:",00",hasEOL:true}]),"I alt: 1.250,00");
});
test("rejoins split thousands groups but retains spaces between distinct words",()=>{
 assert.equal(extractPdfPageText([{str:"I alt: 1.",hasEOL:false},{str:"250,00",hasEOL:true},{str:"Nord",hasEOL:false},{str:"El ApS",hasEOL:true}]),"I alt: 1.250,00\nNord El ApS");
});
