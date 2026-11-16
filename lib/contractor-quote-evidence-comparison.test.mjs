import test from 'node:test';
import assert from 'node:assert/strict';
import {compareContractorQuotes} from './contractor-quote-evidence-comparison.mjs';
const ev = (excerpt='10.000 kr.') => ({documentId:'private-doc-1',excerpt});
test('missing VAT and terms stay unknown and price is not comparable',()=>{
 const [r]=compareContractorQuotes([{id:'a',priceOre:'1000000',evidence:{priceOre:ev()}}]);
 assert.equal(r.fields.priceOre.status,'documented');
 assert.equal(r.fields.vatIncluded.status,'unknown');
 assert.equal(r.fields.materials.value,null);
 assert.equal(r.comparableTotal,false);
});
test('documented inclusive VAT enables comparison without inferring warranty',()=>{
 const [r]=compareContractorQuotes([{id:'a',priceOre:'1000000',vatIncluded:true,
 evidence:{priceOre:ev(),vatIncluded:ev('inkl. moms')}}]);
 assert.equal(r.comparableTotal,true);
 assert.equal(r.fields.warranty.status,'unknown');
});
test('unsupported fields and malformed prices are not accepted',()=>{
 const [r]=compareContractorQuotes([{id:'a',priceOre:'1.000',vatIncluded:true,scope:'painting',
 evidence:{priceOre:ev(),vatIncluded:ev(),scope:{excerpt:'paint'}}}]);
 assert.equal(r.fields.priceOre.status,'unknown');
 assert.equal(r.fields.scope.status,'unknown');
 assert.equal(r.comparableTotal,false);
});
test('duplicate quote IDs are excluded',()=>{
 assert.equal(compareContractorQuotes([{id:'a'},{id:'a'},{id:'b'}]).length,2);
});
test('unknown inputs yield no quotes',()=>{
 assert.deepEqual(compareContractorQuotes(null),[]);
 assert.deepEqual(compareContractorQuotes([null,{}, {id:''}]),[]);
});

test('ASCII integer ore price with documentary evidence is accepted',()=>{
 const [r]=compareContractorQuotes([{id:'price-ok',priceOre:'1000000',vatIncluded:true,
 evidence:{priceOre:ev('10.000,00 kr.'),vatIncluded:ev('inkl. moms')}}]);
 assert.equal(r.fields.priceOre.status,'documented');
 assert.equal(r.comparableTotal,true);
});
test('invalid, negative, fractional and Unicode prices remain unknown',()=>{
 for(const priceOre of ['0','-100','1.000','1e3',' 100','١٠٠','100\\n','+100']){
  const [r]=compareContractorQuotes([{id:'bad',priceOre,evidence:{priceOre:ev()}}]);
  assert.equal(r.fields.priceOre.status,'unknown',JSON.stringify(priceOre));
 }
});
