import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from '../src/lib/quotePriceEvidence.mjs';

test('discount percentages do not turn deductions into quote prices', () => {
  for (const text of ['Rabat 10 %: 500 kr', 'Rabat på 10% 500 kr', 'Fradrag 5 %: 250 kr', 'Besparelse 12,5 %: 625 kr']) {
    assert.deepEqual(extractQuotePriceEvidence(text), [], text);
  }
});

test('discount percentage on its own line does not hide payable total', () => {
  const found = extractQuotePriceEvidence('Arbejde 5.000 kr\\nRabat 10 %: 500 kr\\nTotal: 4.500 kr'.replaceAll('\\n', '\n'));
  assert.deepEqual(found.map(x => x.amountDkk), [5000, 4500]);
  assert.equal(found[1].isTotal, true);
});
