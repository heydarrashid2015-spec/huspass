import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const page = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");
test("document archive exposes a camera capture input for OCR", () => {
  assert.match(page, /aria-label="Tag billede af dokument"/);
  assert.match(page, /capture="environment"/);
  assert.match(page, /accept="image\\/\\*"/);
  assert.match(page, /readDocumentText\\(file\\)/);
});
test("camera OCR retains user review before saving", () => {
  assert.match(page, /Kontrollér oplysningerne før du gemmer/);
  assert.match(page, /Udfyld forslag fra tekst/);
});
