import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("Danish payment detail and bank transfer headings cannot become suppliers",()=>{
 for(const heading of ["Betalingsdetaljer","Betalingsinstruktioner","Bankoverførsel","Betalingsmetode"]){
  const parsed=parseDanishDocumentText("Faktura\n"+heading+"\nIBAN DK50 0040 0440 1162 43\nTotal: 700,00");
  assert.equal(parsed.supplier,null,heading);
  assert.equal(parsed.amount,700,heading);
  assert.equal(parsed.requiresReview,true);
 }
});

test("a real supplier after payment details is still suggested",()=>{
 const parsed=parseDanishDocumentText("Faktura\nBetalingsdetaljer\nNord El ApS\nTotal: 700,00");
 assert.equal(parsed.supplier,"Nord El ApS");
});
