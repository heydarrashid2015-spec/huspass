import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeContractorContact as check } from './contractor-contact-consent.mjs';
const now = 1794800000000;
const base = { ownerId:'owner-a',projectId:'project-a',contractorCvr:'12345678',now };
const consent = {status:'approved',ownerId:base.ownerId,projectId:base.projectId,contractorCvr:base.contractorCvr,grantedAt:now-1000,expiresAt:now+1000};
test('permits only explicit unexpired contractor-specific consent', () => {
  assert.equal(check({...base,consent}).allowed,true);
  for (const status of ['pending','revoked','rejected',undefined])
    assert.equal(check({...base,consent:{...consent,status}}).allowed,false);
});
test('prevents cross-account, project and contractor reuse', () => {
  for (const changed of [{ownerId:'owner-b'},{projectId:'project-b'},{contractorCvr:'87654321'}])
    assert.equal(check({...base,...changed,consent}).allowed,false);
});
test('rejects expired, future and malformed consent timestamps', () => {
  for (const changes of [{expiresAt:now},{grantedAt:now+1},{expiresAt:'tomorrow'},{grantedAt:NaN}])
    assert.equal(check({...base,consent:{...consent,...changes}}).allowed,false);
});
test('rejects getters rather than invoking untrusted consent properties', () => {
  const hostile={...consent};Object.defineProperty(hostile,'status',{get(){throw Error('executed')}});
  assert.equal(check({...base,consent:hostile}).allowed,false);
});
test('rejects absent consent and malformed identity', () => {
  assert.equal(check(base).allowed,false);
  assert.equal(check({...base,ownerId:'',consent}).allowed,false);
  assert.equal(check({...base,contractorCvr:'12x45678',consent}).allowed,false);
});
