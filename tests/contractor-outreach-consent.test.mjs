import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeContractorOutreach } from '../lib/ai/contractor-outreach-consent.mjs';

const now = () => new Date().toISOString();
const valid = () => ({
 actorId: 'owner-a',
 project: { id: 'home-project-1', ownerId: 'owner-a' },
 contractor: { id: 'contractor-1', cvr: '12345678' },
 consent: { ownerId: 'owner-a', projectId: 'home-project-1', contractorId: 'contractor-1', action: 'request_quote', granted: true, grantedAt: now() }
});
test('explicit scoped consent permits preparing an outreach request', () => assert.equal(authorizeContractorOutreach(valid()).allowed, true));
for (const [name, change] of [
 ['missing consent', x => delete x.consent],
 ['other tenant', x => x.actorId = 'owner-b'],
 ['other project', x => x.consent.projectId = 'other'],
 ['other contractor', x => x.consent.contractorId = 'other'],
 ['non-explicit approval', x => x.consent.granted = 'true'],
 ['wrong action', x => x.consent.action = 'view_quote'],
 ['revoked consent', x => x.consent.revoked = true],
 ['old consent', x => x.consent.grantedAt = '2020-01-01T00:00:00.000Z'],
 ['future consent', x => x.consent.grantedAt = new Date(Date.now()+86400000).toISOString()],
 ['invalid timestamp', x => x.consent.grantedAt = 'not-a-date'],
 ['invalid CVR', x => x.contractor.cvr = '1234'],
 ['missing actor', x => x.actorId = '']
]) test('deny '+name, () => { const x=valid();change(x);assert.equal(authorizeContractorOutreach(x).allowed,false); });
