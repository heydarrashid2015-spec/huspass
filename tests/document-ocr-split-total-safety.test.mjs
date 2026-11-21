import test from "node:test";
import assert from "node:assert/strict";
import {parseDanishDocumentText} from "../lib/document-intelligence.js";

test("split OCR total is rejected when a second total is malformed",()=>{
 const result=parseDanishDocumentText("Faktura\nLeverandør ApS\nAt betale\nDKK\n1.234,50\nTotal: ulæseligt");
 assert.equal(result.amount,null);
 assert.equal(result.requiresReview,true);
});

test("split OCR total cannot jump over an unrelated field",()=>{
 const result=parseDanishDocumentText("Faktura\nAt betale\nDKK\nMoms 200,00\n1.234,50");
 assert.equal(result.amount,null);
 assert.equal(result.requiresReview,true);
});

test("consistent split and inline totals may be suggested for manual review",()=>{
 const result=parseDanishDocumentText("Faktura\nAt betale\nDKK\n1.234,50\nTotal 1.234,50");
 assert.equal(result.amount,1234.5);
 assert.equal(result.requiresReview,true);
});
