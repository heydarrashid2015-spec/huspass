import test from 'node:test';
import assert from 'node:assert/strict';
import {assessQuoteDispatch} from './quote-dispatch-idempotency.mjs';
const now=1800000000000;
const fixture=()=>({actorId:'owner_1',ownerId:'owner_1',projectId:'project_1',contractorIds:['cvr_1'],now,
 consent:{id:'consent_1',actorId:'owner_1',projectId:'project_1',purpose:'contractor_quote_request',granted:true,grantedAt:now-100,expiresAt:now+100,contractorIds:['cvr_1']},
 reservation:{atomic:true,persisted:true,ownerId:'owner_1',projectId:'project_1',consentId:'consent_1',recipientIds:['cvr_1'],revoked:false,alreadyDispatched:false}});
test('allows only fully matched reserved request',()=>assert.equal(assessQuoteDispatch(fixture()).allowed,true));
test('denies missing durable atomic reservation',()=>{const x=fixture();delete x.reservation;assert.equal(assessQuoteDispatch(x).allowed,false)});
test('denies cross-account reservation',()=>{const x=fixture();x.reservation.ownerId='other';assert.equal(assessQuoteDispatch(x).allowed,false)});
test('denies recipient substitution',()=>{const x=fixture();x.reservation.recipientIds=['other'];assert.equal(assessQuoteDispatch(x).allowed,false)});
test('denies revoked consent',()=>{const x=fixture();x.reservation.revoked=true;assert.equal(assessQuoteDispatch(x).allowed,false)});
test('denies duplicate dispatch',()=>{const x=fixture();x.reservation.alreadyDispatched=true;assert.equal(assessQuoteDispatch(x).allowed,false)});
test('denies missing consent identity',()=>{const x=fixture();delete x.consent.id;assert.equal(assessQuoteDispatch(x).allowed,false)});
