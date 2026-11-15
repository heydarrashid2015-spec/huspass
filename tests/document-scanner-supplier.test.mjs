import test from "node:test";
import assert from "node:assert/strict";
import {parseDanishDocumentText} from "../lib/document-intelligence.js";

test("scanner watermarks and page metadata are never suggested as invoice suppliers",()=>{
 for(const marker of ["Scanned with CamScanner","Created with Adobe Scan","Generated with Scanner Pro","Page 1","Side 2"]){
  const parsed=parseDanishDocumentText("Faktura\n"+marker+"\nTotal: 1.250,00");
  assert.equal(parsed.supplier,null,marker);
  assert.equal(parsed.requiresReview,true);
 }
});
test("real supplier after scanner watermark is still suggested for manual review",()=>{
 const parsed=parseDanishDocumentText("Scanned with CamScanner\nFaktura\nNord El ApS\nTotal: 1.250,00");
 assert.equal(parsed.supplier,"Nord El ApS");
 assert.equal(parsed.requiresReview,true);
});
