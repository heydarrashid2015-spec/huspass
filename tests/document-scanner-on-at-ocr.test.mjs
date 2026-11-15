import test from "node:test";
import assert from "node:assert/strict";
import {needsPdfPageOcr} from "../lib/document-ocr.js";

test("scanner timestamp plus heading is not a usable PDF text layer",()=>{
 assert.equal(needsPdfPageOcr("Scanned on 12.11.2026 09:32\nFaktura\nPage 1"),true);
 assert.equal(needsPdfPageOcr("Scanned at 12.11.2026 09:32\nInvoice\nPage 1"),true);
});

test("real invoice text layer with scanner timestamp remains readable",()=>{
 assert.equal(needsPdfPageOcr("Scanned on 12.11.2026\nFaktura 3456\nLeverandør: Eksempel ApS\nTotal 1.250,00 DKK\nCVR 12345678"),false);
});
