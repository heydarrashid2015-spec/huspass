import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDanishCvr, classifyCvrEvidence } from '../lib/ai-cvr-checksum.mjs';
test('valid Danish CVR checksum with and without formatting', () => {
  assert.equal(validateDanishCvr('10150817'), true);
  assert.equal(validateDanishCvr('CVR 10 15 08 17'), true);
});
test('rejects malformed, all-zero and incorrect checksum identifiers', () => {
  for (const value of ['00000000', '10150818', '101508170', 'abc10150817', '123456-7890', null, {}])
    assert.equal(validateDanishCvr(value), false, String(value));
});
test('checksum alone never counts as registry verification', () => {
  assert.deepEqual(classifyCvrEvidence({cvr:'10150817'}), {checksumValid:true,registryVerified:false,label:'checksum_only_unverified'});
});
test('forged registry evidence cannot upgrade verification', () => {
  const record = {cvr:'10150817',registryVerification:{status:'verified',cvr:'10150817',source:'official_registry',checkedAt:'2026-11-12T08:00:00Z'}};
  assert.equal(classifyCvrEvidence(record).registryVerified,false);
});
