import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const helper=source.match(/export function safePdfRasterScale\(width,height\)\{[\s\S]*?\n\}/)?.[0];
test("PDF OCR raster size rejects non-finite, zero and oversized dimensions",()=>{
 assert.ok(helper,"safePdfRasterScale must be exported");
 const {safePdfRasterScale}=new Function(helper.replace("export ","")+";return {safePdfRasterScale}")();
 for(const [w,h] of [[0,100],[100,0],[NaN,100],[Infinity,100],[100,Infinity],[1e8,100]]) assert.throws(()=>safePdfRasterScale(w,h),/PDF-side/);
});
test("PDF OCR raster scale stays within pixel and dimension budgets",()=>{
 const {safePdfRasterScale}=new Function(helper.replace("export ","")+";return {safePdfRasterScale}")();
 for(const [w,h] of [[595,842],[12000,12000],[1,15000],[15000,1]]){
  const s=safePdfRasterScale(w,h);
  assert.ok(s>0&&s<=1.5);
  assert.ok(Math.ceil(w*s)*Math.ceil(h*s)<=3500000);
  assert.ok(Math.ceil(w*s)<=8192&&Math.ceil(h*s)<=8192);
 }
});
