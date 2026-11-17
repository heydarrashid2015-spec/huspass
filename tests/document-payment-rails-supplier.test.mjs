import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("payment rails and OCR payment reference labels are not suppliers",()=>{
 for(const heading of ["Betalingsservice","MobilePay","FIK-kode: +71<123456789012345+12345678<","OCR-linje: 1234567890","Betalings-ID: 123456"]){
  const result=parseDanishDocumentText("Faktura\n"+heading+"\nTotal: 700,00");
  assert.equal(result.supplier,null,heading);
  assert.equal(result.amount,700,heading);
  assert.equal(result.requiresReview,true);
 }
});

test("payment references before an actual supplier do not obscure supplier",()=>{
 const result=parseDanishDocumentText("Faktura\nBetalingsservice\nFIK-kode: +71<123456789012345+12345678<\nNord El ApS\nTotal: 700,00");
 assert.equal(result.supplier,"Nord El ApS");
});
