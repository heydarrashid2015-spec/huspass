import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('Planlæg opened from dashboard returns to dashboard',()=>{
 const s=readFileSync(new URL('../../app/page.js',import.meta.url),'utf8');
 expect(s).toContain('<span>Planlæg</span>');
 expect(s).toContain('onClick={()=>setView("Fremtidsplan")}');
 const start=s.indexOf('if(view==="Fremtidsplan")');
 const end=s.indexOf('if(view==="Boligens historik")',start);
 expect(start).toBeGreaterThan(0);
 const page=s.slice(start,end);
 expect(page).toContain('aria-label="Tilbage til overblik" onClick={()=>setView("Overblik")}');
 expect(page).not.toContain('aria-label="Tilbage til opgaver" onClick={()=>setView("Vedligeholdelse")}');
});
