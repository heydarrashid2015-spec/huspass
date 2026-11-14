/** Review-first Danish document field suggestions, not an OCR engine. */
const dateISO=(day,month,year)=>{const d=new Date(Date.UTC(year,month-1,day));return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day?d.toISOString().slice(0,10):null};
const parseMoney=raw=>{const cleaned=raw.trim().replace(/\u00a0/g," ");if(!/^(?:\d+|\d{1,3}(?:[. ]\d{3})+),\d{2}$/.test(cleaned))return null;const value=Number(cleaned.replace(/[. ]/g,"").replace(",","."));return Number.isFinite(value)&&value>=0?value:null};
export function parseDanishDocumentText(input){
 const text=String(input||"").slice(0,100000);
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 // OCR frequently places a field label and its value on consecutive lines.
 // Join only immediately adjacent, type-compatible values; never cross another field.
 const normalized=lines.map((line,i)=>{
  const next=lines[i+1]||"";
  if(/^CVR(?:-nummer|-nr\.?)?\s*:?$/i.test(line)&&/^\d{8}$/.test(next))return line+" "+next;
  if(/^(?:fakturadato|købsdato|kvitteringsdato|dato|betalingsfrist|forfald(?:sdato)?|garanti\s+(?:udløber|til|gyldig\s+til)|garantiudløb|garanti)\s*:?$/i.test(line)&&/^\d{1,2}[.\/-]\d{1,2}[.\/-]20\d{2}$/.test(next))return line+" "+next;
  if(/^(?:total|i\s+alt|at\s+betale|beløb\s+at\s+betale)\s*:?$/i.test(line)&&/^(?:DKK\s*|kr\.?\s*)?[\d.\u00a0 ]+,\d{2}(?:\s*kr\.?)?$/.test(next))return line+" "+next;
  return line;
 }).filter((line,i)=>!(i>0&&normalizedPlaceholder(lines[i-1],line))).join("\n");
 function normalizedPlaceholder(previous,current){
  return /^CVR(?:-nummer|-nr\.?)?\s*:?$/i.test(previous)&&/^\d{8}$/.test(current)||/^(?:fakturadato|købsdato|kvitteringsdato|dato|betalingsfrist|forfald(?:sdato)?|garanti\s+(?:udløber|til|gyldig\s+til)|garantiudløb|garanti)\s*:?$/i.test(previous)&&/^\d{1,2}[.\/-]\d{1,2}[.\/-]20\d{2}$/.test(current)||/^(?:total|i\s+alt|at\s+betale|beløb\s+at\s+betale)\s*:?$/i.test(previous)&&/^(?:DKK\s*|kr\.?\s*)?[\d.\u00a0 ]+,\d{2}(?:\s*kr\.?)?$/.test(current);
 }
 const dates=normalized.split("\n").filter(line=>!/(?:forfald|betalingsfrist|senest|due\s+date|payment\s+due|garanti\s+(?:udløber|til|gyldig\s+til)|garantiudløb|garanti(?:\s|:)|reklamationsret)/i.test(line)).flatMap(line=>[...line.matchAll(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})\b/g)].map(m=>dateISO(+m[1],+m[2],+m[3])));
 // Prefer an explicitly labelled invoice/receipt date over due dates or dates in the header.
 const labelledDates=[...normalized.matchAll(/(?:^|\n)\s*(?:fakturadato|købsdato|kvitteringsdato|dato)\s*:?\s*(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})\b/gim)].map(m=>dateISO(+m[1],+m[2],+m[3]));
 const cvrMatches=[...text.matchAll(/\bCVR(?:-nummer|-nr\.?)?\s*[:#]?\s*(\d{2}[ .]?\d{2}[ .]?\d{2}[ .]?\d{2})\b/gi)].map(m=>m[1].replace(/\D/g,""));
 const cvrLabelCount=[...text.matchAll(/\bCVR(?:-nummer|-nr\.?)?\b/gi)].length;
 const cvr=cvrMatches.length&&cvrLabelCount===cvrMatches.length&&cvrMatches.every(value=>value===cvrMatches[0])?cvrMatches[0]:null;
 // Only explicitly labelled totals; avoid treating VAT, unit prices or arbitrary amounts as the invoice total.
 const totals=[...normalized.matchAll(/(?:^|\n)\s*(?:total(?:\s+inkl\.?\s+moms)?|i\s+alt|at\s+betale|beløb\s+at\s+betale)\s*:?\s*(?:DKK|kr\.?)?\s*([\d.\u00a0 ]+,\d{2})\s*(?:kr\.?)?(?=\s|$)/gim)].map(m=>parseMoney(m[1])).filter(v=>v!==null);
 // Do not accept a valid amount when another explicitly labelled total is malformed.
 const totalLabelCount=[...normalized.matchAll(/(?:^|\n)[ \t]*(?:total(?:[ \t]+inkl\.?[ \t]+moms)?|i[ \t]+alt|at[ \t]+betale|beløb[ \t]+at[ \t]+betale)[ \t]*:?(?=[ \t]|$)/gim)].length;
 const verifiedTotals=totalLabelCount===totals.length?totals:[];
 // A warranty duration is not an expiry date: require an explicit, valid date.
 const warrantyDates=[...normalized.matchAll(/(?:^|\n)\s*(?:garanti\s+udløber|garantiudløb|garanti\s+til|garanti\s+gyldig\s+til)\s*:?\s*(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})\b/gim)].map(m=>dateISO(+m[1],+m[2],+m[3]));
 const warrantyEnd=warrantyDates.length&&warrantyDates.every(date=>date&&date===warrantyDates[0])?warrantyDates[0]:null;
 const type=/\b(faktura|invoice|regning)\b/i.test(text)?"Faktura":/\b(kvittering|receipt)\b/i.test(text)?"Kvittering":"Andet";
 const category=/\b(vaskemaskine|opvaskemaskine|køleskab|tørretumbler|komfur)\b/i.test(text)?"Hvidevarer":/\b(vvs|elektriker|maler|tømrer|renovering|reparation)\b/i.test(text)?"Vedligeholdelse":"Andet";
 const supplier=lines.find(l=>l.length>3&&!/^(?:faktura|invoice|regning|kvittering|receipt|fakturadato|købsdato|kvitteringsdato|dato|garanti(?:\s+(?:udløber|til|gyldig\s+til))?|garantiudløb|(?:\d+\s*(?:års?|måneder)\s+garanti|garanti\s+\d+\s*(?:års?|måneder))|reklamationsret|(?:\d+\s*(?:år|års?|måneder|måneders)\s+reklamationsret)|cvr|total|i alt|at betale|beløb|moms|side\s+\d|betalingsfrist|forfald(?:sdato)?|due\s+date|payment\s+due|senest|iban|bic|swift|kontonummer|konto(?:nr\.?|nummer)?|reg\.?\s*nr\.?|bank(?:konto|oplysninger)?|faktura(?:nr\.?|nummer)|ordre(?:nr\.?|nummer)|kunde(?:navn|nummer|nr\.?)?|leveringsadresse|fakturaadresse|modtager|cpr(?:-nr\.?|-nummer)?|telefon(?:nummer|nr\.?)?|tlf\.?|e-?mail|adresse)\b/i.test(l)&&!/^(?:\d{1,2}[.\/-]\d{1,2}[.\/-]20\d{2}|[\d.,\s]+(?:kr\.?)?)$/i.test(l))||null;
 return {type,category,documentDate:labelledDates.length?(labelledDates[0]&&labelledDates.every(date=>date===labelledDates[0])?labelledDates[0]:null):(dates.length&&dates.every(date=>date===dates[0])?dates[0]:null),amount:verifiedTotals.length&&verifiedTotals.every(value=>value===verifiedTotals[0])?verifiedTotals[0]:null,cvr,supplier,warrantyEnd,requiresReview:true,source:"extracted-text"};
}
