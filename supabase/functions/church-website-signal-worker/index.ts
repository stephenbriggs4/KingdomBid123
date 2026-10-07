import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const CRON_SECRET = Deno.env.get("CHURCH_INTEL_CRON_SECRET") || "";
const OPENAI_MODEL = Deno.env.get("CHURCH_INTEL_SIGNAL_MODEL") || "gpt-4o-mini";
const USER_AGENT = "FaithBidChurchIntelBot/1.0 (+mailto:support@faithbid.com)";
const MAX_TARGETS = 10;
const MAX_PAGES = 5;
const MAX_PAGE_CHARS = 180_000;
const MAX_CLASSIFIER_CHARS = 120_000;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const encoder = new TextEncoder();

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index++) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}
function publicHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.match(/^https?:\/\//i) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || ["0.0.0.0", "127.0.0.1", "::1"].includes(host)) return null;
    if (/^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return null;
    return url;
  } catch { return null; }
}
async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}
async function fetchText(url: URL) {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "text/html,text/plain;q=0.9,*/*;q=0.1" }, redirect: "follow", signal: AbortSignal.timeout(12_000) });
  const type = response.headers.get("content-type") || "";
  if (!response.ok || (!type.includes("text/html") && !type.includes("text/plain"))) return { response, text: "" };
  return { response, text: (await response.text()).slice(0, MAX_PAGE_CHARS) };
}
function robotsAllows(raw: string, pathname: string) {
  const groups: Array<{ agents: string[]; rules: Array<{ allow: boolean; path: string }> }> = [];
  let group: { agents: string[]; rules: Array<{ allow: boolean; path: string }> } | null = null;
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line.includes(":")) continue;
    const [field, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (field.trim().toLowerCase() === "user-agent") {
      if (!group || group.rules.length) { group = { agents: [], rules: [] }; groups.push(group); }
      group.agents.push(value.toLowerCase());
    } else if (group && ["allow", "disallow"].includes(field.trim().toLowerCase()) && value) {
      group.rules.push({ allow: field.trim().toLowerCase() === "allow", path: value });
    }
  }
  const bot = USER_AGENT.split("/")[0].toLowerCase();
  const matching = groups.filter(item => item.agents.some(agent => agent === "*" || bot.includes(agent))).flatMap(item => item.rules)
    .filter(rule => pathname.startsWith(rule.path)).sort((a, b) => b.path.length - a.path.length);
  return matching[0]?.allow ?? true;
}
function visibleText(html: string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/\s+/g, " ").trim();
}
function relevantLinks(html: string, base: URL) {
  const candidates: URL[] = [];
  const pattern = /href\s*=\s*["']([^"'#]+)["']/gi;
  const interest = /(job|career|employment|opening|build|renovat|capital|campaign|campus|relocat|project|facilit)/i;
  for (const match of html.matchAll(pattern)) {
    try {
      const url = new URL(match[1], base);
      if (url.origin !== base.origin || !interest.test(`${url.pathname} ${match[1]}`)) continue;
      url.hash = "";
      if (!candidates.some(item => item.href === url.href)) candidates.push(url);
    } catch { /* malformed link */ }
  }
  return candidates.slice(0, MAX_PAGES - 1);
}
function outputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  for (const item of (Array.isArray(payload.output) ? payload.output : []) as Array<Record<string, unknown>>) {
    for (const part of (Array.isArray(item.content) ? item.content : []) as Array<Record<string, unknown>>) if (typeof part.text === "string") return part.text;
  }
  return "";
}
async function classify(name: string, pages: Array<{ url: string; text: string }>) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", headers: { authorization: `Bearer ${OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ model: OPENAI_MODEL, input: [
      { role: "system", content: "Classify current operational signals on a church's own website. Include only explicit job or staff openings, renovation or construction work, capital campaigns tied to physical work, new campuses, relocations, or explicit physical help or projects. Exclude leadership biographies, ordinary events, sermons, ministries, historical projects, generic giving, and general news. Evidence quotes must be verbatim short excerpts from the supplied page. If evidence is ambiguous, return no signal." },
      { role: "user", content: `Church: ${name}\n\n${pages.map(page => `SOURCE URL: ${page.url}\n${page.text}`).join("\n\n---\n\n").slice(0, MAX_CLASSIFIER_CHARS)}` },
    ], text: { format: { type: "json_schema", name: "church_operational_signals", strict: true, schema: {
      type: "object", additionalProperties: false, required: ["signals"], properties: { signals: { type: "array", maxItems: 12, items: {
        type: "object", additionalProperties: false, required: ["signal_type","title","summary","evidence_quote","source_url","confidence_score"], properties: {
          signal_type: { type: "string", enum: ["job_opening","renovation","capital_campaign","new_campus","relocation","physical_project"] },
          title: { type: "string", minLength: 2, maxLength: 240 }, summary: { type: "string", minLength: 2, maxLength: 2000 },
          evidence_quote: { type: "string", minLength: 2, maxLength: 1000 }, source_url: { type: "string" }, confidence_score: { type: "number", minimum: 0, maximum: 1 }
        }
      } } }
    } } } }), signal: AbortSignal.timeout(30_000)
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`classifier ${response.status}: ${JSON.stringify(body).slice(0, 400)}`);
  const text = outputText(body);
  if (!text) throw new Error("classifier returned no structured output");
  const parsed = JSON.parse(text);
  const allowedUrls = new Set(pages.map(page => page.url));
  const signals = (Array.isArray(parsed.signals) ? parsed.signals : []).filter((item: Record<string, unknown>) => allowedUrls.has(String(item.source_url)))
    .map((item: Record<string, unknown>) => ({ ...item, detected_at: new Date().toISOString() }));
  return { signals, responseId: String(body.id || "") };
}
async function record(args: Record<string, unknown>) {
  const { error } = await admin.rpc("church_record_website_scan", args);
  if (error) throw error;
}
async function processTarget(target: Record<string, unknown>) {
  const start = publicHttpUrl(String(target.canonical_website || ""));
  if (!start) throw new Error("invalid or non-public canonical website URL");
  let robots = "";
  try { robots = (await fetchText(new URL("/robots.txt", start))).text; } catch { robots = ""; }
  if (robots && !robotsAllows(robots, start.pathname || "/")) {
    await record({ p_organization_id: target.organization_id, p_canonical_url: start.href, p_content_hash: null, p_outcome: "robots_blocked", p_pages_fetched: 0, p_http_status: null, p_classifier_model: null, p_classifier_run_id: null, p_error_detail: "robots.txt disallows this path", p_signals: [] });
    return "robots_blocked";
  }
  const first = await fetchText(start);
  if (!first.text) {
    await record({ p_organization_id: target.organization_id, p_canonical_url: start.href, p_content_hash: null, p_outcome: "fetch_failed", p_pages_fetched: 1, p_http_status: first.response.status, p_classifier_model: null, p_classifier_run_id: null, p_error_detail: "Homepage unavailable or not HTML/text", p_signals: [] });
    return "fetch_failed";
  }
  const effective = new URL(first.response.url);
  const pages = [{ url: effective.href, text: visibleText(first.text) }];
  for (const link of relevantLinks(first.text, effective)) {
    if (robots && !robotsAllows(robots, link.pathname)) continue;
    try { const fetched = await fetchText(link); if (fetched.text) pages.push({ url: fetched.response.url, text: visibleText(fetched.text) }); } catch { /* secondary page failure */ }
  }
  const contentHash = await sha256Hex(pages.map(page => `${page.url}\n${page.text}`).join("\n\n"));
  if (contentHash === target.last_content_hash) {
    await record({ p_organization_id: target.organization_id, p_canonical_url: effective.href, p_content_hash: contentHash, p_outcome: "unchanged", p_pages_fetched: pages.length, p_http_status: first.response.status, p_classifier_model: null, p_classifier_run_id: null, p_error_detail: null, p_signals: [] });
    return "unchanged";
  }
  try {
    const result = await classify(String(target.canonical_name || "Church"), pages);
    await record({ p_organization_id: target.organization_id, p_canonical_url: effective.href, p_content_hash: contentHash, p_outcome: result.signals.length ? "classified" : "no_relevant_content", p_pages_fetched: pages.length, p_http_status: first.response.status, p_classifier_model: OPENAI_MODEL, p_classifier_run_id: result.responseId, p_error_detail: null, p_signals: result.signals });
    return result.signals.length ? "classified" : "no_relevant_content";
  } catch (error) {
    await record({ p_organization_id: target.organization_id, p_canonical_url: effective.href, p_content_hash: contentHash, p_outcome: "classifier_failed", p_pages_fetched: pages.length, p_http_status: first.response.status, p_classifier_model: OPENAI_MODEL, p_classifier_run_id: null, p_error_detail: String(error?.message || error), p_signals: [] });
    return "classifier_failed";
  }
}

serve(async request => {
  if (request.method !== "POST") return json(405, { error: "POST required" });
  const supplied = request.headers.get("x-cron-secret") || "";
  if (!CRON_SECRET || !safeEqual(supplied, CRON_SECRET)) return json(401, { error: "unauthorized" });
  const { data, error } = await admin.rpc("church_signal_worker_targets", { p_limit: MAX_TARGETS });
  if (error) return json(500, { error: error.message });
  const targets = Array.isArray(data) ? data : [];
  const results = [];
  for (const target of targets) {
    try { results.push({ organization_id: target.organization_id, outcome: await processTarget(target) }); }
    catch (err) { results.push({ organization_id: target.organization_id, outcome: "worker_error", error: String(err?.message || err).slice(0, 300) }); }
  }
  return json(200, { ok: true, configured: Boolean(OPENAI_API_KEY), processed: results.length, results });
});
