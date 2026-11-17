/** Client-side document text extraction. Files are not uploaded to OCR services by this module. */
export function extractPdfPageText(items){
 let text="";
 for(const item of items){
  const fragment=String(item.str||"").trim();
  // PDF.js sometimes splits one amount into multiple glyph runs. Preserve
  // decimal/thousands punctuation while retaining word separators.
  const cvrContinuation=/\bCVR(?:-nr\.?)?\s*:?\s*\d{4}$/.test(text.split("\n").at(-1)||"")&&/^\d{4}(?:\D|$)/.test(fragment);
  const numericContinuation=!text.endsWith("\n")&&(cvrContinuation||/(?:\d[.,]|\d)$/.test(text)&&(/[,]$/.test(text)&&/^\d{2}(?:\D|$)/.test(fragment)||/^[,]\d{2}(?:\D|$)/.test(fragment)||/[.]$/.test(text)&&/^\d{3}(?:[, .]|$)/.test(fragment)||/\d$/.test(text)&&/^\d{2},\d{2}$/.test(fragment)));
  if(fragment)text+=(text&&!text.endsWith("\n")&&!numericContinuation?" ":"")+fragment;
  if(item.hasEOL&&text&&!text.endsWith("\n"))text+="\n";
 }
 return text.trim();
}

export function safePdfRasterScale(width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||width>100000||height>100000)throw new Error("Ugyldige PDF-side dimensioner.");
 const scale=Math.min(1.5,8192/width,8192/height,Math.sqrt(3400000/(width*height)));
 if(!Number.isFinite(scale)||scale<=0)throw new Error("Ugyldige PDF-side dimensioner.");
 return scale;
}

/** A short PDF text layer can be a scanner watermark rather than invoice content. */
export function needsPdfPageOcr(text){
 const value=String(text||"").trim();
 if(value.length<20)return true;
 // Preserve text-only pages with substantive content; re-scan short pages
 // containing just scanner metadata or other non-document text.
 const scannerOnly=/^(?:(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))[^\n]{0,100}\s*)(?:(?:https?:\/\/[^\s]+)\s*)?$/i.test(value);
 const scannerMetadataOnly=/^(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))/i.test(value)&&value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).every(line=>/^(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))\b/i.test(line.trim())||/^(?:https?:\/\/\S+|page\s+\d+|side\s+\d+|dato\s*:\s*\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4})$/i.test(line.trim()));
 // A scanner watermark plus a bare document heading is not a usable text layer.
 const scannerHeadingOnly=/^(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))/i.test(value)&&value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).every(line=>/^(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))\b|^(?:faktura|invoice|kvittering|receipt)\s*$|^(?:page|side)\s+\d+\b/i.test(line));
 const scannerHeadingAndDateOnly=/^(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))/i.test(value)&&value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).every(line=>/^(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))\b|^(?:faktura|invoice|kvittering|receipt)\s*$|^(?:page|side)\s+\d+\b|^(?:dato|date)\s*:\s*\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}$/i.test(line));
 // Scanner footers can follow a heading rather than precede it. Only trigger
 // OCR when every line is scanner metadata, a bare heading, or pagination.
 const scannerFooterOnly=/\b(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))\b/i.test(value)&&value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).every(line=>/^(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))\b|^(?:faktura|invoice|kvittering|receipt)\s*$|^(?:page|side)\s+\d+\b|^(?:dato|date)\s*:\s*\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}$|^https?:\/\/\S+$/i.test(line));
 const scannerInvoiceNumberOnly=/\b(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))\b/i.test(value)&&value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).every(line=>/^(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))\b|^(?:faktura|invoice|kvittering|receipt)\s*$|^(?:page|side)\s+\d+\b|^(?:dato|date)\s*:\s*\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}$|^(?:faktura(?:nr\.?|nummer)?|invoice\s*(?:no\.?|number|#))\s*[:#]?\s*[\w-]+$|^https?:\/\/\S+$/i.test(line));
 // Some scanner text layers contain a vendor and date but omit the scanned
 // line items and total. OCR those pages rather than trusting partial metadata.
 const scannerWithMissingFinancialData=/\b(?:scanned (?:with|by|on|at)|created (?:with|by)|generated (?:with|by))\b/i.test(value)
  &&/\b(?:faktura|invoice|kvittering|receipt)\b/i.test(value)
  // A bare "Moms" column heading does not prove the scanned amounts were extracted.
  &&!/\b(?:total|i\s+alt|at\s+betale|beløb\s+at\s+betale|moms)\s*[:=]?\s*\d|\b\d[\d., ]*\s*(?:dkk|kr\.?)\b/i.test(value)
  &&value.length<500;
 // Some scanned invoices expose only a heading, date, CVR and page number
 // in the PDF text layer, without a scanner watermark. Rasterize these
 // metadata-only pages so line items and amounts are not silently missed.
 const metadataOnlyInvoice=/^(?:faktura|invoice|kvittering|receipt)\s*$/i.test(value.split(/\r?\n/)[0]?.trim()||"")
  &&value.length<250
  &&value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).every(line=>/^(?:faktura|invoice|kvittering|receipt)\s*$|^(?:dato|date|fakturadato|købsdato|kvitteringsdato)\s*:?\s*\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}$|^CVR(?:-nr\.?|-nummer)?\s*:?\s*\d{2}(?:[ .]?\d{2}){3}$|^(?:side|page)\s+\d+$|^(?:faktura(?:nr\.?|nummer)?|invoice\s*(?:no\.?|number|#))\s*[:#]?\s*[\w-]+$/i.test(line));
 // Supplier names in short metadata-only PDF layers must not suppress OCR.
 // Require an invoice heading, date and CVR, and no financial amount labels.
 const supplierMetadataOnly=/^(?:faktura|invoice|kvittering|receipt)\s*$/i.test(value.split(/\r?\n/)[0]?.trim()||"")
  &&value.length<250
  &&/\bCVR(?:-nr\.?|-nummer)?\s*:?\s*\d{2}(?:[ .]?\d{2}){3}\b/i.test(value)
  &&(/\b(?:dato|date|fakturadato|købsdato|kvitteringsdato)\s*:?\s*\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}\b/i.test(value)
    ||/\b(?:faktura(?:nr\.?|nummer)?|invoice\s*(?:no\.?|number|#))\s*[:#]?\s*[\w-]+\b/i.test(value))
  &&! /\b(?:total|i\s+alt|at\s+betale|beløb\s+at\s+betale|moms)\s*[:=]?\s*\d|\b\d[\d., ]*\s*(?:dkk|kr\.?)\b/i.test(value);
 return supplierMetadataOnly||metadataOnlyInvoice||scannerWithMissingFinancialData||scannerInvoiceNumberOnly||scannerFooterOnly||scannerOnly||scannerMetadataOnly||scannerHeadingOnly||scannerHeadingAndDateOnly||value.length<100&&!/\b(?:faktura|invoice|kvittering|receipt|total|beløb|cvr|garanti|dato|kr\.?|dkk)\b/i.test(value);
}

/** Reject oversized JPEG bitmaps before handing compressed input to OCR. */
export function readJpegDimensions(bytes){
 if(bytes.length<4||bytes[0]!==0xff||bytes[1]!==0xd8)throw new Error("Ugyldige JPEG-dimensioner.");
 let offset=2;
 while(offset+3<bytes.length){
  if(bytes[offset++]!==0xff)break;
  while(bytes[offset]===0xff)offset++;
  const marker=bytes[offset++];
  if(marker===0xd9||marker===0xda)break;
  if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
  if(offset+2>bytes.length)break;
  const length=(bytes[offset]<<8)|bytes[offset+1];
  if(length<2||offset+length>bytes.length)break;
  if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
   if(length<7)break;
   const height=(bytes[offset+3]<<8)|bytes[offset+4];
   const width=(bytes[offset+5]<<8)|bytes[offset+6];
   if(width>0&&height>0&&width<=16384&&height<=16384&&width*height<=25000000)return {width,height};
   break;
  }
  offset+=length;
 }
 throw new Error("Ugyldige JPEG-dimensioner.");
}

export async function readDocumentText(file){
 if(!file)throw new Error("Vælg en fil først.");
 if(!Number.isFinite(file.size)||file.size<=0)throw new Error("Filen er tom eller ugyldig.");
 if(file.size>10*1024*1024)throw new Error("Filen må højst være 10 MB.");
 const type=(file.type||"").toLowerCase();
 const name=String(file.name||"").toLowerCase();
 const isPdf=/\.pdf$/.test(name)&&(type===""||type==="application/pdf");
 const imageMime=name.endsWith(".png")?"image/png":/\.jpe?g$/.test(name)?"image/jpeg":name.endsWith(".webp")?"image/webp":null;
 const isImage=!!imageMime&&(type===""||type===imageMime);
 if(!isPdf&&!isImage)throw new Error("Kun PDF, JPG, PNG og WebP understøttes.");
 // MIME and extension are user-controlled. Validate the file signature before invoking parsers.
 if(typeof file.slice!=="function")throw new Error("Ugyldig fil.");
 const header=new Uint8Array(await file.slice(0,30).arrayBuffer());
 const signature=(...bytes)=>bytes.every((byte,i)=>header[i]===byte);
 const pdfSignature=signature(0x25,0x50,0x44,0x46,0x2d);
 const pngWidth=header.length>=24?header[16]*16777216+header[17]*65536+header[18]*256+header[19]:0;
 const pngHeight=header.length>=24?header[20]*16777216+header[21]*65536+header[22]*256+header[23]:0;
 const pngSignature=file.size>=33&&pngWidth>0&&pngHeight>0&&pngWidth<=16384&&pngHeight<=16384&&pngWidth*pngHeight<=25000000&&signature(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a)&&header[8]===0&&header[9]===0&&header[10]===0&&header[11]===13&&header[12]===73&&header[13]===72&&header[14]===68&&header[15]===82;
 // JPEG files must end with EOI; a valid SOI alone can describe a truncated upload.
 const jpegTail=isImage&&imageMime==="image/jpeg"&&file.size>=4?new Uint8Array(await file.slice(-2).arrayBuffer()):null;
 const jpegSignature=file.size>=4&&signature(0xff,0xd8,0xff)&&jpegTail?.length===2&&jpegTail[0]===0xff&&jpegTail[1]===0xd9;
 if(isImage&&imageMime==="image/jpeg"&&jpegSignature){
  // JPEG dimensions are stored in a SOF segment, not necessarily at a fixed offset.
  readJpegDimensions(new Uint8Array(await file.slice(0,Math.min(file.size,65536)).arrayBuffer()));
 }
 const riffSize=header.length>=12?(header[4]+header[5]*256+header[6]*65536+header[7]*16777216):0;
 const webpChunkSize=header.length>=20?(header[16]+header[17]*256+header[18]*65536+header[19]*16777216):0;
 const webpTag=String.fromCharCode(...header.slice(12,16));
 const vp8xWidth=header.length>=30?1+header[24]+header[25]*256+header[26]*65536:0;
 const vp8xHeight=header.length>=30?1+header[27]+header[28]*256+header[29]*65536:0;
 const vp8xSafe=webpTag!=="VP8X"||(header.length>=30&&vp8xWidth>0&&vp8xHeight>0&&vp8xWidth<=16384&&vp8xHeight<=16384&&vp8xWidth*vp8xHeight<=25000000);
 // VP8 and VP8L also carry decoded dimensions; checking only VP8X leaves
 // compressed images capable of allocating unexpectedly large OCR bitmaps.
 const vp8Width=header.length>=30?(header[26]|(header[27]<<8))&0x3fff:0;
 const vp8Height=header.length>=30?(header[28]|(header[29]<<8))&0x3fff:0;
 const vp8Valid=header.length>=30&&header[23]===0x9d&&header[24]===0x01&&header[25]===0x2a&&vp8Width>0&&vp8Height>0&&vp8Width*vp8Height<=25000000;
 const vp8lWidth=header.length>=25?1+header[21]+((header[22]&0x3f)<<8):0;
 const vp8lHeight=header.length>=25?1+(header[22]>>6)+(header[23]<<2)+((header[24]&0x0f)<<10):0;
 const vp8lValid=header.length>=25&&header[20]===0x2f&&vp8lWidth>0&&vp8lHeight>0&&vp8lWidth*vp8lHeight<=25000000;
 const webpDimensionsSafe=webpTag==="VP8X"?vp8xSafe:webpTag==="VP8 "?vp8Valid:webpTag==="VP8L"?vp8lValid:false;
 const webpChunkLengthValid=(webpTag==="VP8X"&&webpChunkSize>=10)||(webpTag==="VP8 "&&webpChunkSize>=10)||(webpTag==="VP8L"&&webpChunkSize>=5);
 const webpSignature=webpChunkLengthValid&&webpDimensionsSafe&&file.size>=21&&riffSize>=13&&webpChunkSize>0&&webpChunkSize+20<=file.size&&riffSize+8===file.size&&signature(0x52,0x49,0x46,0x46)&&header[8]===0x57&&header[9]===0x45&&header[10]===0x42&&header[11]===0x50&&(["VP8 ","VP8L","VP8X"].includes(String.fromCharCode(...header.slice(12,16))));
 if(!(isPdf&&pdfSignature)&&!(isImage&&((imageMime==="image/png"&&pngSignature)||(imageMime==="image/jpeg"&&jpegSignature)||(imageMime==="image/webp"&&webpSignature))))throw new Error("Filens indhold matcher ikke filtypen.");
 if(isPdf){
  const pdfjs=await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
  const bytes=new Uint8Array(await file.arrayBuffer());
  const pdf=await pdfjs.getDocument({data:bytes,useSystemFonts:true,disableFontFace:true}).promise;
  let ocrWorker=null;
  try{
   if(pdf.numPages>30)throw new Error("PDF-filen har mere end 30 sider.");
   const pages=[];
   for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    try{
     const content=await page.getTextContent();
     let pageText=extractPdfPageText(content.items);
     if(needsPdfPageOcr(pageText)){
      if(pdf.numPages>10)throw new Error("Scannede PDF-filer må højst have 10 sider.");
      const {createWorker}=await import("tesseract.js");
      if(!ocrWorker)ocrWorker=await createWorker("dan+eng");
      const base=page.getViewport({scale:1});
      const scale=safePdfRasterScale(base.width,base.height);
      const viewport=page.getViewport({scale});
      const canvas=document.createElement("canvas");
      canvas.width=Math.ceil(viewport.width);
      canvas.height=Math.ceil(viewport.height);
      try{
       const context=canvas.getContext("2d");
       if(!context)throw new Error("Kan ikke oprette billedflade til PDF.");
       await page.render({canvasContext:context,canvas,viewport}).promise;
       const result=await ocrWorker.recognize(canvas);
       pageText=String(result.data.text||"").trim();
      }finally{canvas.width=0;canvas.height=0}
     }
     pages.push(pageText);
    }finally{page.cleanup()}
   }
   const text=pages.join("\n").trim();
   if(!text)throw new Error("Ingen læsbar tekst fundet i PDF-filen.");
   return text.slice(0,100000);
  }finally{
   if(ocrWorker)await ocrWorker.terminate();
   await pdf.destroy();
  }
 }
 if(isImage){
  const {createWorker}=await import("tesseract.js");
  const worker=await createWorker("dan+eng");
  try{
   const result=await worker.recognize(file);
   const text=String(result.data.text||"").trim();
   if(!text)throw new Error("Ingen læsbar tekst fundet i billedet.");
   return text.slice(0,100000);
  }finally{await worker.terminate()}
 }
 throw new Error("Kun PDF, JPG, PNG og WebP understøttes.");
}
