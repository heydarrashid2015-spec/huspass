import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../app/page.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('document camera and PDF OCR actions have visible accessible touch targets', () => {
  assert.match(page, /className="docScanAction"><span>📷 Tag billede af dokument<\/span>/);
  assert.match(page, /aria-label="Tag billede af dokument" accept="image\/\*" capture="environment"/);
  assert.match(page, /className="docScanAction"><span>📄 Upload PDF\/billede til OCR<\/span>/);
  assert.match(page, /accept="\.pdf,\.png,\.jpg,\.jpeg,\.webp,application\/pdf/);
  assert.match(css, /\.docForm \.docScanAction\{[^}]*min-height:52px/);
  assert.match(css, /\.docForm \.docScanAction>input\[type=file\]\{[^}]*opacity:0/);
  assert.match(css, /\.docForm \.docScanAction:focus-within/);
});

test('document scan actions preserve local OCR and manual review before saving', () => {
  const section = page.slice(page.indexOf('Smart dokumentarkiv · Tekstgenkendelse'));
  assert.match(section, /readDocumentText\(file\)/);
  assert.match(section, /Udfyld forslag fra tekst/);
  assert.match(section, /Kontrollér altid oplysningerne før du gemmer/);
});
