import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('bottom navigation order and Plus placement',()=>{
 const s=readFileSync(new URL('../../app/page.js',import.meta.url),'utf8');
 const nav='[["menu","Mere",""],["doc","Boligens dokumenter","Dokumenter"],["building","Min bolig","Min bolig"],["home","Overblik","Overblik"]]';
 expect(s.split(nav).length-1).toBeGreaterThanOrEqual(8);
 const ai=s.slice(s.indexOf('if(view==="HusPass AI")'),s.indexOf('if(view==="Mere")'));
 const more=s.slice(s.indexOf('if(view==="Mere")'),s.indexOf('if(view==="Boligværdi")'));
 expect(ai).toContain('Flere HusPass Plus-funktioner');
 expect(ai).toContain('Billedgalleri');
 expect(ai).toContain('Bolig og grundværdi');
 expect(ai).toContain('Del bolig & husstand');
 expect(more).not.toContain('Billedgalleri');
 expect(more).toContain('Support & hjælp');
 expect(more).toContain('Privatliv & data');
});
