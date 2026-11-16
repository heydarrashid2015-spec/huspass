import test from 'node:test';
import assert from 'node:assert/strict';
import { rankContractors, compareVerifiedQuotes } from '../lib/ai-contractor-ranking.mjs';

test('only attributable matching contractors are shortlisted; never invent quotes', () => {
  const results = rankContractors([
    {name:'A', services:['maling'], sourceUrl:'https://example.org/a', cvr:'12345678', cvrVerified:true, servicePostcodes:['2100']},
    {name:'B', services:['have'], sourceUrl:'https://example.org/b'},
    {name:'C', services:['maling']},
    {name:'D', services:['maling'], sourceUrl:'https://example.org/d'}
  ], {category:'maling',postcode:'2100'});
  assert.deepEqual(results.map(x => x.name), ['A','D']);
  assert.equal(results[0].quotedPrice, null);
  assert.equal(results[0].quoteStatus, 'not_requested');
});
test('a price without contractor document evidence is never verified', () => {
  const [result] = compareVerifiedQuotes([{totalPrice:12000,currency:'DKK',sourceType:'ai_estimate'}]);
  assert.equal(result.comparable,false);
  assert.equal(result.verifiedPrice,null);
});
test('missing scope or warranty prevents misleading price comparison', () => {
  const [result] = compareVerifiedQuotes([{totalPrice:12000,currency:'DKK',sourceType:'contractor_document',documentId:'doc1',scope:'painting',materials:'included',vatIncluded:true}]);
  assert.equal(result.comparable,false);
  assert.ok(result.missingFields.includes('warranty'));
});
