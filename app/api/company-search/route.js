import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
const PROJECT_URL="https://kmnsxsctgpsaroipomlt.supabase.co";
const PUBLIC_KEY="sb_publishable_DKoZCEePERooCwKysgH5Cw_JVOqrqsO";
const allowedHosts=new Set(["dk","com","eu"]);
export async function POST(request){
  const auth=request.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer "))return Response.json({error:"Login kræves"},{status:401});
  const client=createClient(PROJECT_URL,PUBLIC_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=auth.slice(7);
  const {data:{user},error}=await client.auth.getUser(token);
  if(error||!user)return Response.json({error:"Ugyldig session"},{status:401});
  const {data:allowed,error:accessError}=await client.rpc("huspass_ai_access",{},{global:{headers:{Authorization:"Bearer "+token}}});
  // Re-check access with a session-bound client, never trust a user-supplied owner flag.
  const scoped=createClient(PROJECT_URL,PUBLIC_KEY,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
  const access=await scoped.rpc("huspass_ai_access");
  if(access.error||access.data!==true)return Response.json({error:"Adgang nægtet"},{status:403});
  const body=await request.json().catch(()=>({}));
  const description=typeof body.description==="string"?body.description.trim().slice(0,500):"";
  const city=typeof body.city==="string"?body.city.trim().slice(0,80):"";
  const postal=typeof body.postal==="string"?body.postal.replace(/[^0-9]/g,"").slice(0,4):"";
  if(description.length<8)return Response.json({error:"Beskriv projektet først"},{status:400});
  if(!process.env.BRAVE_SEARCH_API_KEY)return Response.json({error:"Søgning er ikke konfigureret endnu"},{status:503});
  const query=[description,postal,city,"håndværker firma Danmark"].filter(Boolean).join(" ");
  const url=new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q",query);url.searchParams.set("count","12");url.searchParams.set("country","dk");url.searchParams.set("search_lang","da");
  try{
    const response=await fetch(url,{headers:{"Accept":"application/json","X-Subscription-Token":process.env.BRAVE_SEARCH_API_KEY},cache:"no-store",signal:AbortSignal.timeout(9000)});
    if(!response.ok)return Response.json({error:"Søgetjenesten er midlertidigt utilgængelig"},{status:502});
    const json=await response.json();
    const results=(json.web?.results||[]).filter(x=>{try{const u=new URL(x.url);return u.protocol==="https:"&&!/(google|facebook|instagram|linkedin|youtube|trustpilot|reddit|krak|degulesider)/i.test(u.hostname)}catch{return false}}).slice(0,3).map(x=>({title:String(x.title||"Virksomhed").slice(0,140),url:x.url,description:String(x.description||"").slice(0,350)}));
    return Response.json({results,verified:false,note:"Søgeresultater, ikke verificerede virksomheder eller pristilbud"},{headers:{"Cache-Control":"no-store"}});
  }catch{return Response.json({error:"Søgningen kunne ikke gennemføres"},{status:502})}
}
