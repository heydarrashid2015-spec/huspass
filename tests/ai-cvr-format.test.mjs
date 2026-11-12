import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectDanishCvr, isVerifiedCvrMatch } from '../lib/ai-cvr-format.mjs';

test('valid checksum is not evidence of registry verification', () => {
  assert.deepEqual(inspectDanishCvr('10150817'), { valid: true, cvr: '10150817', reason: null, registryVerified: false });
});
test('reject incorrect modulus-11 check digit', () => {
  assert.equal(inspectDanishCvr('12345678').reason, 'invalid_checksum');
});
test('reject formatting and injection rather than silently stripping', () => {
  for (const value of ['10 150817', 'DK10150817', '10150817\n', '10150817;DROP', '1015081', '101508170', null, {}, 10150817.5]) {
    assert.equal(inspectDanishCvr(value).valid, false);
  }
});
test('do not trust user-supplied verified flags without server provenance', () => {
  assert.equal(isVerifiedCvrMatch('10150817', { cvr:'10150817', verified:true, active:true }), false);
});
test('mismatched, inactive, or malformed registry evidence cannot verify', () => {
  const record = { source:'server_registry_lookup', verified:true, active:true, cvr:'10150817' };
  assert.equal(isVerifiedCvrMatch('10150817', record), true);
  assert.equal(isVerifiedCvrMatch('10150817', {...record,cvr:'13585628'}), false);
  assert.equal(isVerifiedCvrMatch('10150817', {...record,active:false}), false);
  assert.equal(isVerifiedCvrMatch('12345678', record), false);
});
