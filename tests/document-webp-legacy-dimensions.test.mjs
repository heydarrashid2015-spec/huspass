import test from "node:test";
import assert from "node:assert/strict";
import {readDocumentText} from "../lib/document-ocr.js";

const webp=(tag, payload)=>{
 const bytes=new Uint8Array(20+payload.length);
 bytes.set([82,73,70,70],0);
 const riff=bytes.length-8;
 bytes[4]=riff&255;bytes[5]=(riff>>>8)&255;bytes[6]=(riff>>>16)&255;bytes[7]=(riff>>>24)&255;
 bytes.set([87,69,66,80],8);
 bytes.set([...tag].map(c=>c.charCodeAt(0)),12);
 bytes[16]=payload.length&255;bytes[17]=(payload.length>>>8)&255;
 bytes.set(payload,20);
 return {name:"invoice.webp",type:"image/webp",size:bytes.length,
  slice:(start,end)=>({arrayBuffer:async()=>bytes.slice(start<0?bytes.length+start:start,end).buffer})};
};
test("rejects VP8 lossy WebP with oversized decoded dimensions before OCR",async()=>{
 const payload=new Uint8Array(10);
 payload.set([0x9d,0x01,0x2a,0xff,0x3f,0xff,0x3f],3);
 await assert.rejects(readDocumentText(webp("VP8 ",payload)),/indhold matcher ikke/);
});
test("rejects VP8L lossless WebP with oversized decoded dimensions before OCR",async()=>{
 const payload=new Uint8Array([0x2f,0xff,0xff,0xff,0xff]);
 await assert.rejects(readDocumentText(webp("VP8L",payload)),/indhold matcher ikke/);
});
