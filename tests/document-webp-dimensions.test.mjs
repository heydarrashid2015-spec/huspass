import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {readDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("rejects WebP VP8X decompression-bomb dimensions before loading OCR",async()=>{
 const bytes=new Uint8Array(30);
 bytes.set([82,73,70,70,22,0,0,0,87,69,66,80,86,80,56,88,10,0,0,0],0);
 // VP8X width and height are unsigned 24-bit values plus one.
 bytes.set([255,255,255,255,255,255],24);
 const file={name:"invoice.webp",type:"image/webp",size:bytes.length,
  slice:(start,end)=>({arrayBuffer:async()=>bytes.slice(start,end).buffer})};
 await assert.rejects(readDocumentText(file),/indhold matcher ikke/);
});
