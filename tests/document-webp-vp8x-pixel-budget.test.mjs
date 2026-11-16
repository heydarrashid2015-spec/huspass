import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {readDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

function webpVp8x(width,height){
 const bytes=new Uint8Array(30);
 bytes.set([82,73,70,70,22,0,0,0,87,69,66,80,86,80,56,88,10,0,0,0],0);
 const w=width-1,h=height-1;
 bytes[24]=w&255;bytes[25]=(w>>>8)&255;bytes[26]=(w>>>16)&255;
 bytes[27]=h&255;bytes[28]=(h>>>8)&255;bytes[29]=(h>>>16)&255;
 return {name:"invoice.webp",type:"image/webp",size:bytes.length,
  slice:(start,end)=>({arrayBuffer:async()=>bytes.slice(start<0?bytes.length+start:start,end).buffer})};
}

test("rejects VP8X WebP images exceeding OCR pixel budget before loading worker",async()=>{
 await assert.rejects(readDocumentText(webpVp8x(16384,16384)),/indhold matcher ikke/);
 await assert.rejects(readDocumentText(webpVp8x(16384,2000)),/indhold matcher ikke/);
});
test("rejects VP8X WebP images exceeding safe width or height",async()=>{
 await assert.rejects(readDocumentText(webpVp8x(16385,1)),/indhold matcher ikke/);
 await assert.rejects(readDocumentText(webpVp8x(1,16385)),/indhold matcher ikke/);
});
