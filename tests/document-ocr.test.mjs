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

test("rejects spoofed file headers even when MIME and extension agree",async()=>{
 const fake=(name,type,bytes)=>({name,type,size:bytes.length,slice:()=>({arrayBuffer:async()=>Uint8Array.from(bytes).buffer})});
 await assert.rejects(readDocumentText(fake("invoice.pdf","application/pdf",[60,115,118,103,62])),/indhold matcher ikke/);
 await assert.rejects(readDocumentText(fake("invoice.png","image/png",[255,216,255,0])),/indhold matcher ikke/);
 await assert.rejects(readDocumentText(fake("invoice.jpg","image/jpeg",[137,80,78,71,13,10,26,10])),/indhold matcher ikke/);
 await assert.rejects(readDocumentText(fake("invoice.webp","image/webp",[82,73,70,70,0,0,0,0,74,80,69,71])),/indhold matcher ikke/);
});
test("rejects malformed file objects without a slice API",async()=>{
 await assert.rejects(readDocumentText(file("invoice.pdf","application/pdf")) ,/Ugyldig fil/);
});

// RIFF/WEBP is a container header, not proof of a supported WebP image payload.
test("rejects WebP containers with unsupported or missing image chunk",async()=>{
 const fake=(bytes)=>({name:"invoice.webp",type:"image/webp",size:bytes.length,slice:()=>({arrayBuffer:async()=>Uint8Array.from(bytes).buffer})});
 const prefix=[82,73,70,70,16,0,0,0,87,69,66,80];
 await assert.rejects(readDocumentText(fake([...prefix,74,85,78,75])),/indhold matcher ikke/);
 await assert.rejects(readDocumentText(fake(prefix)),/indhold matcher ikke/);
});

test("rejects truncated WebP RIFF payload and inconsistent declared container length",async()=>{
 const fake=(bytes,size=bytes.length)=>({name:"invoice.webp",type:"image/webp",size,slice:()=>({arrayBuffer:async()=>Uint8Array.from(bytes).buffer})});
 const riff=(declared)=>[82,73,70,70,declared&255,(declared>>8)&255,(declared>>16)&255,(declared>>24)&255,87,69,66,80,86,80,56,32];
 await assert.rejects(readDocumentText(fake(riff(12))),/indhold matcher ikke/);
 await assert.rejects(readDocumentText(fake(riff(9999),100)),/indhold matcher ikke/);
});
