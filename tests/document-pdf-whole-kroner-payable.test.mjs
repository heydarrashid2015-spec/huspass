import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("complete Danish whole-kroner payable amount on next line does not trigger OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nLeverandør ApS\nDato: 18.11.2026\nAt betale\n2.500 DKK"),false);
});
test("complete Danish whole-kroner payable amount with currency on separate line does not trigger OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nLeverandør ApS\nDato: 18.11.2026\nAt betale\nDKK\n2500"),false);
});
test("missing amount after payable heading still triggers OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nLeverandør ApS\nDato: 18.11.2026\nAt betale\nDKK\nBetalingsfrist: 01.12.2026"),true);
});
