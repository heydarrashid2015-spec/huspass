import test from "node:test";
import assert from "node:assert/strict";

/**
 * Read-only, opt-in RLS integration test against a real Supabase project.
 * Set SUPABASE_URL, SUPABASE_ANON_KEY, DOCUMENT_TEST_OWNER_JWT,
 * DOCUMENT_TEST_OTHER_JWT, DOCUMENT_TEST_ID, DOCUMENT_TEST_FILE_PATH.
 * The fixture must belong to the owner, not the other user.
 * Never use service_role credentials here.
 */
const keys=["SUPABASE_URL","SUPABASE_ANON_KEY","DOCUMENT_TEST_OWNER_JWT","DOCUMENT_TEST_OTHER_JWT","DOCUMENT_TEST_ID","DOCUMENT_TEST_FILE_PATH"];
const missing=keys.filter(key=>!process.env[key]);
if(process.env.DOCUMENT_REQUIRE_RLS==="1"&&missing.length)throw new Error(`Required Supabase RLS integration test cannot run: missing ${missing.join(", ")}. Configure dedicated test credentials; do not use service_role.`);
if(missing.length>0&&missing.length<keys.length)throw new Error(`Incomplete Supabase RLS test configuration: ${missing.join(", ")}`);
const integration=(name,fn)=>test(name,{skip:missing.length===keys.length?"Supabase integration credentials not configured":false},fn);
const env=process.env;

// Supabase project URLs may be configured with one or more trailing slashes.
// Normalize them before constructing Auth, REST, and Storage endpoints.
export function normalizeSupabaseUrl(url){return url.replace(/\/+$/,"");}
test("Supabase integration URLs normalize trailing slashes",()=>{
 assert.equal(normalizeSupabaseUrl("https://example.supabase.co///"),"https://example.supabase.co");
 assert.equal(normalizeSupabaseUrl("https://example.supabase.co"),"https://example.supabase.co");
});
function client(token){
 const base=normalizeSupabaseUrl(env.SUPABASE_URL);
 const headers={apikey:env.SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`};
 return {
  async identity(){
   const response=await fetch(`${base}/auth/v1/user`,{headers});
   assert.equal(response.status,200,"test JWT must authenticate successfully");
   const user=await response.json();
   assert.ok(user.id,"authenticated user must have a stable id");
   return user.id;
  },
  async row(){
   const url=new URL(`${base}/rest/v1/documents`);
   url.searchParams.set("id",`eq.${env.DOCUMENT_TEST_ID}`);
   url.searchParams.set("select","id,user_id,home_id,file_path");
   const response=await fetch(url,{headers});
   assert.equal(response.status,200,"documents SELECT must succeed without leaking unauthorized rows");
   return response.json();
  },
  async download(){
   // Direct private-object access must be denied even without a signed URL.
   const path=env.DOCUMENT_TEST_FILE_PATH.split("/").map(encodeURIComponent).join("/");
   const response=await fetch(`${base}/storage/v1/object/authenticated/home-documents/${path}`,{headers,redirect:"manual"});
   // Do not download or log the fixture bytes; only inspect access status.
   if(response.body)await response.body.cancel();
   return response.status;
  },
  async sign(){
   const path=env.DOCUMENT_TEST_FILE_PATH.split("/").map(encodeURIComponent).join("/");
   const response=await fetch(`${base}/storage/v1/object/sign/home-documents/${path}`,{
    method:"POST",headers:{...headers,"Content-Type":"application/json"},
    body:JSON.stringify({expiresIn:60})
   });
   const body=await response.json();
   return {response,body};
  }
 };
}

integration("Supabase documents RLS and private storage reject a second authenticated user",async()=>{
 assert.notEqual(env.DOCUMENT_TEST_OWNER_JWT,env.DOCUMENT_TEST_OTHER_JWT,"two distinct sessions required");
 const owner=client(env.DOCUMENT_TEST_OWNER_JWT);
 const other=client(env.DOCUMENT_TEST_OTHER_JWT);
 const [ownerId,otherId]=await Promise.all([owner.identity(),other.identity()]);
 assert.notEqual(ownerId,otherId,"JWTs must belong to distinct Supabase users, not just different sessions");
 const ownRows=await owner.row();
 assert.equal(ownRows[0]?.user_id,ownerId,"fixture owner must match authenticated owner JWT");
 assert.equal(ownRows.length,1,"fixture must be visible to its owner");
 assert.equal(ownRows[0].file_path,env.DOCUMENT_TEST_FILE_PATH,"fixture must match the stored object");
 const otherRows=await other.row();
 assert.deepEqual(otherRows,[],"other account must not read owner's document metadata");
 // A normal unfiltered document listing is a separate attack surface from
 // fetching a known document id: RLS must hide every victim-owned row.
 const allOtherUrl=new URL(`${normalizeSupabaseUrl(env.SUPABASE_URL)}/rest/v1/documents`);
 allOtherUrl.searchParams.set("select","id,user_id,home_id,file_path");
 const allOtherResponse=await fetch(allOtherUrl,{
  headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:`Bearer ${env.DOCUMENT_TEST_OTHER_JWT}`}
 });
 assert.equal(allOtherResponse.status,200,"other account listing must succeed with RLS filtering");
 const allOtherRows=await allOtherResponse.json();
 assert.ok(Array.isArray(allOtherRows),"document listing must be an array");
 assert.ok(!allOtherRows.some(row=>row.id===env.DOCUMENT_TEST_ID||row.file_path===env.DOCUMENT_TEST_FILE_PATH),
  "unfiltered listing must not expose the owner's fixture");

 // A list endpoint filtered by the victim's home_id must not leak documents,
 // even when an attacker knows the home identifier from another source.
 assert.ok(ownRows[0].home_id,"fixture must include the owner's home identifier");
 const victimHomeUrl=new URL(`${normalizeSupabaseUrl(env.SUPABASE_URL)}/rest/v1/documents`);
 victimHomeUrl.searchParams.set("home_id",`eq.${ownRows[0].home_id}`);
 victimHomeUrl.searchParams.set("select","id,user_id,home_id,file_path");
 const otherHomeResponse=await fetch(victimHomeUrl,{
  headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:`Bearer ${env.DOCUMENT_TEST_OTHER_JWT}`,"Prefer":"count=exact"}
 });
 assert.equal(otherHomeResponse.status,200,"other account home listing must be RLS-filtered");
 assert.deepEqual(await otherHomeResponse.json(),[],"other account must not enumerate victim home documents");
 assert.ok((otherHomeResponse.headers.get("content-range")||"").endsWith("/0"),"victim home document count must not leak");
 // Also verify that an unauthenticated caller cannot enumerate metadata or
 // access the private object. An anon API key is not a user session.
 const base=normalizeSupabaseUrl(env.SUPABASE_URL);
 const anonymousHeaders={apikey:env.SUPABASE_ANON_KEY,Authorization:`Bearer ${env.SUPABASE_ANON_KEY}`};
 const anonymousUrl=new URL(`${base}/rest/v1/documents`);
 anonymousUrl.searchParams.set("id",`eq.${env.DOCUMENT_TEST_ID}`);
 anonymousUrl.searchParams.set("select","id,user_id,home_id,file_path");
 const anonymousRowsResponse=await fetch(anonymousUrl,{headers:anonymousHeaders});
 assert.equal(anonymousRowsResponse.status,200,"anonymous documents SELECT should be RLS-filtered");
 assert.deepEqual(await anonymousRowsResponse.json(),[],"anonymous caller must not read document metadata");
 const encodedPath=env.DOCUMENT_TEST_FILE_PATH.split("/").map(encodeURIComponent).join("/");
 const anonymousObjectResponse=await fetch(`${base}/storage/v1/object/authenticated/home-documents/${encodedPath}`,{headers:anonymousHeaders,redirect:"manual"});
 if(anonymousObjectResponse.body)await anonymousObjectResponse.body.cancel();
 assert.ok([400,401,403,404].includes(anonymousObjectResponse.status),
  `anonymous caller must not download owner's private object (HTTP ${anonymousObjectResponse.status})`);
 // Anonymous access to signed URL creation is a distinct authorization path.
 const anonymousSignResponse=await fetch(`${base}/storage/v1/object/sign/home-documents/${encodedPath}`,{
  method:"POST",headers:{...anonymousHeaders,"Content-Type":"application/json"},
  body:JSON.stringify({expiresIn:60}),redirect:"manual"
 });
 const anonymousSignBody=await anonymousSignResponse.json().catch(()=>({}));
 assert.ok([400,401,403,404].includes(anonymousSignResponse.status),
  `anonymous caller must not sign owner's private object (HTTP ${anonymousSignResponse.status})`);
 assert.ok(!anonymousSignBody.signedURL&&!anonymousSignBody.signedUrl,
  "anonymous caller must not receive a signed URL");
 const ownerDownloadStatus=await owner.download();
 assert.equal(ownerDownloadStatus,200,"owner must be able to read their private object directly");
 const otherDownloadStatus=await other.download();
 assert.ok([400,401,403,404].includes(otherDownloadStatus),
  `other account must not download owner's private object (HTTP ${otherDownloadStatus})`);
 const ownSign=await owner.sign();
 assert.equal(ownSign.response.status,200,"owner must be able to sign their own private object");
 assert.ok(ownSign.body.signedURL||ownSign.body.signedUrl,"owner must receive signed URL");
 const otherSign=await other.sign();
 assert.ok(otherSign.response.status===400||otherSign.response.status===401||otherSign.response.status===403||otherSign.response.status===404,
  `other account must not sign owner's object (HTTP ${otherSign.response.status})`);
 assert.ok(!otherSign.body.signedURL&&!otherSign.body.signedUrl,"other account must not receive a signed URL");
});
