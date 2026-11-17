import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("VAT and subtotal invoice lines must not be treated as suppliers",()=>{
 for(const heading of ["Subtotal: 800,00","Subtotal ekskl. moms: 800,00","Momsgrundlag: 800,00","Rabat: 50,00","Fragt: 49,00"]){
  const result=parseDanishDocumentText("Faktura\n"+heading+"\nTotal: 1.000,00");
  assert.equal(result.supplier,null,heading);
  assert.equal(result.amount,1000,heading);
  assert.equal(result.requiresReview,true);
 }
});
test("supplier after subtotal and VAT metadata remains discoverable",()=>{
 const result=parseDanishDocumentText("Faktura\nSubtotal: 800,00\nMomsgrundlag: 800,00\nNord El ApS\nTotal: 1.000,00");
 assert.equal(result.supplier,"Nord El ApS");
});
