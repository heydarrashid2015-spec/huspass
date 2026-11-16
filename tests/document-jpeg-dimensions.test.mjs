import test from 'node:test';
import assert from 'node:assert/strict';
import {readJpegDimensions} from '../lib/document-ocr.js';

function jpeg(width,height){
 const bytes=new Uint8Array([0xff,0xd8,0xff,0xe0,0,4,0,0,0xff,0xc0,0,11,8,height>>8,height&255,width>>8,width&255,1,1,0x11,0,0xff,0xd9]);
 return bytes;
}
test('JPEG SOF dimensions are parsed and constrained before OCR allocation',()=>{
 assert.deepEqual(readJpegDimensions(jpeg(1200,800)),{width:1200,height:800});
 assert.throws(()=>readJpegDimensions(jpeg(16000,16000)),/dimensioner/i);
 assert.throws(()=>readJpegDimensions(jpeg(0,800)),/dimensioner/i);
});
test('truncated or SOF-free JPEG is rejected before OCR',()=>{
 assert.throws(()=>readJpegDimensions(new Uint8Array([0xff,0xd8,0xff,0xd9])),/dimensioner/i);
 assert.throws(()=>readJpegDimensions(jpeg(1200,800).slice(0,8)),/dimensioner/i);
});
