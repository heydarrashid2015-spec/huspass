import test from 'node:test';
import assert from 'node:assert/strict';
import { shortlistVerifiedContractors } from '../lib/ai-verified-contractor-shortlist.mjs';

const project={category:'maling',postcode:'2100'};
const contractor=(overrides={})=>({
 name:'Malerfirma',cvr:'12345678',cvrVerified:true,
 sourceUrl:'https://example.dk/virksomhed',website:'https://example.dk',
 services:['maling'],servicePostcodes:['2100'],...overrides
});
test('returns only documented verified candidates in project area',()=>{
 const result=shortlistVerifiedContractors([
  contractor({name:'Verified'}),
  contractor({name:'No CVR',cvrVerified:false,cvr:'87654321'}),
  contractor({name:'Wrong area',cvr:'23456789',servicePostcodes:['8000']})
 ],project);
 assert.equal(result.length,1);
 assert.equal(result[0].name,'Verified');
 assert.equal(result[0].quotedPrice,null);
});
test('rejects absent, inherited and malformed CVR evidence',()=>{
 const inherited=Object.create(contractor());
 assert.deepEqual(shortlistVerifiedContractors([
  contractor({cvr:'1234'}),contractor({sourceUrl:'http://example.dk'}),
  inherited
 ],project),[]);
});
test('limits to three unique legal entities',()=>{
 const records=Array.from({length:5},(_,i)=>contractor({name:'Firma '+i,cvr:String(10000000+i)}));
 assert.equal(shortlistVerifiedContractors([...records,records[0]],project).length,3);
});
test('rejects invalid project postcode and non-array candidates',()=>{
 assert.deepEqual(shortlistVerifiedContractors([contractor()],{category:'maling',postcode:'bad'}),[]);
 assert.throws(()=>shortlistVerifiedContractors(null,project),TypeError);
});
