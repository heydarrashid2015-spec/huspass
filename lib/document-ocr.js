/** Client-side document text extraction. Files are not uploaded to OCR services by this module. */
export async function readDocumentText(file){
 if(!file)throw new Error("Vælg en fil først.");
 if(file.size>10*1024*1024)throw new Error("Filen må højst være 10 MB.");
 const type=(file.type||"").toLowerCase();
 const name=String(file.name||"").toLowerCase();
 const isPdf=/\.pdf$/.test(name)&&(type===""||type==="application/pdf");
 const isImage=/\.(png|jpe?g|webp)$/.test(name)&&(type===""||type==="image/png"||type==="image/jpeg"||type==="image/webp");
 if(!isPdf&&!isImage)throw new Error("Kun PDF, JPG, PNG og WebP understøttes.");
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
