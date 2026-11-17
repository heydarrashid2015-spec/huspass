import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("metadata-only PDF invoice with invoice number and CVR still needs OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nFakturanr: 2026-0042\nDato: 12.11.2026\nCVR: 12345678\nSide 1"),true);
 assert.equal(needsPdfPageOcr("Invoice\nInvoice number: INV-42\nDate: 12/11/2026\nPage 1"),true);
});

test("invoice number alone must not cause OCR when a real total is present",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nFakturanr: 2026-0042\nDato: 12.11.2026\nCVR: 12345678\nTotal: 1.250,00 kr."),false);
});
