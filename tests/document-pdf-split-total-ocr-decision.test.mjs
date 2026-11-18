import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const ocrSource=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const parserSource=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(ocrSource).toString("base64"));
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(parserSource).toString("base64"));

test("preserve a complete split PDF total instead of replacing usable text with OCR",()=>{
 const text="Faktura\nNord El ApS\nFakturadato: 05.11.2026\nTotal\nDKK 2.499,95";
 assert.equal(parseDanishDocumentText(text).amount,2499.95);
 assert.equal(needsPdfPageOcr(text),false);
});

test("OCR a bare total followed by unrelated payment metadata",()=>{
 const text="Faktura\nNord El ApS\nFakturadato: 05.11.2026\nTotal\nIBAN DK50 0040 0440 1162 43";
 assert.equal(parseDanishDocumentText(text).amount,null);
 assert.equal(needsPdfPageOcr(text),true);
});

test("a second incomplete total must trigger OCR despite another complete total",()=>{
 const text="Faktura\nNord El ApS\nTotal: 100,00\nAt betale\nSide 1";
 assert.equal(needsPdfPageOcr(text),true);
});
