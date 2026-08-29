import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type JsonRecord = Record<string, unknown>;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const FINGERPRINT_SECRET = Deno.env.get("GPI_EMAIL_FINGERPRINT_SECRET") || "";
const FINGERPRINT_KEY_VERSION = Number(Deno.env.get("GPI_EMAIL_FINGERPRINT_KEY_VERSION") || "1");
const ALLOWED_ORIGINS = (Deno.env.get("GPI_ALLOWED_ORIGINS") || "*").split(",").map((x)=>x.trim()).filter(Boolean);
const MAX_BODY_BYTES = 16 * 1024;
const MAX_ARRAY_ITEMS = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_PROCESS_OPTS = new Set(["background_check","orientation","application","membership"]);
const supabase = createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

function cors(req: Request): HeadersInit {
  const origin=req.headers.get("origin")||"";
  const allow=ALLOWED_ORIGINS.includes("*")?"*":ALLOWED_ORIGINS.includes(origin)?origin:ALLOWED_ORIGINS[0]||"*";
  return {"access-control-allow-origin":allow,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization, x-client-info, apikey, content-type","access-control-max-age":"86400","vary":"Origin"};
}
function reply(req:Request,status:number,body:JsonRecord){return new Response(JSON.stringify(body),{status,headers:{...cors(req),"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});}
function bad(message:string){const e=new Error(message);e.name="BadRequest";return e;}
function asObject(v:unknown):JsonRecord{return v&&typeof v==="object"&&!Array.isArray(v)?v as JsonRecord:{};}
function asString(v:unknown){return typeof v==="string"&&v.trim()?v.trim():null;}
function asUuid(v:unknown,name:string,required=true){const s=asString(v);if(!s){if(required)throw bad(`${name} is required.`);return null;}if(!UUID_RE.test(s))throw bad(`${name} must be a valid UUID.`);return s;}
function asUuidArray(v:unknown,name:string){if(v==null)return [];if(!Array.isArray(v))throw bad(`${name} must be an array.`);if(v.length>MAX_ARRAY_ITEMS)throw bad(`${name} contains too many items.`);return v.map((x,i)=>asUuid(x,`${name}[${i}]`,true) as string);}
function asTextArray(v:unknown,name:string){if(v==null)return [];if(!Array.isArray(v))throw bad(`${name} must be an array.`);if(v.length>MAX_ARRAY_ITEMS)throw bad(`${name} contains too many items.`);return v.map((x,i)=>{const s=asString(x);if(!s)throw bad(`${name}[${i}] must be a non-empty string.`);if(!VALID_PROCESS_OPTS.has(s))throw bad(`${name}[${i}] is not supported.`);return s;});}
function asBool(v:unknown,name:string){if(typeof v!=="boolean")throw bad(`${name} must be true or false.`);return v;}
function asOptionalBool(v:unknown,name:string){return v==null?false:asBool(v,name);}
function exactKeys(v:JsonRecord,allowed:string[],name:string){const permitted=new Set(allowed);if(Object.keys(v).some((key)=>!permitted.has(key)))throw bad(`${name} contains unsupported fields.`);}
async function jsonBody(req:Request){
  const contentType=req.headers.get("content-type")?.toLowerCase()||"";
  if(!contentType.startsWith("application/json"))throw bad("Send a JSON request.");
  const declaredLength=Number(req.headers.get("content-length")||"0");
  if(Number.isFinite(declaredLength)&&declaredLength>MAX_BODY_BYTES)throw bad("Request body is too large.");
  const text=await req.text();
  if(new TextEncoder().encode(text).byteLength>MAX_BODY_BYTES)throw bad("Request body is too large.");
  try{return JSON.parse(text);}catch{throw bad("Request body must contain valid JSON.");}
}
async function hmacHex(secret:string,value:string){const enc=new TextEncoder();const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,enc.encode(value));return Array.from(new Uint8Array(sig)).map((b)=>b.toString(16).padStart(2,"0")).join("");}
async function callRpc(name:string,args:JsonRecord){const {data,error}=await supabase.rpc(name,args);if(error){const e=new Error(error.message||"Database request failed.");e.name="RpcError";(e as any).code=error.code;(e as any).details=error.details;throw e;}return data;}

serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return reply(req,405,{ok:false,error:"Method not allowed."});
  try{
    if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY||!FINGERPRINT_SECRET||!Number.isInteger(FINGERPRINT_KEY_VERSION)||FINGERPRINT_KEY_VERSION<1)throw new Error("Authenticated GPI interest bridge is not configured.");
    const authHeader=req.headers.get("authorization")||"";
    const token=authHeader.toLowerCase().startsWith("bearer ")?authHeader.slice(7).trim():"";
    if(!token)throw bad("Sign in to track this request in FaithBid.");
    const {data:userData,error:userError}=await supabase.auth.getUser(token);
    const user=userData?.user;
    if(userError||!user?.id||!user.email)throw bad("Your FaithBid session could not be verified.");
    if(!user.email_confirmed_at)throw bad("Confirm your FaithBid email before sending tracked interest.");
    const body=asObject(await jsonBody(req));
    exactKeys(body,["action","payload"],"request body");
    if(asString(body.action)!=="submit_interest")throw bad("Unknown authenticated GPI action.");
    const payload=asObject(body.payload);
    exactKeys(payload,["opportunity_id","occurrence_id","consent_accepted","participant_requirement_ids","age_range_affirmed","process_opt_outs"],"payload");
    const normalizedEmail=user.email.trim().toLowerCase();
    const fingerprintHex=await hmacHex(FINGERPRINT_SECRET,normalizedEmail);
    const result=await callRpc("gpi_service_submit_connection_request_v2",{
      p_opportunity_id:asUuid(payload.opportunity_id,"opportunity_id"),
      p_occurrence_id:asUuid(payload.occurrence_id,"occurrence_id",false),
      p_normalized_email:normalizedEmail,
      p_email_fingerprint:`\\x${fingerprintHex}`,
      p_fingerprint_key_version:FINGERPRINT_KEY_VERSION,
      p_consent_accepted:asBool(payload.consent_accepted,"consent_accepted"),
      p_participant_requirement_ids:asUuidArray(payload.participant_requirement_ids,"participant_requirement_ids"),
      p_age_range_affirmed:asOptionalBool(payload.age_range_affirmed,"age_range_affirmed"),
      p_process_opt_outs:asTextArray(payload.process_opt_outs,"process_opt_outs"),
      p_seeker_profile_id:user.id,
    });
    return reply(req,200,{ok:true,data:result});
  }catch(error){const e=error as any;const status=e.name==="BadRequest"?400:e.name==="RpcError"?422:500;return reply(req,status,{ok:false,error:status===500?"Authenticated GPI interest bridge failed.":e.message,code:e.code||null,details:status===500?null:e.details||null});}
});
