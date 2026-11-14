import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("OCR-split Total inkl. moms retains payable amount",()=>{
 assert.equal(parseDanishDocumentText("Faktura\nTotal inkl. moms\n1.250,00").amount,1250);
});
test("OCR-split Total inkl moms retains payable amount",()=>{
 assert.equal(parseDanishDocumentText("Faktura\nTotal inkl moms\n1.250,00").amount,1250);
});
test("split total must not borrow an unrelated VAT amount",()=>{
 assert.equal(parseDanishDocumentText("Faktura\nTotal inkl. moms\nMoms 250,00\n1.250,00").amount,null);
});
