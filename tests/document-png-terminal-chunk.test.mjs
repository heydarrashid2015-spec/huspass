import test from "node:test";
import assert from "node:assert/strict";
import {readDocumentText} from "../lib/document-ocr.js";

function pngFile(tail){
 const bytes=new Uint8Array(45);
 bytes.set([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82],0);
 bytes.set([0,0,0,1,0,0,0,1],16);
 bytes.set(tail,33);
 return {
  name:"invoice.png",type:"image/png",size:bytes.length,
  slice(start=0,end=bytes.length){
   return {arrayBuffer:async()=>bytes.slice(start<0?bytes.length+start:start,end<0?bytes.length+end:end).buffer};
  }
 };
}

test("PNG OCR rejects a file with valid IHDR but no terminal IEND",async()=>{
 const file=pngFile([0,0,0,0,73,69,78,68,0,0,0,0]);
 await assert.rejects(readDocumentText(file),/Filens indhold matcher ikke filtypen/);
});

test("PNG OCR rejects an IEND marker with an invalid CRC",async()=>{
 const file=pngFile([0,0,0,0,73,69,78,68,174,66,96,0]);
 await assert.rejects(readDocumentText(file),/Filens indhold matcher ikke filtypen/);
});

test("PNG OCR rejects truncated IHDR-only input",async()=>{
 const file=pngFile([]);
 file.size=33;
 await assert.rejects(readDocumentText(file),/Filens indhold matcher ikke filtypen/);
});
