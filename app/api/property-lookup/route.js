import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function POST(request){
 try{
  const authorization=request.headers.get("authorization")||"";
  if(!/^Bearer\\s+\\S+$/.test(authorization))return NextResponse.json({error:"Log ind for at fortsætte."},{status:401});
  const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://kmnsxsctgpsaroipomlt.supabase.co",process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"sb_publishable_DKoZCEePERooCwKysgH5Cw_JVOqrqsO",{global:{headers:{Authorization:authorization}}});
  const {data:{user},error}=await supabase.auth.getUser(authorization.replace(/^Bearer\\s+/,""));
  if(error||!user)return NextResponse.json({error:"Ugyldig session."},{status:401});
  const {data:allowed,error:accessError}=await supabase.rpc("huspass_ai_access");
  if(accessError||allowed!==true)return NextResponse.json({error:"Funktionen er ikke tilgængelig for denne konto."},{status:403});
  const body=await request.json();
  const address=String(body?.address||"").trim().slice(0,180);
  if(address.length<6)return NextResponse.json({error:"En fuld adresse er nødvendig."},{status:400});
  // Never guess a BFE match or valuation from an address string.
  // Register integrations must be configured and licensed before official figures can be returned.
  return NextResponse.json({status:"sources_not_connected",address,propertyValue:null,landValue:null,marketValue:null,source:null,message:"Automatisk opslag af offentlige ejendoms- og grundvurderinger er endnu ikke tilsluttet. Ingen værdi er beregnet."},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Opslaget kunne ikke gennemføres."},{status:400});}
}
