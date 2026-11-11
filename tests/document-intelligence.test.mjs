import test from "node:test";
import assert from "node:assert/strict";
import {parseDanishDocumentText} from "../lib/document-intelligence.js";

test("extracts labelled total and valid invoice metadata",()=>{
 const r=parseDanishDocumentText("Nord El ApS\nFaktura\nDato 05.11.2026\nCVR 12 34 56 78\nElektriker\nMoms 250,00\nI alt: 1.250,00");
 assert.equal(r.type,"Faktura");assert.equal(r.category,"Vedligeholdelse");
 assert.equal(r.documentDate,"2026-11-05");assert.equal(r.cvr,"12345678");assert.equal(r.amount,1250);
 assert.equal(r.warrantyEnd,null);assert.equal(r.requiresReview,true);
});
test("does not invent total or warranty",()=>{
 const r=parseDanishDocumentText("Kvittering\nVaskemaskine\nPris 999,00\nMoms 199,80");
 assert.equal(r.type,"Kvittering");assert.equal(r.category,"Hvidevarer");assert.equal(r.amount,null);assert.equal(r.warrantyEnd,null);
});
test("rejects impossible dates",()=>{
 const r=parseDanishDocumentText("Faktura\n31.02.2026\nTotal: 1.000,00");
 assert.equal(r.documentDate,null);assert.equal(r.amount,1000);
});
