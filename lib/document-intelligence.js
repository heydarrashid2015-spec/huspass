/** Review-first Danish document field suggestions, not an OCR engine. */
const dateISO=(day,month,year)=>{const d=new Date(Date.UTC(year,month-1,day));return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day?d.toISOString().slice(0,10):null};
const parseMoney=raw=>{const value=Number(raw.replace(/\s/g,"").replace(/\./g,"").replace(",","."));return Number.isFinite(value)&&value>=0?value:null};
export function parseDanishDocumentText(input){
 const text=String(input||"").slice(0,100000);
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const dates=[...text.matchAll(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})\b/g)].map(m=>dateISO(+m[1],+m[2],+m[3])).filter(Boolean);
 const cvr=text.match(/\bCVR(?:-nummer|-nr\.?)?\s*[:#]?\s*(\d{2}[ .]?\d{2}[ .]?\d{2}[ .]?\d{2})\b/i)?.[1]?.replace(/\D/g,"")||null;
 // Only explicitly labelled totals; avoid treating VAT, unit prices or arbitrary amounts as the invoice total.
 const totals=[...text.matchAll(/(?:^|\n)\s*(?:total(?:\s+inkl\.?\s+moms)?|i\s+alt|at\s+betale|beløb\s+at\s+betale)\s*:?\s*(?:DKK|kr\.?)?\s*([\d.]+,\d{2})\s*(?:kr\.?)?(?=\s|$)/gim)].map(m=>parseMoney(m[1])).filter(v=>v!==null);
 const type=/\b(faktura|invoice|regning)\b/i.test(text)?"Faktura":/\b(kvittering|receipt)\b/i.test(text)?"Kvittering":"Andet";
 const category=/\b(vaskemaskine|opvaskemaskine|køleskab|tørretumbler|komfur)\b/i.test(text)?"Hvidevarer":/\b(vvs|elektriker|maler|tømrer|renovering|reparation)\b/i.test(text)?"Vedligeholdelse":"Andet";
 const supplier=lines.find(l=>l.length>3&&!/^(faktura|kvittering|dato|cvr|total|i alt|at betale|beløb|moms|side\s+\d)/i.test(l))||null;
 return {type,category,documentDate:dates[0]||null,amount:totals.length?totals[totals.length-1]:null,cvr,supplier,warrantyEnd:null,requiresReview:true,source:"extracted-text"};
}
