/** Smart document archive: deterministic Danish invoice field suggestions.
 * This module does NOT perform OCR. Feed it text from a separately secured OCR provider.
 * Never treat inferred warranty periods or tax deductibility as established facts.
 */
export function parseDanishDocumentText(input) {
  const text=String(input||"").slice(0,100000);
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const datePattern=/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})\b/g;
  const dates=[...text.matchAll(datePattern)].map(m=>{const d=new Date(Date.UTC(+m[3],+m[2]-1,+m[1]));return d.getUTCFullYear()===+m[3]&&d.getUTCMonth()===+m[2]-1&&d.getUTCDate()===+m[1]?d.toISOString().slice(0,10):null}).filter(Boolean);
  const cvrMatch=text.match(/\b(?:CVR(?:-nummer|-nr\.)?\s*[:#]?\s*)(\d{2}[ .]?\d{2}[ .]?\d{2}[ .]?\d{2})\b/i);
  const money=[...text.matchAll(/(?:DKK|kr\.?|total|i alt|beløb)\s*[:\s]*([\d.]+,\d{2})\b/gi)].map(m=>Number(m[1].replace(/\./g,"").replace(",","."))).filter(Number.isFinite);
  const type=/\b(faktura|invoice|regning)\b/i.test(text)?"Faktura":/\b(kvittering|receipt)\b/i.test(text)?"Kvittering":"Andet";
  const category=/\b(vaskemaskine|opvaskemaskine|køleskab|tørretumbler|komfur)\b/i.test(text)?"Hvidevarer":/\b(vvs|elektriker|maler|tømrer|renovering|reparation)\b/i.test(text)?"Vedligeholdelse":"Andet";
  return {type,category,documentDate:dates[0]||null,amount:money.length?money[money.length-1]:null,cvr:cvrMatch?cvrMatch[1].replace(/\D/g,""):null,supplier:lines.find(l=>l.length>3&&!/^(faktura|kvittering|dato|cvr)/i.test(l))||null,warrantyEnd:null,requiresReview:true,source:"extracted-text"};
}
