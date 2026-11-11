import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {readDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
const file=(name,type,size=100)=>({name,type,size});
test("rejects unsupported SVG before invoking OCR",async()=>{
 await assert.rejects(readDocumentText(file("invoice.svg","image/svg+xml")),/Kun PDF, JPG, PNG og WebP/);
});
test("rejects mismatched MIME type before parsing",async()=>{
 await assert.rejects(readDocumentText(file("invoice.pdf","image/png")),/Kun PDF, JPG, PNG og WebP/);
 await assert.rejects(readDocumentText(file("invoice.png","application/pdf")),/Kun PDF, JPG, PNG og WebP/);
});
test("rejects files over ten megabytes before parsing",async()=>{
 await assert.rejects(readDocumentText(file("invoice.pdf","application/pdf",10*1024*1024+1)),/10 MB/);
});
test("rejects missing input",async()=>{
 await assert.rejects(readDocumentText(null),/Vælg en fil/);
});

test("rejects images with extension/MIME disagreement",async()=>{
 await assert.rejects(readDocumentText(file("invoice.png","image/jpeg")),/Kun PDF, JPG, PNG og WebP/);
 await assert.rejects(readDocumentText(file("invoice.jpg","image/webp")),/Kun PDF, JPG, PNG og WebP/);
 await assert.rejects(readDocumentText(file("invoice.webp","image/png")),/Kun PDF, JPG, PNG og WebP/);
});
test("rejects zero-byte or malformed file size",async()=>{
 await assert.rejects(readDocumentText(file("invoice.pdf","application/pdf",0)),/tom eller ugyldig/);
 await assert.rejects(readDocumentText(file("invoice.png","image/png",NaN)),/tom eller ugyldig/);
});
