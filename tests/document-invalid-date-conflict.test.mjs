import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("invalid labelled invoice date prevents accepting another labelled date without review",()=>{
 const result=parseDanishDocumentText("Faktura\nFakturadato: 05.11.2026\nDato: 31.02.2026\nI alt: 500,00");
 assert.equal(result.documentDate,null);
 assert.equal(result.requiresReview,true);
});
test("invalid unlabelled date alongside valid unlabelled date is not silently discarded",()=>{
 const result=parseDanishDocumentText("Kvittering\n05.11.2026\n31.02.2026\nI alt: 500,00");
 assert.equal(result.documentDate,null);
});
test("a valid invoice date is unaffected by an invalid payment deadline",()=>{
 const result=parseDanishDocumentText("Faktura\nFakturadato: 05.11.2026\nBetalingsfrist: 31.02.2026");
 assert.equal(result.documentDate,"2026-11-05");
});