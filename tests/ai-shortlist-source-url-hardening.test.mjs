import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeEvidenceUrl, shortlistVerifiedContractors } from '../lib/ai-verified-contractor-shortlist.mjs';

const candidate = sourceUrl => ({name:'Firma',cvr:'12345678',cvrVerified:true,sourceUrl,services:['maling'],servicePostcodes:['2100']});
const project = {category:'maling',postcode:'2100'};

test('accepts a plain HTTPS evidence URL without credentials', () => {
  assert.equal(isSafeEvidenceUrl('https://virk.dk/virksomhed/12345678'),true);
  assert.equal(shortlistVerifiedContractors([candidate('https://virk.dk/virksomhed/12345678')],project).length,1);
});

test('rejects spoofed credentials and malformed source authorities', () => {
  for (const url of [
    'https://virk.dk@evil.example/company',
    'https://user:pass@virk.dk/company',
    'https://virk.dk:444/company',
    'https://virk.dk./company',
    'https://localhost/company',
    'https://virk.dk/#fragment',
    'https://virk.dk\\n.evil.example/company',
    'http://virk.dk/company',
    'https://virk.dk\\u0000/company',
    'https://virk.dk\\t.evil.example/company'
  ]) {
    assert.equal(isSafeEvidenceUrl(url),false,url);
    assert.deepEqual(shortlistVerifiedContractors([candidate(url)],project),[],url);
  }
});

test('rejects non-string URLs and URL-like objects with coercion hooks', () => {
  const malicious = {toString(){throw new Error('must not coerce');}};
  assert.equal(isSafeEvidenceUrl(malicious),false);
  assert.deepEqual(shortlistVerifiedContractors([candidate(malicious)],project),[]);
});
