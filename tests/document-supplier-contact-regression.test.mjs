import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("merchant website and bare email are not suppliers",()=>{
 for(const line of ["www.nord-el.dk","https://nord-el.dk","kontakt@nord-el.dk"]){
  const result=parseDanishDocumentText("Faktura\n"+line+"\nTotal: 500,00");
  assert.equal(result.supplier,null,line);
  assert.equal(result.requiresReview,true);
 }
});
test("merchant name after website remains discoverable",()=>{
 const result=parseDanishDocumentText("Faktura\nwww.nord-el.dk\nNord El ApS\nTotal: 500,00");
 assert.equal(result.supplier,"Nord El ApS");
});
