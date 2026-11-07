import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../app/page.js',import.meta.url),'utf8');
test('Plus valuation separates verified records from user input and market estimates',()=>{
 expect(source).toContain('Ikke uafhængigt verificeret');
 expect(source).toContain('Markedsværdi:</strong> Ikke beregnet');
 expect(source).toContain('Ejendomsværdi');
 expect(source).toContain('Grundværdi');
 expect(source).toContain('Vurderingsportalen');
 expect(source).toContain('Tinglysning');
 expect(source).toContain('BBR');
 expect(source).toContain('Utilstrækkelige data');
});
test('Plus preview remains gated and has no gallery or payments',()=>{
 expect(source).toContain('const canPreviewPlus=aiAccess&&isAndroidWebView');
 const section=source.slice(source.indexOf('Flere HusPass Plus-funktioner'),source.indexOf('<section className="aiTrust"'));
 expect(section).not.toContain('Billedgalleri');
 expect(section).toContain('Bolig og grundværdi');
 expect(section).toContain('Del bolig & husstand');
 expect(section).not.toMatch(/stripe|checkout|betalingslink/i);
});
