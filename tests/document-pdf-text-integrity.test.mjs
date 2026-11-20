import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {extractPdfPageText,safePdfRasterScale}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("PDF text layer preserves split Danish invoice amount and CVR across glyph runs",()=>{
 const text=extractPdfPageText([
  {str:"CVR: 1234"},{str:"5678",hasEOL:true},
  {str:"At betale: 1."},{str:"234"},{str:",56",hasEOL:true}
 ]);
 assert.match(text,/CVR: 12345678/);
 assert.match(text,/At betale: 1\.234,56/);
});

test("PDF raster scaling respects the 3.4 megapixel canvas budget",()=>{
 for(const [width,height] of [[1000,1000],[4000,4000],[8192,8192],[200,10000]]){
  const scale=safePdfRasterScale(width,height);
  assert.ok(scale>0&&scale<=1.5);
  assert.ok(width*scale<=8192+0.01);
  assert.ok(height*scale<=8192+0.01);
  assert.ok(width*height*scale*scale<=3400000+0.01);
 }
 for(const dims of [[0,100],[100,Infinity],[NaN,100],[-1,20],[100001,10]])
  assert.throws(()=>safePdfRasterScale(...dims),/Ugyldige PDF-side dimensioner/);
});
