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

test("reads split OCR invoice date without borrowing payment deadline",()=>{
 const r=parseDanishDocumentText("Faktura\nBetalingsfrist\n30.11.2026\nFakturadato\n05.11.2026");
 assert.equal(r.documentDate,"2026-11-05");
});
test("does not borrow an unrelated amount after a split total label",()=>{
 const r=parseDanishDocumentText("Faktura\nI alt\nMoms 250,00\n1.250,00");
 assert.equal(r.amount,null);
});
test("reads split payable amount when directly adjacent",()=>{
 const r=parseDanishDocumentText("Faktura\nAt betale\n1.250,00");
 assert.equal(r.amount,1250);
});

test("split labels and values preserve invoice date and payable total",()=>{
 const r=parseDanishDocumentText("Faktura\nFakturadato\n05.11.2026\nI alt\n1.250,00");
 assert.equal(r.documentDate,"2026-11-05");
 assert.equal(r.amount,1250);
});
test("split due date is never interpreted as document date",()=>{
 const r=parseDanishDocumentText("Faktura\nBetalingsfrist\n30.11.2026\nI alt\n500,00");
 assert.equal(r.documentDate,null);
 assert.equal(r.amount,500);
});

// OCR often separates Danish thousands with a regular or non-breaking space.
test("reads spaced thousands in labelled invoice totals",()=>{
 const r=parseDanishDocumentText("Nord El ApS\nFaktura\nI alt: 1 250,00");
 assert.equal(r.amount,1250);
});
test("reads non-breaking-space thousands in split OCR total",()=>{
 const r=parseDanishDocumentText("Faktura\nAt betale\n2\u00a0499,95");
 assert.equal(r.amount,2499.95);
});

// OCR can introduce stray spaces: reject ambiguous grouping rather than guessing a total.
test("rejects malformed thousands grouping in labelled totals",()=>{
 const r=parseDanishDocumentText("Faktura\nI alt: 12 34,00");
 assert.equal(r.amount,null);
 assert.equal(r.requiresReview,true);
});
test("accepts correctly grouped multi-thousand totals",()=>{
 const r=parseDanishDocumentText("Faktura\nI alt: 1 234 567,89");
 assert.equal(r.amount,1234567.89);
});


test("suggests only explicitly dated warranty expiry for user review",()=>{
 const r=parseDanishDocumentText("Nord El ApS\nKvittering\nKøbsdato 05.11.2026\nGaranti udløber: 05.11.2028");
 assert.equal(r.warrantyEnd,"2028-11-05");
 assert.equal(r.requiresReview,true);
});
test("never guesses warranty from a duration or conflicting expiry dates",()=>{
 assert.equal(parseDanishDocumentText("Kvittering\n2 års garanti\nKøbsdato 05.11.2026").warrantyEnd,null);
 assert.equal(parseDanishDocumentText("Garanti udløber: 05.11.2028\nGaranti udløber: 06.11.2028").warrantyEnd,null);
 assert.equal(parseDanishDocumentText("Garanti udløber: 31.02.2028").warrantyEnd,null);
});

// Warranty expiry must never be silently substituted for a purchase/invoice date.
test("warranty expiry alone is not a document date",()=>{
 const r=parseDanishDocumentText("Kvittering\nGaranti udløber: 05.11.2028\nI alt: 500,00");
 assert.equal(r.documentDate,null);
 assert.equal(r.warrantyEnd,"2028-11-05");
});
test("unlabelled receipt date is not made ambiguous by warranty expiry",()=>{
 const r=parseDanishDocumentText("Kvittering\n05.11.2026\nGaranti udløber: 05.11.2028\nI alt: 500,00");
 assert.equal(r.documentDate,"2026-11-05");
 assert.equal(r.warrantyEnd,"2028-11-05");
});

test("reads OCR-split warranty expiry without treating it as purchase date or supplier",()=>{
 const r=parseDanishDocumentText("Kvittering\nGaranti udløber\n05.11.2028\nI alt: 500,00");
 assert.equal(r.warrantyEnd,"2028-11-05");
 assert.equal(r.documentDate,null);
 assert.equal(r.supplier,null);
 assert.equal(r.requiresReview,true);
});
test("does not borrow an unrelated date for split warranty expiry",()=>{
 const r=parseDanishDocumentText("Kvittering\nGaranti udløber\nKøbsdato 05.11.2026\n05.11.2028");
 assert.equal(r.warrantyEnd,null);
 assert.equal(r.documentDate,"2026-11-05");
});
test("rejects conflicting split and inline warranty expiry dates",()=>{
 const r=parseDanishDocumentText("Kvittering\nGaranti udløber\n05.11.2028\nGaranti udløber: 06.11.2028");
 assert.equal(r.warrantyEnd,null);
});

// OCR metadata labels must not become invented merchant names.
test("warranty labels cannot be inferred as suppliers",()=>{
 for(const label of ["Garanti udløber","Garanti udløber: 05.11.2028","Garanti gyldig til","Garantiudløb: 05.11.2028"]){
  const result=parseDanishDocumentText("Kvittering\n"+label+"\nI alt: 500,00");
  assert.equal(result.supplier,null,label);
 }
});

// Warranty marketing text is not evidence of the merchant identity.
test("does not mistake warranty duration text for supplier",()=>{
 for(const label of ["2 års garanti","Garanti 24 måneder","Reklamationsret 2 år"]){
  const r=parseDanishDocumentText("Kvittering\n"+label+"\nI alt: 500,00");
  assert.equal(r.supplier,null,label);
  assert.equal(r.requiresReview,true);
 }
});
test("keeps real supplier after warranty duration text",()=>{
 const r=parseDanishDocumentText("Kvittering\n2 års garanti\nNord El ApS\nI alt: 500,00");
 assert.equal(r.supplier,"Nord El ApS");
});

test("unlabelled warranty validity date is not mistaken for invoice date",()=>{
 const r=parseDanishDocumentText("Kvittering\nGaranti: 05.11.2028\nI alt: 500,00");
 assert.equal(r.documentDate,null);
 assert.equal(r.warrantyEnd,null);
 assert.equal(r.requiresReview,true);
});
test("consumer complaint deadline is not a purchase date",()=>{
 const r=parseDanishDocumentText("Kvittering\nReklamationsret til 05.11.2028\nI alt: 500,00");
 assert.equal(r.documentDate,null);
 assert.equal(r.requiresReview,true);
});
test("unlabelled purchase date remains available alongside warranty deadline",()=>{
 const r=parseDanishDocumentText("Kvittering\n05.11.2026\nGaranti: 05.11.2028\nI alt: 500,00");
 assert.equal(r.documentDate,"2026-11-05");
});

// Warranty-only dates must not become receipt dates, including split OCR labels.
test("excludes standalone Garanti date from document date",()=>{
 const r=parseDanishDocumentText("Kvittering\nGaranti: 05.11.2028\nI alt: 500,00");
 assert.equal(r.documentDate,null);
});
test("excludes OCR-split Garanti date from document date",()=>{
 const r=parseDanishDocumentText("Kvittering\nGaranti:\n05.11.2028\nI alt: 500,00");
 assert.equal(r.documentDate,null);
});

// Complaint-right marketing lines are not merchant identities, regardless of word order.
test("does not infer supplier from reversed complaint-right duration",()=>{
 for(const line of ["2 år reklamationsret","24 måneders reklamationsret","Reklamationsret: 24 måneder"]){
  const r=parseDanishDocumentText("Kvittering\n"+line+"\nI alt: 500,00");
  assert.equal(r.supplier,null,line);
  assert.equal(r.requiresReview,true);
 }
});
test("preserves genuine supplier after complaint-right marketing",()=>{
 const r=parseDanishDocumentText("Kvittering\n2 år reklamationsret\nNord El ApS\nI alt: 500,00");
 assert.equal(r.supplier,"Nord El ApS");
});

// Conflicting seller identifiers must be reviewed rather than silently selecting the first.
test("does not select one of two conflicting CVR numbers",()=>{
 const r=parseDanishDocumentText("Faktura\nCVR: 12345678\nCVR: 87654321\nI alt: 500,00");
 assert.equal(r.cvr,null);
 assert.equal(r.requiresReview,true);
});
test("repeated identical CVR remains a suggestion for review",()=>{
 const r=parseDanishDocumentText("Faktura\nCVR: 12345678\nCVR-nr: 12345678\nI alt: 500,00");
 assert.equal(r.cvr,"12345678");
});

// A malformed competing labelled total must not be silently discarded.
test("requires manual review when one of two labelled totals is malformed",()=>{
 const r=parseDanishDocumentText("Faktura\nTotal: 1.250,00\nAt betale: 12 50,00");
 assert.equal(r.amount,null);
 assert.equal(r.requiresReview,true);
});
test("does not infer a total from a valid label if another labelled total is truncated",()=>{
 const r=parseDanishDocumentText("Faktura\nTotal: 1.250,00\nAt betale: 1250,0");
 assert.equal(r.amount,null);
});

// A generic warranty date is not an invoice/purchase date.
test("does not infer purchase date from standalone Garanti date",()=>{
 const r=parseDanishDocumentText("Kvittering\nGaranti\n05.11.2028\nI alt: 500,00");
 assert.equal(r.documentDate,null);
 assert.equal(r.requiresReview,true);
});
test("generic warranty date does not conflict with a real purchase date",()=>{
 const r=parseDanishDocumentText("Kvittering\nKøbsdato 05.11.2026\nGaranti\n05.11.2028");
 assert.equal(r.documentDate,"2026-11-05");
});

// Customer contact and identity fields must not be proposed as a merchant.
test("does not infer supplier from personal contact or CPR metadata",()=>{
 for(const line of ["CPR: 010190-1234","Telefon: 12345678","Tlf. 12345678","E-mail: kunde@example.dk","Adresse: Testvej 1"]){
  const r=parseDanishDocumentText("Faktura\n"+line+"\nI alt: 500,00");
  assert.equal(r.supplier,null,line);
  assert.equal(r.requiresReview,true);
 }
});
test("finds merchant after customer contact fields",()=>{
 const r=parseDanishDocumentText("Faktura\nTelefon: 12345678\nE-mail: kunde@example.dk\nNord El ApS\nI alt: 500,00");
 assert.equal(r.supplier,"Nord El ApS");
});

// An invalid competing explicitly labelled date must not be silently discarded.
test("rejects valid invoice date when another labelled invoice date is impossible",()=>{
 const r=parseDanishDocumentText("Faktura\nFakturadato: 05.11.2026\nDato: 31.02.2026\nI alt: 500,00");
 assert.equal(r.documentDate,null);
 assert.equal(r.requiresReview,true);
});
test("rejects valid warranty expiry when a competing labelled expiry is impossible",()=>{
 const r=parseDanishDocumentText("Kvittering\nGaranti udløber: 05.11.2028\nGaranti udløber: 31.02.2028");
 assert.equal(r.warrantyEnd,null);
 assert.equal(r.requiresReview,true);
});

// A malformed second CVR must not allow a seemingly verified supplier ID.
test("rejects a valid CVR when a second labelled CVR is truncated",()=>{
 const r=parseDanishDocumentText("Faktura\nCVR: 12345678\nCVR: 8765432\nI alt: 500,00");
 assert.equal(r.cvr,null);
 assert.equal(r.requiresReview,true);
});
test("rejects a valid CVR when another labelled CVR has OCR letters",()=>{
 const r=parseDanishDocumentText("Faktura\nCVR: 12345678\nCVR: 8765O321");
 assert.equal(r.cvr,null);
});

// An empty competing CVR field may be an OCR failure; never trust the other value.
test("rejects CVR suggestion when another CVR label has no value",()=>{
 const r=parseDanishDocumentText("Faktura\nCVR: 12345678\nCVR:\nI alt: 500,00");
 assert.equal(r.cvr,null);
 assert.equal(r.requiresReview,true);
});

// Empty OCR total fields must count as competing evidence, not disappear.
test("rejects a total when a second explicitly labelled total is empty",()=>{
 const r=parseDanishDocumentText("Faktura\nTotal: 1.250,00\nAt betale:\nMoms 250,00");
 assert.equal(r.amount,null);
 assert.equal(r.requiresReview,true);
});
test("rejects a total when an empty total label precedes a valid total",()=>{
 const r=parseDanishDocumentText("Faktura\nI alt:\nTotal: 1.250,00");
 assert.equal(r.amount,null);
});

// OCR can split a CVR label and its value across adjacent lines.
test("reads CVR split across adjacent OCR lines",()=>{
 const r=parseDanishDocumentText("Nord El ApS\nFaktura\nCVR\n12345678\nI alt: 500,00");
 assert.equal(r.cvr,"12345678");
 assert.equal(r.requiresReview,true);
});
test("does not accept a split CVR if another labelled CVR conflicts",()=>{
 const r=parseDanishDocumentText("Faktura\nCVR\n12345678\nCVR: 87654321");
 assert.equal(r.cvr,null);
});
test("does not borrow an unrelated OCR line for a split CVR",()=>{
 const r=parseDanishDocumentText("Faktura\nCVR\nNord El ApS\n12345678");
 assert.equal(r.cvr,null);
});

// Regression: OCR separates CVR label from its eight-digit value.
test("reads adjacent OCR-split CVR without borrowing a later unrelated number",()=>{
 const r=parseDanishDocumentText("Nord El ApS\nFaktura\nCVR:\n12345678\nI alt: 500,00");
 assert.equal(r.cvr,"12345678");
 assert.equal(r.requiresReview,true);
});

// A malformed unlabelled OCR date must not be hidden by a second valid date.
test("does not suggest an unlabelled date when another OCR date is impossible",()=>{
 const r=parseDanishDocumentText("Faktura\n05.11.2026\n31.02.2026\nTotal: 500,00");
 assert.equal(r.documentDate,null);
 assert.equal(r.requiresReview,true);
});
