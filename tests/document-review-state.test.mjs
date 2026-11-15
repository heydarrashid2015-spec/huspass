import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const page=await readFile(new URL("../app/page.js",import.meta.url),"utf8");

test("new OCR file invalidates prior text and parsed suggestions before extraction",()=>{
 assert.match(page,/if\(!file\)return;setScanBusy\(true\);setScanResult\(null\);setScanText\(""\);try\{const text=await readDocumentText\(file\)/);
});

test("manual OCR text edits invalidate suggestions instead of showing stale invoice data",()=>{
 assert.match(page,/value=\{scanText\} onChange=\{e=>\{setScanText\(e\.target\.value\);setScanResult\(null\)\}\}/);
});

test("OCR suggestions require a separate user action and never save automatically",()=>{
 assert.match(page,/Udfyld forslag fra tekst/);
 assert.match(page,/Kontrollér oplysningerne før du gemmer/);
});
