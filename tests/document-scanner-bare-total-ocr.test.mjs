import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("scanner watermark and bare Total label do not prove amounts were extracted",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nScanned with Mobile Scanner\nCVR 12345678\nTotal"),true);
 assert.equal(needsPdfPageOcr("Faktura\nScanned with Mobile Scanner\nCVR 12345678\nTotal: "),true);
});

test("scanner invoice with a numeric total retains usable text layer",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nScanned with Mobile Scanner\nCVR 12345678\nTotal: 1.250,00 kr"),false);
});
