import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyQuoteEvidenceAgainstDocuments} from './contractor-quote-source-proof.mjs';
const evidence = Object.fromEntries(['priceOre','vatIncluded','materials','warranty','scope'].map(k=>[k,{documentId:'d1',excerpt:k}]));
const quote = {evidence};
const docs = [{id:'d1',text:'priceOre vatIncluded materials warranty scope'}];
test('matches literal excerpts against a unique authorized source',()=>{
  const result=verifyQuoteEvidenceAgainstDocuments(quote,docs);
  assert.equal(result.verified,true);
});
test('rejects missing, mismatched and duplicate source documents',()=>{
  assert.equal(verifyQuoteEvidenceAgainstDocuments(quote,[]).verified,false);
  assert.equal(verifyQuoteEvidenceAgainstDocuments(quote,[{id:'d1',text:'unrelated'}]).verified,false);
  assert.equal(verifyQuoteEvidenceAgainstDocuments(quote,[...docs,...docs]).verified,false);
});
test('does not execute accessor properties from untrusted records',()=>{
  const bad={evidence:{...evidence,priceOre:{documentId:'d1',get excerpt(){throw Error('getter executed')}}}};
  assert.equal(verifyQuoteEvidenceAgainstDocuments(bad,docs).fields.priceOre,false);
});
test('does not accept an empty excerpt as proof',()=>{
  assert.equal(verifyQuoteEvidenceAgainstDocuments({evidence:{...evidence,scope:{documentId:'d1',excerpt:' '}}},docs).verified,false);
});
