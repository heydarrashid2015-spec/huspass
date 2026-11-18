import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("scanner footer plus invoice number and date still requires OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nFakturanr: 2026-104\nDato: 12.11.2026\nScanned with CamScanner"),true);
});
test("scanner footer plus actual monetary invoice content preserves text layer",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nFakturanr: 2026-104\nTotal inkl. moms: 1.250,00 DKK\nScanned with CamScanner"),false);
});
test("invoice number and date without payable amount still require OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nFakturanr: 2026-104\nDato: 12.11.2026"),true);
});
