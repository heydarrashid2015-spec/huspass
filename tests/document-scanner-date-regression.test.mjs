import test from "node:test";
import assert from "node:assert/strict";
import {parseDanishDocumentText} from "../lib/document-intelligence.js";

test("scanner-generated timestamps must not become purchase dates",()=>{
 const parsed=parseDanishDocumentText("Scanned with CamScanner\nDato: 14.11.2026\nPage 1");
 assert.equal(parsed.documentDate,null);
 assert.equal(parsed.requiresReview,true);
});

test("explicit invoice date remains usable alongside scanner timestamp",()=>{
 const parsed=parseDanishDocumentText("Scanned with CamScanner\nScanned on: 14.11.2026\nFaktura\nFakturadato: 10.11.2026");
 assert.equal(parsed.documentDate,"2026-11-10");
 assert.equal(parsed.requiresReview,true);
});
