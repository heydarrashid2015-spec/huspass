/** Client-side document text extraction. Files are not uploaded to OCR services by this module. */
export async function readDocumentText(file){
 if(!file)throw new Error("Vælg en fil først.");
 if(file.size>10*1024*1024)throw new Error("Filen må højst være 10 MB.");
 const type=file.type||"";
 if(type==="application/pdf"||/\.pdf$/i.test(file.name)){
  const pdfjs=await import("pdfjs-dist");
  const bytes=new Uint8Array(await file.arrayBuffer());
  const pdf=await pdfjs.getDocument({data:bytes,useSystemFonts:true,disableFontFace:true}).promise;
  try{
   if(pdf.numPages>30)throw new Error("PDF-filen har mere end 30 sider.");
   const pages=[];
   for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    pages.push(content.items.map(item=>item.str||"").join(" "));
    page.cleanup();
   }
   const text=pages.join("\n").trim();
   if(!text)throw new Error("PDF-filen indeholder ikke læsbar tekst. Scannede PDF-sider kræver billedgenkendelse.");
   return text.slice(0,100000);
  }finally{await pdf.destroy()}
 }
 if(type.startsWith("image/")||/\.(png|jpe?g|webp)$/i.test(file.name)){
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
