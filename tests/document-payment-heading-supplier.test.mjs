import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("payment headings are not mistaken for invoice supplier",()=>{
 for(const heading of ["Betalingsoplysninger","Betalingsinformation","Betalingsbetingelser"]){
  const result=parseDanishDocumentText("Faktura\n"+heading+"\nIBAN DK50 0040 0440 1162 43\nI alt: 500,00");
  assert.equal(result.supplier,null,heading);
  assert.equal(result.amount,500);
  assert.equal(result.requiresReview,true);
 }
});

test("payment headings do not hide a later real supplier",()=>{
 const result=parseDanishDocumentText("Faktura\nBetalingsoplysninger\nNord El ApS\nAt betale: 500,00");
 assert.equal(result.supplier,"Nord El ApS");
});
