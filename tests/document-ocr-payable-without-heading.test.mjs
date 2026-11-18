import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("OCR is required for a payable amount missing from a CVR-identified invoice text layer without invoice heading",()=>{
 const text=["Leverandør ApS","CVR: 12345678","Dato: 18.11.2026","Ydelser og materialer","Total: 2.500,00 DKK","At betale: DKK"].join("\n");
 assert.equal(needsPdfPageOcr(text),true);
});
test("OCR is not required when the same CVR-identified payable amount is complete",()=>{
 const text=["Leverandør ApS","CVR: 12345678","Dato: 18.11.2026","Ydelser og materialer","Total: 2.500,00 DKK","At betale: DKK","2.500,00"].join("\n");
 assert.equal(needsPdfPageOcr(text),false);
});
test("a non-invoice page with a bare total label does not automatically trigger OCR",()=>{
 const text=["Rapport over projektets aktiviteter","Beskrivelse af aktiviteter og forventet fremdrift","Total:"].join("\n");
 assert.equal(needsPdfPageOcr(text),false);
});
