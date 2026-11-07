import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('total-price filter excludes subtotal and VAT-only lines',()=>{
 const source=readFileSync(new URL('../../app/page.js',import.meta.url),'utf8');
 const match=source.match(/const totalLines=text\.split\(\/\\n\/\)\.filter\(line=>(.*?)\);const totalCandidates=/);
 expect(match).not.toBeNull();
 const filter=new Function('line','return '+match[1]);
 expect(filter('Samlet pris inkl. moms 125.000 kr')).toBe(true);
 expect(filter('Total 125.000 kr')).toBe(true);
 expect(filter('Subtotal 100.000 kr')).toBe(false);
 expect(filter('Delsum 100.000 kr')).toBe(false);
 expect(filter('Samlet før moms 100.000 kr')).toBe(false);
 expect(filter('Samlet momsbeløb 25.000 kr')).toBe(false);
 expect(source).toContain('totalLines.includes(line)&&[...line.matchAll(pricePattern)]');
});
