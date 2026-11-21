import test from "node:test";
import assert from "node:assert/strict";
import {parseDanishDocumentText} from "../lib/document-intelligence.js";

test("OCR split currency and amount is parsed as one payable value",()=>{
 const result=parseDanishDocumentText("Faktura\\nLeverandør ApS\\nAt betale\\nDKK\\n1.234,50\\nFakturadato 21.11.2026".replaceAll("\\n","\n"));
 assert.equal(result.amount,1234.5);
 assert.equal(result.requiresReview,true);
});

test("split payable and conflicting total must not silently suggest a value",()=>{
 const result=parseDanishDocumentText("Faktura\nAt betale\nDKK\n1.234,50\nTotal 1.999,00");
 assert.equal(result.amount,null);
});

test("currency without amount does not create a payable suggestion",()=>{
 const result=parseDanishDocumentText("Faktura\nAt betale\nDKK\nFakturadato 21.11.2026");
 assert.equal(result.amount,null);
});
