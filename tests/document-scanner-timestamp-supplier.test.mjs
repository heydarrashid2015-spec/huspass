import test from "node:test";
import assert from "node:assert/strict";
import {parseDanishDocumentText} from "../lib/document-intelligence.js";

test("scanner timestamp must not become supplier when invoice has no merchant",()=>{
 const result=parseDanishDocumentText("Scanned on: 14.11.2026\nFaktura\nTotal: 125,00");
 assert.equal(result.supplier,null);
 assert.equal(result.requiresReview,true);
});

test("scanner timestamp is skipped before genuine supplier",()=>{
 const result=parseDanishDocumentText("Scanned on: 14.11.2026\nNordlys ApS\nFaktura\nTotal: 125,00");
 assert.equal(result.supplier,"Nordlys ApS");
});
