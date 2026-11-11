import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

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

test("reads receipt with labelled payable amount and leap day",()=>{
 const r=parseDanishDocumentText("Butik ApS\nKvittering\n29.02.2024\nAt betale: 2.499,95 kr.");
 assert.equal(r.documentDate,"2024-02-29");assert.equal(r.amount,2499.95);assert.equal(r.type,"Kvittering");
});
test("does not treat unlabelled amounts as total",()=>{
 const r=parseDanishDocumentText("Faktura\nVare 1.000,00\nMoms 250,00\nRabat 100,00");
 assert.equal(r.amount,null);assert.equal(r.requiresReview,true);
});
test("empty input returns no fabricated metadata",()=>{
 const r=parseDanishDocumentText("");
 assert.equal(r.amount,null);assert.equal(r.documentDate,null);assert.equal(r.cvr,null);assert.equal(r.warrantyEnd,null);
});
