import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("long invoice text layer with a bare payable heading still needs OCR",()=>{
 const lines=Array.from({length:18},(_,i)=>`Varelinje ${i+1}: servicebeskrivelse uden beløb`);
 const text=["Faktura","Nord El ApS","Fakturadato: 05.11.2026",...lines,"At betale","Side 1"].join("\n");
 assert.ok(text.length>350);
 assert.equal(needsPdfPageOcr(text),true);
});

test("long invoice with complete payable amount does not require OCR solely due to heading",()=>{
 const lines=Array.from({length:18},(_,i)=>`Varelinje ${i+1}: servicebeskrivelse uden beløb`);
 const text=["Faktura","Nord El ApS",...lines,"At betale","DKK 2.499,95"].join("\n");
 assert.ok(text.length>350);
 assert.equal(needsPdfPageOcr(text),false);
});
