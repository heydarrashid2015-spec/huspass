export default function sitemap(){
  const base="https://huspass.dk";
  return [
    {url:base,lastModified:new Date(),changeFrequency:"weekly",priority:1},
    {url:`${base}/privatliv`,lastModified:new Date(),changeFrequency:"monthly",priority:.4},
    {url:`${base}/vilkaar`,lastModified:new Date(),changeFrequency:"monthly",priority:.4}
  ];
}
