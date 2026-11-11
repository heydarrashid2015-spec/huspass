/** Client-side document text extraction. Files are not uploaded to OCR services by this module. */
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
 const header=new Uint8Array(await file.slice(0,16).arrayBuffer());
 const signature=(...bytes)=>bytes.every((byte,i)=>header[i]===byte);
 const pdfSignature=signature(0x25,0x50,0x44,0x46,0x2d);
 const pngSignature=signature(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a);
 const jpegSignature=signature(0xff,0xd8,0xff);
 const webpSignature=signature(0x52,0x49,0x46,0x46)&&header[8]===0x57&&header[9]===0x45&&header[10]===0x42&&header[11]===0x50;
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
     let pageText=content.items.map(item=>item.str||"").join(" ").trim();
     if(pageText.length<20){
      if(pdf.numPages>10)throw new Error("Scannede PDF-filer må højst have 10 sider.");
      const {createWorker}=await import("tesseract.js");
      if(!ocrWorker)ocrWorker=await createWorker("dan+eng");
      const base=page.getViewport({scale:1});
      const scale=Math.min(1.5,Math.sqrt(3500000/(base.width*base.height)));
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
