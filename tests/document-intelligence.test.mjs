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

test("prioritizes invoice date over earlier due-date text",()=>{
 const r=parseDanishDocumentText("Betalingsfrist 30.11.2026\nFakturadato: 05.11.2026\nI alt: 500,00");
 assert.equal(r.documentDate,"2026-11-05");
});
test("ignores impossible labelled date and falls back to valid date",()=>{
 const r=parseDanishDocumentText("Dato: 31.02.2026\nForfald 10.03.2026");
 assert.equal(r.documentDate,null);
});
test("prioritizes purchase date over payment due date",()=>{
 const r=parseDanishDocumentText("Forfaldsdato 12.12.2026\nKøbsdato 01.11.2026\nAt betale: 399,00");
 assert.equal(r.documentDate,"2026-11-01");
});

test("does not infer invoice date from payment deadline alone",()=>{
 const r=parseDanishDocumentText("Faktura\nBetalingsfrist 30.11.2026\nForfaldsdato: 01.12.2026\nTotal: 100,00");
 assert.equal(r.documentDate,null);
 assert.equal(r.requiresReview,true);
});
test("keeps a valid unlabelled date while excluding due date",()=>{
 const r=parseDanishDocumentText("Faktura\nBetalingsfrist 30.11.2026\n05.11.2026\nTotal: 100,00");
 assert.equal(r.documentDate,"2026-11-05");
});

test("rejects payment deadline while keeping unrelated valid receipt date",()=>{
 const r=parseDanishDocumentText("Betalingsfrist 30.11.2026\nKvittering\n05.11.2026\nI alt: 100,00");
 assert.equal(r.documentDate,"2026-11-05");
 assert.equal(r.amount,100);
});

test("does not silently choose between conflicting labelled totals",()=>{
 const r=parseDanishDocumentText("Faktura\nTotal: 1.000,00\nAt betale: 1.250,00");
 assert.equal(r.amount,null);
 assert.equal(r.requiresReview,true);
});
test("accepts repeated identical labelled totals",()=>{
 const r=parseDanishDocumentText("Faktura\nTotal: 1.250,00\nAt betale: 1.250,00");
 assert.equal(r.amount,1250);
});

test("does not choose between conflicting labelled invoice dates",()=>{
 const r=parseDanishDocumentText("Faktura\nFakturadato: 05.11.2026\nDato: 06.11.2026\nTotal: 100,00");
 assert.equal(r.documentDate,null);
 assert.equal(r.requiresReview,true);
});
test("accepts repeated identical labelled invoice dates",()=>{
 const r=parseDanishDocumentText("Faktura\nFakturadato: 05.11.2026\nDato: 05.11.2026");
 assert.equal(r.documentDate,"2026-11-05");
});

test("requires review when unlabelled document dates conflict",()=>{
 const r=parseDanishDocumentText("Kvittering\n05.11.2026\n06.11.2026\nI alt: 100,00");
 assert.equal(r.documentDate,null);
 assert.equal(r.requiresReview,true);
});
test("accepts repeated identical unlabelled dates",()=>{
 const r=parseDanishDocumentText("Kvittering\n05.11.2026\n05.11.2026");
 assert.equal(r.documentDate,"2026-11-05");
});


test("does not misidentify invoice metadata as supplier",()=>{
 const r=parseDanishDocumentText("Faktura\nBetalingsfrist 30.11.2026\nFakturadato: 05.11.2026\nAt betale: 1.250,00");
 assert.equal(r.supplier,null);
 assert.equal(r.requiresReview,true);
});
test("identifies a supplier after invoice metadata",()=>{
 const r=parseDanishDocumentText("Faktura\nFakturadato: 05.11.2026\nNord El ApS\nI alt: 1.250,00");
 assert.equal(r.supplier,"Nord El ApS");
});


test("does not mistake bank payment details for supplier",()=>{
 const r=parseDanishDocumentText("Faktura\nIBAN DK50 0040 0440 1162 43\nKontonummer 1234567890\nReg.nr. 1234\nTotal: 100,00");
 assert.equal(r.supplier,null);
 assert.equal(r.requiresReview,true);
});
test("skips payment details and identifies an actual supplier",()=>{
 const r=parseDanishDocumentText("Faktura\nIBAN DK50 0040 0440 1162 43\nKontonummer 1234567890\nNord El ApS\nI alt: 100,00");
 assert.equal(r.supplier,"Nord El ApS");
});


test("does not treat a standalone date or amount as supplier",()=>{
 const r=parseDanishDocumentText("Faktura\n05.11.2026\n1.250,00\nTotal: 1.250,00");
 assert.equal(r.supplier,null);
 assert.equal(r.requiresReview,true);
});
test("skips document numbers and keeps an explicit company supplier",()=>{
 const r=parseDanishDocumentText("Faktura\nFakturanr. 123456\nOrdrenummer 987654\nNord El ApS\nI alt: 500,00");
 assert.equal(r.supplier,"Nord El ApS");
});

test("reads invoice fields split across OCR lines",()=>{
 const r=parseDanishDocumentText("Nord El ApS\nFaktura\nFakturadato\n05.11.2026\nI alt\n1.250,00");
 assert.equal(r.documentDate,"2026-11-05");
 assert.equal(r.amount,1250);
 assert.equal(r.requiresReview,true);
});
test("does not join an invoice label across unrelated OCR content",()=>{
 const r=parseDanishDocumentText("Faktura\nI alt\nMoms 250,00\n1.250,00");
 assert.equal(r.amount,null);
});

test("does not misidentify customer and delivery addresses as supplier",()=>{
 const r=parseDanishDocumentText("Faktura\nKunde: Privat Person\nLeveringsadresse: Testvej 1\nFakturaadresse: Testvej 1\nI alt: 500,00");
 assert.equal(r.supplier,null);
 assert.equal(r.requiresReview,true);
});
test("skips customer metadata before a genuine supplier",()=>{
 const r=parseDanishDocumentText("Faktura\nKundenavn: Privat Person\nLeveringsadresse: Testvej 1\nNord El ApS\nI alt: 500,00");
 assert.equal(r.supplier,"Nord El ApS");
});
