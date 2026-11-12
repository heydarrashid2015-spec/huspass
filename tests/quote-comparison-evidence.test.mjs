import test from 'node:test';
import assert from 'node:assert/strict';
import { compareContractorQuotes } from '../lib/ai/quote-comparison-evidence.mjs';
const make = (id, totalDkk, changes={}) => ({
 id, ownerId:'owner-a', projectId:'project-a', documentId:'doc-'+id,
 totalDkk, vat:'included', scope:'Paint two rooms', materials:'Paint included', warranty:'2 years',
 evidence:{ verified:true, documentId:'doc-'+id, sourceHash:'sha256:'+id, lineNumber:3 }, ...changes
});
const run = quotes => compareContractorQuotes(quotes,{ownerId:'owner-a',projectId:'project-a'});
test('sorts only complete comparable verified quotes',()=>{
 const result=run([make('one',5000),make('two',4000)]);
 assert.equal(result.comparable,true); assert.deepEqual(result.rows.map(r=>r.id),['two','one']);
});
test('rejects other owner',()=>assert.equal(run([make('a',1,{ownerId:'owner-b'}),make('b',2)]).comparable,false));
test('rejects other project',()=>assert.ok(run([make('a',1,{projectId:'other'}),make('b',2)]).reasons.includes('invalid_quote_boundary_or_duplicate')));
test('rejects duplicate quote IDs',()=>assert.ok(run([make('a',1),make('a',2)]).reasons.includes('invalid_quote_boundary_or_duplicate')));
test('requires verified immutable price evidence',()=>assert.ok(run([make('a',1,{evidence:{verified:false}}),make('b',2)]).reasons.includes('missing_verified_price_evidence')));
test('requires document evidence match',()=>assert.ok(run([make('a',1,{evidence:{verified:true,documentId:'other',sourceHash:'x',lineNumber:1}}),make('b',2)]).reasons.includes('missing_verified_price_evidence')));
test('rejects fabricated or invalid totals',()=>assert.ok(run([make('a',NaN),make('b',2)]).reasons.includes('invalid_total')));
test('does not rank different VAT bases',()=>assert.ok(run([make('a',1,{vat:'excluded'}),make('b',2)]).reasons.includes('mixed_or_unknown_vat')));
test('does not rank different work scope',()=>assert.ok(run([make('a',1,{scope:'Roof'}),make('b',2)]).reasons.includes('different_work_scope')));
test('missing warranty prevents comparison',()=>assert.ok(run([make('a',1,{warranty:''}),make('b',2)]).reasons.includes('incomplete_scope_materials_or_warranty')));
test('missing materials prevents comparison',()=>assert.equal(run([make('a',1,{materials:null}),make('b',2)]).comparable,false));
test('invalid caller context fails closed',()=>assert.deepEqual(compareContractorQuotes([]).reasons,['invalid_context']));

test('rejects reuse of the same source document across competing quotes',()=>{
 const result=run([make('a',100),make('b',200,{documentId:'doc-a',evidence:{verified:true,documentId:'doc-a',sourceHash:'sha256:a',lineNumber:3}})]);
 assert.ok(result.reasons.includes('duplicate_source_document')); assert.equal(result.comparable,false);
});
test('rejects explicitly non-DKK quote totals',()=>{
 assert.ok(run([make('a',100,{currency:'EUR'}),make('b',200)]).reasons.includes('unsupported_quote_currency'));
});
test('rejects fractions of one øre rather than silently rounding',()=>{
 assert.ok(run([make('a',100.001),make('b',200)]).reasons.includes('invalid_total'));
});
test('accepts normal two-decimal DKK values',()=>{
 assert.equal(run([make('a',1.13),make('b',2.25)]).comparable,true);
});
