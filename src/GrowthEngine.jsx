import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

const GROWTH_FALLBACK_APP_URL = "https://faithbid.com";
const getAppUrl = () => {
  if (typeof window === "undefined") return GROWTH_FALLBACK_APP_URL;
  const origin = window.location?.origin || "";
  return origin.startsWith("http") ? origin : GROWTH_FALLBACK_APP_URL;
};

function useDebounce(value, delay = 180) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/* ─────────────────────────────────────────────────────────────────────────────
   GROWTH ENGINE — lazy-loaded admin workspace
   Extracted verbatim from App.jsx so the public bundle does not eagerly include
   admin growth tooling. Backend tables/RPCs remain unchanged.
   Backend tables/RPCs remain unchanged.
───────────────────────────────────────────────────────────────────────────── */
const KBGE_PLATFORM_ORDER = ["All", "Facebook", "Instagram", "LinkedIn", "Reddit", "Directory", "Other"];
const KBGE_AUDIENCE_ORDER = ["All", "Vendor", "Church / Ministry", "Both", "Community / Reach"];
const KBGE_INSTAGRAM_TYPE_ORDER = ["All Instagram", "Joinable Communities", "Partner Pages"];
// 872b (Growth Engine cleanup patch): lets the user narrow the working view
// to stronger-reach groups without ever deleting or hiding smaller groups
// from Supabase. Defaults to "All" (value 0) — see loadGroups/minReach
// state below for why: defaulting this higher would silently hide most of
// the Community/Reach batch on first load with no visible explanation.
const KBGE_MIN_REACH_OPTIONS = [
  { label: "All", value: 0 },
  { label: "10K+", value: 10000 },
  { label: "25K+", value: 25000 },
  { label: "50K+", value: 50000 },
  { label: "100K+", value: 100000 },
  { label: "500K+", value: 500000 },
  { label: "1M+", value: 1000000 },
];
const KBGE_PAGE_SIZE_OPTIONS = [20, 50, 100];

// Community rows have a visible route into a real conversation. Partner-page
// rows are outreach prospects; followers cannot publish to those accounts.
const KBGE_INSTAGRAM_JOINABLE = [
  ["christianwomenusa",676976,"WhatsApp","https://chat.whatsapp.com/KxMQsHrjktT3a7t0RwUJ0x","Public WhatsApp invite in bio; US/Canada Christian women. Check rules before sharing FaithBid."],
  ["usa.biblestudy",279439,"WhatsApp","https://chat.whatsapp.com/ESsbsjGdBgYGZRsqoBQ5ko","Public WhatsApp invite plus DM enrollment for a free online Bible study."],
  ["daily.prayers.us",195498,"WhatsApp","https://chat.whatsapp.com/LWlx4yGnu52Bp46x2Esh0U","Public prayer/Bible-study WhatsApp invite across the US, Canada and UK; verify promotion rules."],
  ["jesus",1929792,"Discord","https://discord.gg/jesus","Official Discord advertised by the account; Bible studies, prayer nights and moderated chats."],
  ["momsinprayer",35569,"Find a group","https://www.instagram.com/momsinprayer/","Verified prayer nonprofit with a Join a group near you path; local approval required."],
  ["online_bible_study_obs",2218,"Form","https://www.instagram.com/online_bible_study_obs/","Online Bible-study enrollment through the profile; confirm schedule and sharing rules."],
  ["prayerwarriorsglobal_",5353,"Live service","https://www.instagram.com/prayerwarriorsglobal_/","Prayer community with Tuesday/Thursday 10 PM ET services; ask before promoting."],
  ["prayandchat",128,"Zoom","https://us06web.zoom.us/meeting/register/tZYtcOqgqj4iE93dsCv-x6a6Tuj8E5FHDl15","Prayer line and life group with public Zoom registration; small but directly conversational."],
  ["online__bible_study_for_all",93,"WhatsApp","https://chat.whatsapp.com/GYy9W4WFBpQLxQTJhFKM9Y","Public WhatsApp Bible-study invite; verify US relevance, activity and posting permission."],
  ["christiansgroupchats",457,"DM","https://www.instagram.com/christiansgroupchats/","Bio says follow and DM to join the Christian group chat; confirm current activity."],
  ["christian_group_.chat",139,"DM","https://www.instagram.com/christian_group_.chat/","Bio advertises a 2026 Christian group chat and says follow/DM to join."],
  ["radiantfaithconvos",136,"DM","https://www.instagram.com/radiantfaithconvos/","Christian girls/Bible-talk group chat; DM to join. Older posts require activity verification."],
  ["daily_bibleverses",3185421,"Church online","https://tinyurl.com/DBV-church-online","Large Bible page with a Church Online pathway; independent member posting is not verified."],
  ["lamesforgod",77,"DM","https://www.instagram.com/lamesforgod/","Profile identifies itself as a Bible Study Group Chat; ask to join and verify activity."],
  ["christian_chat",267,"DM","https://www.instagram.com/christian_chat/","Christian group-chat lead, but visible activity dates to 2020; re-verification required."],
  ["christian.group.chat",285,"DM","https://www.instagram.com/christian.group.chat/","Bio says follow/DM to join age-based chats; appears to date from 2022."],
  ["onlinebiblestudy",118,"Live sessions","https://www.instagram.com/onlinebiblestudy/","Advertises Bible study at 12 PM and 8 PM ET; DM first because no invite link is visible."],
  ["christian_gc2701",2401,"DM","https://www.instagram.com/christian_gc2701/","Christian group-chat lead without clear join language; message and verify first."],
  ["thechristiansingleshub",14000,"Events/community","https://www.instagram.com/thechristiansingleshub/","Christian singles events/community; conversational access, not a general posting channel."],
  ["christianyoungadults",2753,"DM/community","https://www.instagram.com/christianyoungadults/","DMV-area Christian young-adult community; contact organizers for participation or partnership."]
].map(([handle,member_count,access_type,join_link,notes]) => ({
  id:`ig-community-${handle}`, name:`@${handle}`, link:`https://www.instagram.com/${handle}/`, join_link,
  platform:"Instagram", catalog_type:"Joinable Communities", audience_type:"church", member_count,
  access_type, notes, is_catalog:true
}));

const KBGE_INSTAGRAM_PARTNER_DATA = `elevationworship|5200000;joycemeyer|4900000;stevenfurtick|4200000;brandonlake|4000000;youversion|3600000;thechosentvseries|3600000;kirkfranklin|3500000;timtebow|3500000;maverickcitymusic|3200000;pray|3100000;daily_bibleverses|3100000;brycecrawford|3100000;sarahjakesroberts|3000000;mikemalagies|3000000;hillsong|2800000;cecewinans|2800000;lauren_daigle|2500000;bethelmusic|2400000;philwickham|2300000;lecrae|2300000;proverbs31ministries|2000000;jesusendlessgrace|1900000;jesus|1900000;elevationchurch|1900000;hillsongworship|1900000;jackiehillperry|1600000;churchofjesuschrist|1500000;reformedbychrist|1500000;hallowapp|1400000;christinecaine|1400000;thebibleproject|1300000;savedchrist|1300000;jesusculture|1300000;gatewayworship|1300000;2819church|1200000;craiggroeschel|1200000;chandlerdmoore|1200000;ourdailybread|1100000;taurenwells|983000;lysaterkeurst|945000;bible|885000;lakewoodchurch|882000;bethel|834000;desiringgod|805000;planetshakers|800000;elevation.rhythm|761000;billygraham|711000;catholicnewsagency|699000;judahsmith|697000;christianwomenusa|676000;ascensionpress|663000;bishopbarron|656000;essentialworship|650000;wearetransformation|647000;bethmoorelpm|626000;godlydating101|624000;womanevolve|611000;louiegiglio|604000;life.church|594000;jesus_christ_believers|559000;upperroomm|512000;passion268|489000;biblelovesus|479000;bbleverses|471000;glorifyappofficial|466000;passionmusic|436000;worshiptogether|431000;maxlucado|431000;thegospelcoalition|401000;unfoldthescripture|392000;liveoriginal|365000;samaritanspurse|364000;propelwomen|348000;vouschurch|327000;focuscatholic|288000;anniefdowns|287000;usa.biblestudy|279000;compassion|274000;usccb|267000;bibleverse|263000;a21|257000;passioncity|248000;scripture|225000;gatewaypeople|214000;thesonsofsunday|208000;social_dallas|200000;churchome|200000;younglife|195000;daily.prayers.us|195000;ligonier|192000;dailyscriptureposts|179000;ijm|175000;ihopkc|175000;churchofthehighlands|173000;bibleverses|165000;elevationyth|155000;bible.app_|150000;freechapel|134000;worshiponline|115000;saddlebackchurch|115000;first15devotional|111000;royalcitychurch|104000;cbcsocial|103000;scripture.central|102000;convoyofhope|98900;worldvisionusa|96400;catholiclink_en|95000;biblegateway|94000;midnightmomdevotional|89000;bssmredding|77000;lo.worship|76000;redrockschurch|72000;gotquestionsministries|71000;newspring_church|69000;thegracescripts|58000;godquotes|57000;scriptures|54000;capitolcmg|53000;arcchurches|53000;bibleappforkids|52000;cruinstagram|51000;momsinprayer|36000;repent.believe|33000;transformationchurch|30000;god_jesus_bible|30000;dailyprayers_com|26000;peopleandsongs|26000;jesuslovesyou667|24000;christianwomeninbusiness|19000|vendor;intervarsityusa|18000;raiseyourspark|16000|vendor;knowyoursavior|16000;christiansinglesdating|15000;mymorningdevo|14000;thechristiansingleshub|14000;churchlead|14000;metro_htx|9600;christianlifeaustinya|9127;prayerwarriorsglobal_|5300;christianquotes|5000;umiamicatholic|4200;gatherthegals|3700;christianentrepreneurclub|3000|vendor;christianyoungadults|2800;christianwomenbusinessnetwork|2500|vendor;mamas.with.purpose.co|2400|vendor;cayoungadultsla|1600;jcsd_youngadults|1000;prayercommunityofficial|981;intercessors_arise|976;wwcatholicya|905;dionashyoungadults|738;bostonyoungadults|540;bsfphoenixya|535;kingdom.intercessors_network|495;2ndcity.connect|402;intentionallybecoming|401;thegracespaceaz|342;dfwyoproministry|270;bsf.minneapolisya|206;cathedral_pdx_yam|194;coffeerunwithjesusjax|159;theanchorya_atl|148`;

const KBGE_INSTAGRAM_PARTNER_NOTES = {
  elevationworship:"Major worship ministry with broad US Christian reach.", pray:"Large prayer brand; no member-posting route was visible.",
  daily_bibleverses:"Large Bible page; its Church Online route is also listed as joinable.", jesus:"Its official Discord is also listed as joinable.",
  christianwomenusa:"Its public WhatsApp route is also listed as joinable.", "usa.biblestudy":"Its WhatsApp route is also listed as joinable.",
  upperroomm:"Prayer and worship ministry; no member-posting route was verified.", first15devotional:"Devotional subscription page; no group chat was verified."
};

const KBGE_INSTAGRAM_PARTNERS = KBGE_INSTAGRAM_PARTNER_DATA.split(";").map((entry) => {
  const [handle,count,audience="church"] = entry.split("|");
  const detail = KBGE_INSTAGRAM_PARTNER_NOTES[handle] || "Christian account found during the Instagram research.";
  return { id:`ig-partner-${handle}`, name:`@${handle}`, link:`https://www.instagram.com/${handle}/`, platform:"Instagram",
    catalog_type:"Partner Pages", audience_type:audience, member_count:Number(count), access_type:"Outreach", is_catalog:true,
    notes:`Partner page — ${detail} Followers cannot publish here; use DM, email, collaboration or sponsorship outreach.` };
});

const KBGE_INSTAGRAM_CATALOG = [...KBGE_INSTAGRAM_JOINABLE, ...KBGE_INSTAGRAM_PARTNERS];

function kbgeClean(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function kbgeFormatMembers(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return n.toLocaleString();
}

function kbgeFormatDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function kbgeDaysSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function kbgeAudienceLabel(value) {
  const v = String(value || "").toLowerCase();
  if (v === "vendor") return "Vendor";
  if (v === "church") return "Church / Ministry";
  if (v === "both") return "Both";
  if (v === "community") return "Community / Reach";
  return "—";
}

// 853bo (Stage 2, Add Group foundation): create-only validation for the
// Facebook group link. Supports the real formats confirmed present in
// Stage 1C Step 1 evidence: opaque /share/g/ tokens, /profile.php?id=
// numeric ids, canonical /groups/<slug>/ paths, and bare vanity paths
// (e.g. facebook.com/somepage). Deliberately permissive on path/slug shape
// - it only requires a valid HTTPS facebook.com (or www.facebook.com) host,
// since Stage 1C found real, legitimate variety in the tail of the URL and
// this must never reject a genuine existing format. This validation is
// scoped to NEW groups only and must never run against existing rows
// (see the ASPN anomaly, which is a pre-existing non-URL value and is left
// untouched).
function kbgeIsValidFacebookGroupUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (host !== "facebook.com" && host !== "www.facebook.com") return false;
  // Require some non-trivial path (not just "/" or empty) so a bare
  // "https://facebook.com" can't pass as a "group link".
  if (!parsed.pathname || parsed.pathname === "/" ) return false;
  return true;
}

function kbgeIsValidGroupUrl(value, platform) {
  const selected = String(platform || "").toLowerCase();
  if (selected === "facebook") return kbgeIsValidFacebookGroupUrl(value);
  try {
    const parsed = new URL(String(value || "").trim());
    if (parsed.protocol !== "https:" || !parsed.hostname || parsed.pathname === "/") return false;
    if (selected === "instagram") return ["instagram.com", "www.instagram.com"].includes(parsed.hostname.toLowerCase());
    return true;
  } catch { return false; }
}

function kbgeStatusLabel(value) {
  const v = String(value || "").replace(/_/g, " ");
  if (!v || v === "null" || v === "undefined") return "—";
  return v.replace(/\b\w/g, (m) => m.toUpperCase());
}

function kbgeNextAction(group, metricsAvailable = false) {
  const join = String(group.join_status || "").toLowerCase();
  const mode = String(group.posting_mode || "free").toLowerCase();
  const admin = String(group.admin_outreach_status || "").toLowerCase();
  const d = kbgeDaysSince(group.last_posted_at);
  if (mode === "blocked") return { label: "Admin needed", tone: "danger" };
  if (mode === "gated" || ["identified", "messaged", "responded"].includes(admin)) return { label: "Admin follow-up", tone: "warn" };
  if (!join || join === "not_joined") return { label: "Join", tone: "info" };
  if (join === "requested") return { label: "Confirm access", tone: "info" };
  if (d === null || d > 7) return { label: "Post", tone: "warn" };
  // 853ar (brief #7): Winner may ONLY be assigned from trusted, server-validated
  // metrics. If the aggregate is unavailable, never label a group a Winner.
  if (metricsAvailable && (Number(group.tracked_signups || 0) || 0) > 0) return { label: "Winner", tone: "success" };
  return { label: "Monitor", tone: "neutral" };
}

// 853br (Stage 4 Step 2): presentation-only lookup from an ALREADY-COMPUTED
// kbgeNextAction() result to (a) which existing field/section the Admin
// should be pointed at and (b) a short guidance sentence. This makes no
// decisions of its own - it does not read group fields, does not compute a
// Next label, and cannot diverge from kbgeNextAction()'s precedence, since
// it only ever receives that function's own output as input. Winner and
// Monitor intentionally map to field:null (no state-changing action is
// implied), so the row shows a plain "Review…" entry point for those two.
function kbgeNextStepContext(action) {
  switch (action?.label) {
    case "Join":
      return { field: "access", message: "Next: Join — open/request access to this group, then update Group Access below.", buttonLabel: "Next Step…" };
    case "Confirm access":
      return { field: "access", message: "Next: Confirm access — if your request was accepted, update Group Access to Member.", buttonLabel: "Next Step…" };
    case "Admin needed":
      return { field: "posting_mode", message: "Next: Admin needed — this group is blocked. Review Posting Mode below.", buttonLabel: "Next Step…" };
    case "Admin follow-up":
      return { field: "posting_mode", message: "Next: Admin follow-up — Posting Mode or Admin Status needs attention. Review both below.", buttonLabel: "Next Step…" };
    case "Post":
      return { field: "tracked_posts", message: "Next: Post — create/copy a tracked link, post it to the group, then mark that link posted below.", buttonLabel: "Next Step…" };
    case "Winner":
      return { field: null, message: null, buttonLabel: "Review…" };
    case "Monitor":
    default:
      return { field: null, message: null, buttonLabel: "Review…" };
  }
}

function kbgeMakeSourceSlug(value, maxLen = 42) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLen) || "group";
}

const KBGE_PLATFORM_PREFIX = {
  facebook: "fb",
  linkedin: "li",
  reddit: "rd",
  twitter: "tw",
  x: "tw",
  instagram: "ig",
  youtube: "yt",
};

function kbgeMakeUtmLink(groupName, platform, audienceType, { groupId = null, dropId = null } = {}) {
  const base = getAppUrl().replace(/\/$/, "");
  const role = audienceType === "vendor" ? "vendor" : "church";
  const groupSlug = kbgeMakeSourceSlug(groupName, 42);
  const platformSlug = kbgeMakeSourceSlug(platform || "Facebook", 16);
  const plat = KBGE_PLATFORM_PREFIX[platformSlug] || platformSlug.slice(0, 2) || "fb";
  const aud = role === "church" ? "ch" : "vn";
  const sourceTag = `${plat}_${groupSlug}_${aud}`;
  const params = new URLSearchParams({
    src: sourceTag,
    role,
    source_group: String(groupName || "").trim() || groupSlug,
    platform: String(platform || "Facebook").trim() || "Facebook",
    intent: role === "church" ? "quick_match" : "vendor_signup",
    utm_source: platformSlug,
    utm_medium: "group",
    utm_campaign: role === "church" ? "quick_match_brief" : "charter_vendor",
    utm_content: groupSlug,
  });
  // 853ar (brief #2/#3): every generated link carries the real group_id and
  // the real database growth_drops.id as drop_id. Both are re-validated
  // server-side at signup - the link only transports claims, the server
  // decides canonical attribution.
  if (groupId) params.set("group_id", String(groupId));
  if (dropId) params.set("drop_id", String(dropId));
  const destination = role === "church" ? "#/guest-post-project" : "#/vendor-signup";
  return `${base}/?${params.toString()}${destination}`;
}

function kbgeCopyText(text) {
  if (navigator?.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  return Promise.resolve();
}

function KBGEToast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2200);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`toast ${type || ""}`}>{message}</div>;
}

// 853bo (Stage 2): `mode` defaults to "edit" (existing behavior, untouched).
// mode="create" reuses this same modal for Add Group instead of a second,
// competing modal. `group` is optional in create mode (a blank draft shape
// is used); everything under "Tracked posts" / link-generation / the modal
// stats strip only applies to a real, already-persisted group and is
// skipped entirely in create mode, since there is no group.id yet.
function KBGEEditModal({ group, mode = "edit", defaultPlatform = "Facebook", defaultAudienceType = "church", defaultGrowthSegment = null, focusContext = null, onClose, onSaved, onDropsChanged, showToast }) {
  const isCreate = mode === "create";
  // General Vendor Groups correction: defaultAudienceType/defaultGrowthSegment
  // are optional and only affect the CREATE-mode blank draft. Edit mode always
  // spreads the real existing `group` row (below), so an existing row's
  // stored growth_segment is never touched by these defaults — only a brand
  // new row created from a segment-aware entry point (e.g. the General
  // Vendor Groups "+ Add Group" button) picks them up.
  const KBGE_BLANK_DRAFT = { name: "", link: "", platform: defaultPlatform, audience_type: defaultAudienceType, activity_level: "", notes: "", growth_segment: defaultGrowthSegment };
  const [draft, setDraft] = useState(() => ({ ...(isCreate ? KBGE_BLANK_DRAFT : group) }));
  const [saving, setSaving] = useState(false);
  // 853bo (Stage 2): inline field errors for create mode only (name/link/
  // audience required + link format). Never used in edit mode - the
  // existing edit save() error handling (toast on failure) is unchanged.
  const [createErrors, setCreateErrors] = useState({});
  // 853ar (brief #11): link-generation busy lock prevents duplicate drop rows
  // from repeated clicks. lastGeneratedLink holds a successfully-created link
  // whose clipboard copy failed, so the user can retry the COPY without
  // creating a second drop row.
  const [generatingLink, setGeneratingLink] = useState(false);
  const [lastGeneratedLink, setLastGeneratedLink] = useState(null);
  // 853ar (brief #9): compact tracked-post list for THIS group so two links
  // posted to the same group remain individually visible and measurable.
  // dropsState mirrors the metrics three-state contract: a failed load shows
  // an unavailable note, never an empty "no posts" lie.
  const [drops, setDrops] = useState([]);
  const [dropsState, setDropsState] = useState("loading"); // loading | available | unavailable
  const [markingDropId, setMarkingDropId] = useState(null);
  const [contentBusyId, setContentBusyId] = useState(null);
  const [adminRelationship, setAdminRelationship] = useState({ id: null, admin_name: "", profile_url: "", relationship_status: "unknown", last_touched_at: "", next_review_at: "", notes: "" });
  const [adminRelationshipBusy, setAdminRelationshipBusy] = useState(false);

  // 853br (Stage 4 Step 2): purely presentational focus/scroll support for
  // the "Next Step…" entry point. focusContext (if provided) only carries a
  // target field key and a short guidance message computed by the caller
  // from the EXISTING kbgeNextAction() result - no new decision logic lives
  // here, and no state transition is triggered by opening with a focus
  // target. Edit (no focusContext) behaves exactly as before: no banner, no
  // scroll, modal opens at its normal starting position.
  const accessFieldRef = useRef(null);
  const postingModeFieldRef = useRef(null);
  const trackedPostsRef = useRef(null);
  useEffect(() => {
    if (isCreate || !focusContext?.field) return;
    const targetRef =
      focusContext.field === "access" ? accessFieldRef :
      focusContext.field === "posting_mode" ? postingModeFieldRef :
      focusContext.field === "tracked_posts" ? trackedPostsRef :
      null;
    if (targetRef?.current) {
      // Scroll happens after initial paint so modal layout has settled.
      const t = setTimeout(() => {
        targetRef.current?.scrollIntoView({ block: "center" });
      }, 30);
      return () => clearTimeout(t);
    }
  }, [isCreate, focusContext]);

  const loadDrops = useCallback(async () => {
    if (isCreate || !group?.id) { setDropsState("unavailable"); return; }
    setDropsState("loading");
    try {
      // Trusted per-drop signup counts + drop rows come from the admin
      // aggregate RPC (returns counts only, no applicant PII). Falls back to
      // "unavailable" - never to a false empty list - if it isn't installed.
      const { data, error } = await supabase.rpc("kb_growth_drops_for_group_v2", { p_group_id: group.id });
      if (error || !Array.isArray(data)) { setDropsState("unavailable"); setDrops([]); return; }
      setDrops(data);
      setDropsState("available");
    } catch { setDropsState("unavailable"); setDrops([]); }
  }, [isCreate, group?.id]);

  useEffect(() => { loadDrops(); }, [loadDrops]);

  useEffect(() => {
    if (isCreate || !group?.id) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("growth_group_admin_relationships").select("*").eq("group_id", group.id).order("updated_at", { ascending: false }).limit(1);
      if (!active || error || !Array.isArray(data) || !data[0]) return;
      const row = data[0];
      setAdminRelationship({
        ...row,
        last_touched_at: row.last_touched_at ? String(row.last_touched_at).slice(0, 10) : "",
        next_review_at: row.next_review_at ? String(row.next_review_at).slice(0, 10) : "",
      });
    })();
    return () => { active = false; };
  }, [isCreate, group?.id]);

  const saveAdminRelationship = async () => {
    if (isCreate || !group?.id || adminRelationshipBusy) return;
    setAdminRelationshipBusy(true);
    try {
      const payload = {
        group_id: group.id,
        admin_name: String(adminRelationship.admin_name || "").trim() || null,
        profile_url: String(adminRelationship.profile_url || "").trim() || null,
        relationship_status: adminRelationship.relationship_status || "unknown",
        last_touched_at: adminRelationship.last_touched_at || null,
        next_review_at: adminRelationship.next_review_at || null,
        notes: String(adminRelationship.notes || "").trim() || null,
      };
      const query = adminRelationship.id
        ? supabase.from("growth_group_admin_relationships").update(payload).eq("id", adminRelationship.id)
        : supabase.from("growth_group_admin_relationships").insert([payload]);
      const { data, error } = await query.select("*").single();
      if (error) { showToast(`Admin relationship save failed: ${error.message}`, "error"); return; }
      setAdminRelationship({ ...data, last_touched_at: data.last_touched_at ? String(data.last_touched_at).slice(0, 10) : "", next_review_at: data.next_review_at ? String(data.next_review_at).slice(0, 10) : "" });
      showToast("Admin relationship saved", "success");
    } finally { setAdminRelationshipBusy(false); }
  };

  const markThisDropPosted = async (dropId) => {
    if (!dropId || markingDropId) return;
    setMarkingDropId(dropId);
    try {
      const { data, error } = await supabase.rpc("kb_mark_growth_drop_posted", { p_drop_id: dropId });
      if (error) {
        showToast(`Could not mark posted: ${error.message}. The mark-posted function may not be installed yet.`, "error");
        return;
      }
      const updatedGroup = Array.isArray(data) ? data[0] : data;
      if (updatedGroup && updatedGroup.id) onSaved({ ...group, ...updatedGroup });
      showToast("Marked posted", "success");
      await loadDrops();
      onDropsChanged && onDropsChanged();
    } finally {
      setMarkingDropId(null);
    }
  };

  const update = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  // 853bo (Stage 2): validates the three required create-mode fields only.
  // Never runs in edit mode, so it can never affect the existing ASPN row
  // or any other already-persisted group with an unconventional link.
  const validateCreateDraft = () => {
    const errors = {};
    const name = String(draft.name || "").trim();
    const link = String(draft.link || "").trim();
    const audience = String(draft.audience_type || "").trim().toLowerCase();
    const activityLevel = String(draft.activity_level || "").trim().toLowerCase();
    if (!name) errors.name = "Group name is required.";
    if (!link) {
      errors.link = `${draft.platform || "Group"} link is required.`;
    } else if (!kbgeIsValidGroupUrl(link, draft.platform)) {
      errors.link = `Enter a valid https://${String(draft.platform || "group").toLowerCase()}.com link.`;
    }
    if (!["church", "vendor", "both", "community"].includes(audience)) errors.audience_type = "Choose Church/Ministry, Vendor, Both, or Community / Reach.";
    // 853bq (Stage 3 Step 2): activity_level is required in create mode and
    // must be one of the three controlled values. No default is silently
    // assumed - an unselected dropdown ("") fails this check explicitly.
    if (activityLevel !== "low" && activityLevel !== "medium" && activityLevel !== "high") {
      errors.activity_level = "Select an activity level.";
    }
    return errors;
  };

  // 853bo (Stage 2): local, Add-Group-only duplicate detection. This reads
  // the Postgres unique-violation code (23505) and the specific constraint
  // name reported by Postgres/PostgREST to tell a duplicate NAME apart from
  // a duplicate TRIMMED LINK (see Stage 1C's groups_name_unique and
  // groups_link_trimmed_unique indexes) and label the error accordingly.
  // This is intentionally separate from, and never calls, the waitlist
  // duplicate-email classifier (isWaitlistDuplicateEmailError) - that
  // function remains untouched and unreferenced here.
  const describeGroupInsertError = (error) => {
    if (!error) return "Could not add group.";
    const constraint = String(error.details || "") + " " + String(error.message || "") + " " + String(error.hint || "");
    const constraintLc = constraint.toLowerCase();
    if (error.code === "23505") {
      if (constraintLc.includes("groups_link_trimmed_unique")) {
        return "A group with this exact link already exists. Check the group list before adding it again.";
      }
      if (constraintLc.includes("groups_name_unique")) {
        return "A group with this name already exists. Use a different name or edit the existing group.";
      }
      // Unique violation on an unrecognized constraint - still surface it
      // as a duplicate rather than a generic failure, without guessing which.
      return "This group could not be added because it duplicates an existing group (name or link).";
    }
    return error.message || "Could not add group.";
  };

  const save = async () => {
    if (isCreate) {
      const errors = validateCreateDraft();
      setCreateErrors(errors);
      if (Object.keys(errors).length > 0) return;
      setSaving(true);
      // Only the required/allowed create-mode fields are sent. All other
      // columns (join_status, posting_mode, status, admin_outreach_status,
      // admin_response, member_count, notes, etc.) are omitted so their
      // existing database defaults remain authoritative, per scope.
      // activity_level is included (853bq, Stage 3 Step 2) since it is now
      // a validated, explicit create-mode field - never a silent default.
      const insertPayload = {
        name: String(draft.name || "").trim(),
        link: String(draft.link || "").trim(),
        platform: draft.platform || defaultPlatform,
        audience_type: String(draft.audience_type || "").trim().toLowerCase(),
        activity_level: String(draft.activity_level || "").trim().toLowerCase(),
        notes: String(draft.notes || "").trim() || null,
        // General Vendor Groups correction: only set when the caller passed
        // an explicit defaultGrowthSegment (e.g. Add Group opened from the
        // General Vendor Groups tab). Add Group opened from any other view
        // passes no defaultGrowthSegment, so this key is omitted entirely
        // and the column keeps its normal NULL default — unchanged from
        // existing behavior for every other entry point.
        ...(defaultGrowthSegment ? { growth_segment: defaultGrowthSegment } : {}),
      };
      const { data, error } = await supabase.from("groups").insert([insertPayload]).select("*").single();
      setSaving(false);
      if (error) {
        // Fail safely: no optimistic/fake row is ever added to state here.
        showToast(describeGroupInsertError(error), "error");
        return;
      }
      if (!data || !data.id) {
        // Fail safely: refuse to fabricate a group record if the insert
        // didn't come back with a real, database-assigned row/id.
        showToast("Group was not added (no confirmed row returned).", "error");
        return;
      }
      onSaved(data);
      showToast("Group added", "success");
      onClose();
      return;
    }

    if (!draft?.id) return;
    setSaving(true);
    const payload = {
      name: draft.name || null,
      link: draft.link || null,
      platform: draft.platform || null,
      audience_type: draft.audience_type || null,
      member_count: draft.member_count === "" || draft.member_count === null || draft.member_count === undefined ? null : Number(draft.member_count),
      join_status: draft.join_status || null,
      posting_mode: draft.posting_mode || null,
      // 853bq (Stage 3 Step 2): activity_level is normalized to lowercase and
      // constrained to the three controlled values (or null) before being
      // sent - this guarantees only low/medium/high/null can ever be
      // written here, independent of how the dropdown option value arrives.
      activity_level: (["low", "medium", "high"].includes(String(draft.activity_level || "").trim().toLowerCase()))
        ? String(draft.activity_level).trim().toLowerCase()
        : null,
      status: draft.status || null,
      admin_outreach_status: draft.admin_outreach_status || null,
      admin_response: draft.admin_response || null,
      posting_rule_basis: draft.posting_rule_basis || "unknown",
      posting_rule_finding: draft.posting_rule_finding || null,
      posting_rules_reviewed_at: draft.posting_rules_reviewed_at || null,
      allowed_posting_behavior: draft.allowed_posting_behavior || null,
      strategic_fit_score: draft.strategic_fit_score === "" || draft.strategic_fit_score === null || draft.strategic_fit_score === undefined ? null : Number(draft.strategic_fit_score),
      fit_rationale: draft.fit_rationale || null,
      growth_priority_tier: draft.growth_priority_tier || null,
      admin_relationship_status: draft.admin_relationship_status || "unknown",
      growth_next_action: draft.growth_next_action || null,
      growth_last_activity_at: draft.growth_last_activity_at || null,
      growth_next_review_at: draft.growth_next_review_at || null,
      growth_review_reason: draft.growth_review_reason || null,
      channel_stage: draft.channel_stage || "discovered",
      audience_segment: draft.audience_segment || null,
      best_posting_day: draft.best_posting_day || null,
      posting_cadence: draft.posting_cadence || null,
      notes: draft.notes || null,
    };
    const { data, error } = await supabase.from("groups").update(payload).eq("id", draft.id).select("*").single();
    setSaving(false);
    if (error) {
      showToast(`Save failed: ${error.message}`, "error");
      return;
    }
    onSaved(data || { ...draft, ...payload });
    showToast("Group saved", "success");
    onClose();
  };

  // Human approval pipeline: draft -> review -> approved -> tracked link -> manual post -> response log.
  // No step here posts to an external service or messages anyone.
  const createContentDraft = async (audienceType) => {
    if (isCreate || generatingLink) return;
    const content = window.prompt(`Draft the exact ${audienceType === "vendor" ? "vendor" : "church/ministry"} post. Nothing will be posted automatically.`);
    if (content === null) return;
    if (!String(content).trim()) { showToast("Draft content is required before review.", "error"); return; }
    setGeneratingLink(true);
    try {
      const { error } = await supabase.rpc("kb_admin_create_growth_content_draft_v0", { p_group_id: draft.id, p_audience_type: audienceType, p_draft_content: String(content).trim() });
      if (error) { showToast(`Draft could not be created: ${error.message}`, "error"); return; }
      showToast("Content draft created", "success");
      await loadDrops();
      onDropsChanged && onDropsChanged();
    } finally { setGeneratingLink(false); }
  };

  const moveContentApproval = async (drop, target) => {
    if (!drop?.id || contentBusyId) return;
    let content = drop.draft_content || null;
    if (target === "review") {
      const reviewed = window.prompt("Review the exact post copy before submitting it for approval.", content || "");
      if (reviewed === null) return;
      if (!String(reviewed).trim()) { showToast("Reviewed content cannot be empty.", "error"); return; }
      content = String(reviewed).trim();
    }
    setContentBusyId(drop.id);
    try {
      const { error } = await supabase.rpc("kb_admin_set_growth_drop_approval_v0", { p_drop_id: drop.id, p_target: target, p_draft_content: content, p_response_count: null });
      if (error) { showToast(`Content status could not change: ${error.message}`, "error"); return; }
      showToast(target === "approved" ? "Content approved—manual posting is still required" : target === "review" ? "Sent for human review" : "Returned to draft", "success");
      await loadDrops();
      onDropsChanged && onDropsChanged();
    } finally { setContentBusyId(null); }
  };

  const copyApprovedDropLink = async (drop) => {
    if (!drop?.id || contentBusyId) return;
    setContentBusyId(drop.id);
    setLastGeneratedLink(null);
    try {
      const { error } = await supabase.rpc("kb_admin_mark_growth_drop_link_generated_v0", { p_drop_id: drop.id });
      if (error) { showToast(`Tracked link could not be generated: ${error.message}`, "error"); return; }
      const link = kbgeMakeUtmLink(draft.name, draft.platform, drop.audience_type, { groupId: draft.id, dropId: String(drop.id) });
      try {
        await kbgeCopyText(link);
        showToast("Approved tracked link copied—post it manually", "success");
      } catch {
        setLastGeneratedLink(link);
        showToast("Link generated but clipboard copy failed—copy it below.", "error");
      }
      await loadDrops();
      onDropsChanged && onDropsChanged();
    } finally { setContentBusyId(null); }
  };

  const recordDropResponses = async (drop) => {
    if (!drop?.id || contentBusyId) return;
    const raw = window.prompt("How many direct responses has this specific post received?", String(Number(drop.response_count || 0)));
    if (raw === null) return;
    const count = Number(raw);
    if (!Number.isInteger(count) || count < 0) { showToast("Enter a whole number of zero or more.", "error"); return; }
    setContentBusyId(drop.id);
    try {
      const { error } = await supabase.rpc("kb_admin_record_growth_drop_responses_v0", { p_drop_id: drop.id, p_response_count: count });
      if (error) { showToast(`Responses could not be saved: ${error.message}`, "error"); return; }
      showToast("Post responses recorded", "success");
      await loadDrops();
      onDropsChanged && onDropsChanged();
    } finally { setContentBusyId(null); }
  };

  const retryCopyLastLink = async () => {
    if (!lastGeneratedLink) return;
    try {
      await kbgeCopyText(lastGeneratedLink);
      showToast("Link copied", "success");
    } catch {
      showToast("Copy still failed - select and copy the link text manually.", "error");
    }
  };
  const copyVendor = () => createContentDraft("vendor");
  const copyChurch = () => createContentDraft("church");

  return (
    <div className="modalBack" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div>
            <div className="modalTitle">{isCreate ? "Add Group" : "Edit Group"}</div>
            <div className="modalSub">{isCreate ? "Add an outreach group or account" : kbgeClean(group.name)}</div>
          </div>
          <button className="xBtn" onClick={onClose}>×</button>
        </div>

        {/* 853br (Stage 4 Step 2): compact contextual guidance, shown only
            when opened via "Next Step…". Purely presentational - the text
            is supplied by the caller from the existing kbgeNextAction()
            result and nothing here changes any field or triggers a save. */}
        {!isCreate && focusContext?.message ? (
          <div className="focusHint">{focusContext.message}</div>
        ) : null}

        {!isCreate ? (
        <div className="modalStats">
          <div><strong>{kbgeFormatMembers(draft.member_count)}</strong><span>Members</span></div>
          <div><strong>{Number(draft.attributed_signups || 0)}</strong><span>Signals</span></div>
          <div><strong>{Number(draft.drops_count ?? draft.post_count ?? 0)}</strong><span>Posts</span></div>
          <div><strong>{kbgeFormatDate(draft.last_posted_at)}</strong><span>Last posted</span></div>
        </div>
        ) : null}

        {isCreate ? (
        <div className="formGrid">
          <label className="field wide">
            Group Name
            <input value={draft.name || ""} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Dallas Wedding Vendors" />
            {createErrors.name ? <div className="fieldError">{createErrors.name}</div> : null}
          </label>
          <label className="field wide">
            Link
            <input value={draft.link || ""} onChange={(e) => update("link", e.target.value)} placeholder={draft.platform === "Instagram" ? "https://www.instagram.com/account/" : "https://www.facebook.com/groups/..."} />
            {createErrors.link ? <div className="fieldError">{createErrors.link}</div> : null}
          </label>
          <label className="field wide">Platform<select value={draft.platform || defaultPlatform} onChange={(e) => update("platform", e.target.value)}><option>Facebook</option><option>Instagram</option><option>LinkedIn</option><option>Reddit</option><option>Directory</option><option>Other</option></select></label>
          <label className="field wide">
            Audience
            <select value={draft.audience_type || "church"} onChange={(e) => update("audience_type", e.target.value)}><option value="church">Church / Ministry</option><option value="vendor">Vendor</option><option value="both">Both</option><option value="community">Community / Reach</option></select>
            {createErrors.audience_type ? <div className="fieldError">{createErrors.audience_type}</div> : null}
          </label>
          <label className="field wide">
            Activity Level
            <select value={draft.activity_level || ""} onChange={(e) => update("activity_level", e.target.value)}>
              <option value="" disabled>Select activity level</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {createErrors.activity_level ? <div className="fieldError">{createErrors.activity_level}</div> : null}
          </label>
          <label className="field wide">Notes<textarea value={draft.notes || ""} onChange={(e) => update("notes", e.target.value)} rows={4} placeholder="Join path, posting rules, audience fit, contact details..." /></label>
        </div>
        ) : (
        <div className="formGrid">
          <label className="field wide">Group Name<input value={draft.name || ""} onChange={(e) => update("name", e.target.value)} /></label>
          <label className="field wide">Link<input value={draft.link || ""} onChange={(e) => update("link", e.target.value)} /></label>
          <label className="field">Members<input type="number" value={draft.member_count || ""} onChange={(e) => update("member_count", e.target.value)} /></label>
          <label className="field">Platform<select value={draft.platform || "Facebook"} onChange={(e) => update("platform", e.target.value)}><option>Facebook</option><option>Instagram</option><option>LinkedIn</option><option>Reddit</option><option>Directory</option><option>Other</option></select></label>
          <label className="field">Audience<select value={draft.audience_type || "vendor"} onChange={(e) => update("audience_type", e.target.value)}><option value="vendor">Vendor</option><option value="church">Church / Ministry</option><option value="both">Both</option><option value="community">Community / Reach</option></select></label>
          <label className="field">
            Activity Level
            <select value={draft.activity_level || ""} onChange={(e) => update("activity_level", e.target.value)}>
              <option value="" disabled>Select activity level</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="field" ref={accessFieldRef}>Access<select value={draft.join_status || "not_joined"} onChange={(e) => update("join_status", e.target.value)}><option value="not_joined">Not joined</option><option value="requested">Requested</option><option value="member">Member</option></select></label>
          <label className="field" ref={postingModeFieldRef}>Posting Mode<select value={draft.posting_mode || "free"} onChange={(e) => update("posting_mode", e.target.value)}><option value="free">Free</option><option value="gated">Gated</option><option value="blocked">Blocked</option></select></label>
          <label className="field">Admin Status<select value={draft.admin_outreach_status || "not_started"} onChange={(e) => update("admin_outreach_status", e.target.value)}><option value="not_started">Not started</option><option value="identified">Identified</option><option value="messaged">Messaged</option><option value="responded">Responded</option><option value="partnership">Partnership</option></select></label>
          <div className="field wide" style={{fontSize:12,fontWeight:800,color:"#26361f",letterSpacing:".04em",textTransform:"uppercase",paddingTop:8}}>Posting rule evidence</div>
          <label className="field">Rule Basis<select value={draft.posting_rule_basis || "unknown"} onChange={(e) => update("posting_rule_basis", e.target.value)}><option value="unknown">Unknown</option><option value="confirmed">Confirmed</option><option value="inferred">Inferred</option></select></label>
          <label className="field">Rules Reviewed<input type="date" value={draft.posting_rules_reviewed_at || ""} onChange={(e) => update("posting_rules_reviewed_at", e.target.value)} /></label>
          <label className="field">Priority<select value={draft.growth_priority_tier || ""} onChange={(e) => update("growth_priority_tier", e.target.value)}><option value="">Not ranked</option><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></label>
          <label className="field">Strategic Fit<select value={draft.strategic_fit_score ?? ""} onChange={(e) => update("strategic_fit_score", e.target.value)}><option value="">Not scored</option><option value="1">1/5</option><option value="2">2/5</option><option value="3">3/5</option><option value="4">4/5</option><option value="5">5/5</option></select></label>
          <label className="field">Channel Stage<select value={draft.channel_stage || "discovered"} onChange={(e) => update("channel_stage", e.target.value)}><option value="discovered">Discovered</option><option value="requested">Requested</option><option value="pending">Pending</option><option value="joined">Joined</option><option value="active">Active</option><option value="dormant">Dormant</option><option value="left">Left</option></select></label>
          <label className="field">Audience Segment<select value={draft.audience_segment || ""} onChange={(e) => update("audience_segment", e.target.value)}><option value="">Not classified</option><option value="church_leader">Church leader</option><option value="ministry_nonprofit">Ministry / nonprofit</option><option value="christian_vendor">Christian vendor</option><option value="local_community">Local community</option><option value="denominational_network">Denominational network</option><option value="low_relevance">Low relevance</option></select></label>
          <label className="field">Best Posting Day<input value={draft.best_posting_day || ""} onChange={(e) => update("best_posting_day", e.target.value)} placeholder="Only when actually known" /></label>
          <label className="field">Posting Cadence<input value={draft.posting_cadence || ""} onChange={(e) => update("posting_cadence", e.target.value)} placeholder="Observed or human-decided cadence" /></label>
          <label className="field wide">Posting-rule Finding<textarea value={draft.posting_rule_finding || ""} onChange={(e) => update("posting_rule_finding", e.target.value)} rows={3} placeholder="What the published group rules specifically establish" /></label>
          <label className="field wide">Allowed Posting Behavior<textarea value={draft.allowed_posting_behavior || ""} onChange={(e) => update("allowed_posting_behavior", e.target.value)} rows={3} placeholder="Evidence-pure posting boundary" /></label>
          <label className="field wide">Fit Rationale<textarea value={draft.fit_rationale || ""} onChange={(e) => update("fit_rationale", e.target.value)} rows={3} placeholder="Strategic judgment, kept separate from rule evidence" /></label>
          <div className="field wide" style={{fontSize:12,fontWeight:800,color:"#26361f",letterSpacing:".04em",textTransform:"uppercase",paddingTop:8}}>Admin relationship (separate record)</div>
          <label className="field">Admin Name<input value={adminRelationship.admin_name || ""} onChange={(e) => setAdminRelationship((r) => ({ ...r, admin_name: e.target.value }))} /></label>
          <label className="field">Relationship Status<select value={adminRelationship.relationship_status || "unknown"} onChange={(e) => setAdminRelationship((r) => ({ ...r, relationship_status: e.target.value }))}><option value="unknown">Unknown</option><option value="cold">Cold</option><option value="warm">Warm</option><option value="active">Active</option></select></label>
          <label className="field wide">Admin Profile URL<input value={adminRelationship.profile_url || ""} onChange={(e) => setAdminRelationship((r) => ({ ...r, profile_url: e.target.value }))} /></label>
          <label className="field">Last Touched<input type="date" value={adminRelationship.last_touched_at || ""} onChange={(e) => setAdminRelationship((r) => ({ ...r, last_touched_at: e.target.value }))} /></label>
          <label className="field">Admin Next Review<input type="date" value={adminRelationship.next_review_at || ""} onChange={(e) => setAdminRelationship((r) => ({ ...r, next_review_at: e.target.value }))} /></label>
          <label className="field wide">Relationship Notes<textarea rows={2} value={adminRelationship.notes || ""} onChange={(e) => setAdminRelationship((r) => ({ ...r, notes: e.target.value }))} /></label>
          <div className="field wide"><button type="button" className="ghostBtn" onClick={saveAdminRelationship} disabled={adminRelationshipBusy}>{adminRelationshipBusy ? "Saving relationship…" : "Save admin relationship"}</button></div>
          <div className="field wide" style={{fontSize:12,fontWeight:800,color:"#26361f",letterSpacing:".04em",textTransform:"uppercase",paddingTop:8}}>Follow-up schedule</div>
          <label className="field">Last Meaningful Activity<input type="date" value={draft.growth_last_activity_at || ""} onChange={(e) => update("growth_last_activity_at", e.target.value)} /></label>
          <label className="field">Next Review Date<input type="date" value={draft.growth_next_review_at || ""} onChange={(e) => update("growth_next_review_at", e.target.value)} /></label>
          <label className="field wide">Review Reason<textarea value={draft.growth_review_reason || ""} onChange={(e) => update("growth_review_reason", e.target.value)} rows={2} placeholder="Why this record should return to the Founder queue on that date" /></label>
          <label className="field wide">Next Action<textarea value={draft.growth_next_action || ""} onChange={(e) => update("growth_next_action", e.target.value)} rows={2} /></label>
          <label className="field wide">Notes<textarea value={draft.notes || ""} onChange={(e) => update("notes", e.target.value)} rows={4} /></label>
        </div>
        )}

        {!isCreate ? (
        <div ref={trackedPostsRef} style={{ margin: "6px 0 12px", padding: "12px 14px", borderRadius: 12, background: "#faf7f0", border: "1px solid #e4d9c2" }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: "#7a6a48", marginBottom: 8 }}>Tracked posts</div>
          {dropsState === "loading" ? (
            <div style={{ fontSize: 12.5, color: "#9c8a68" }}>Loading tracked posts…</div>
          ) : dropsState === "unavailable" ? (
            <div style={{ fontSize: 12.5, color: "#9a3412" }}>Tracked-post data unavailable. Complete the Growth Engine attribution setup (drop table, aggregate function, and admin permissions).</div>
          ) : drops.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#9c8a68" }}>No tracked links generated for this group yet.</div>
          ) : (
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr style={{ textAlign: "left", color: "#9c8a68" }}><th style={{ padding: "4px 6px" }}>Audience</th><th style={{ padding: "4px 6px" }}>Approval</th><th style={{ padding: "4px 6px" }}>Post</th><th style={{ padding: "4px 6px" }}>Evidence</th><th style={{ padding: "4px 6px" }}>Human action</th></tr></thead>
              <tbody>{drops.map((d) => {
                const approval = String(d.approval_status || "draft");
                const status = String(d.status || "draft");
                const busy = contentBusyId === d.id || markingDropId === d.id;
                return <tr key={d.id} style={{ borderTop: "1px solid #ece3d1" }}>
                  <td style={{ padding: "6px" }}>{kbgeAudienceLabel(d.audience_type)}</td>
                  <td style={{ padding: "6px" }}>{kbgeStatusLabel(approval)}</td>
                  <td style={{ padding: "6px" }}>{status === "link_generated" ? "Link ready" : kbgeStatusLabel(status)}</td>
                  <td style={{ padding: "6px" }}>{Number(d.response_count || 0)} responses · {Number(d.tracked_signup_count || 0)} signups</td>
                  <td style={{ padding: "6px" }}><div className="rowActions">
                    {approval === "draft" ? <button onClick={() => moveContentApproval(d, "review")} disabled={busy}>Send to review</button> : null}
                    {approval === "review" ? <><button onClick={() => moveContentApproval(d, "approved")} disabled={busy}>Approve</button><button onClick={() => moveContentApproval(d, "draft")} disabled={busy}>Return draft</button></> : null}
                    {approval === "approved" && status !== "link_generated" ? <button onClick={() => copyApprovedDropLink(d)} disabled={busy}>Copy tracked link</button> : null}
                    {status === "link_generated" ? <button onClick={() => markThisDropPosted(d.id)} disabled={busy}>Mark posted</button> : null}
                    {status === "posted" ? <button onClick={() => recordDropResponses(d)} disabled={busy}>Log responses</button> : null}
                  </div></td>
                </tr>;
              })}</tbody>
            </table>
          )}
          {/* brief #14: legacy signals preserved but clearly marked not-verified */}
          <div style={{ marginTop: 8, fontSize: 11.5, color: "#9c8a68" }} title="Legacy manually-entered value. Not used for verified attribution, Winner, or any decision metric.">Legacy signals (not verified): {Number(group.attributed_signups || 0)}</div>
        </div>
        ) : null}

        {!isCreate && lastGeneratedLink ? (
          <div style={{ margin: "0 0 10px", padding: "10px 12px", borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa", fontSize: 12.5 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: "#9a3412" }}>Link created — clipboard copy failed. Copy it manually:</div>
            <input readOnly value={lastGeneratedLink} onFocus={(e) => e.target.select()} style={{ width: "100%", fontFamily: "monospace", fontSize: 11.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #e4d9c2", marginBottom: 6 }} />
            <button className="ghostBtn" onClick={retryCopyLastLink}>Retry copy</button>
          </div>
        ) : null}
        <div className="modalFoot">
          {!isCreate ? (
            <>
              <button className="ghostBtn" onClick={copyVendor} disabled={generatingLink}>{generatingLink ? "Creating…" : "Create Vendor Draft"}</button>
              <button className="ghostBtn" onClick={copyChurch} disabled={generatingLink}>{generatingLink ? "Creating…" : "Create Church Draft"}</button>
            </>
          ) : null}
          <div className="spacer" />
          <button className="ghostBtn" onClick={onClose}>Cancel</button>
          <button className="darkBtn" onClick={save} disabled={saving}>{saving ? "Saving..." : (isCreate ? "Add Group" : "Save")}</button>
        </div>
      </div>
    </div>
  );
}

export default function GrowthEngine() {
  const [groups, setGroups] = useState([]);
  const [groupsTotal, setGroupsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState("");
  const [search, setSearch] = useState("");
  // 873b: filtering re-runs a full array pass (up to 3,083 rows) on every
  // change to `search`. Debounce the value actually used for filtering so
  // fast typing doesn't trigger a filter+sort pass per keystroke — the
  // input itself (bound to `search`) stays instantly responsive, only the
  // heavier `filtered` recompute waits after typing pauses. Reuses the
  // shared useDebounce hook already used elsewhere in this file (project
  // browse, vendor browse, admin panel) rather than a one-off timer.
  const debouncedSearch = useDebounce(search, 250);
  // 871 — separates the two kinds of data that used to be interleaved in one
  // table with two different row styles (real tracked outreach vs. catalog/
  // research entries). "outreach" = is_catalog false, the original working
  // system with Last Post / Tracked columns and the 3-button Open/Next Step/
  // Edit layout. "partners" = is_catalog true (Facebook + Instagram catalog
  // rows together), the compact Profile/Join layout. Does not change or drop
  // any data — purely which subset of allRows is shown and how those rows render.
  // 874b: was defaulting to "outreach", which explicitly hides catalog rows
  // (Instagram Joinable Communities + Partner Pages) via the engineView
  // filter — they were present in code and data the whole time, but a user
  // landing on the default tab would never see them without manually
  // clicking over. Defaulting here to "joinable" keeps Instagram Joinable
  // Communities visible on first load, for good, without relying on anyone
  // remembering to switch tabs.
  const [engineView, setEngineView] = useState("joinable");
  const [platform, setPlatform] = useState("Instagram");
  const [audience, setAudience] = useState("All");
  const [instagramType, setInstagramType] = useState("Joinable Communities");
  const [sort, setSort] = useState({ key: "member_count", dir: "desc" });
  // 872b: Min Reach defaults to "All" (0), never a nonzero value, so the
  // 1,363-row Community/Reach import (many groups under 10K members) is
  // fully visible on first load. The user can raise it from the toolbar.
  const [minReach, setMinReach] = useState(0);
  // 872b: real UI pagination. filtered.length can be 3,000+; rendering
  // every matching row in one table pass was the actual perf problem (the
  // backend read was already fixed by the 872 .range() patch). pageSize
  // defaults to 20 per the audit's recommendation.
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // 876: bulk audience edit. bulkMode toggles the selection UI on/off;
  // selectedIds holds the ids of rows the user has checked (a Set for O(1)
  // has/add/delete rather than an array with indexOf). Only real Supabase
  // rows can be selected — catalog rows (is_catalog: true, the Instagram
  // Joinable Communities / Partner Pages entries) don't exist as rows in
  // the groups table, so there's nothing in the DB to bulk-update for them;
  // their checkboxes are disabled rather than silently no-opping.
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  // 853br (Stage 4 Step 2): holds the compact guidance context (target
  // field + message) when the modal is opened via "Next Step…" rather than
  // plain "Edit". Kept as a separate piece of state so the existing plain
  // Edit path (setEditing(g) alone) is completely untouched and never
  // carries any context. Cleared whenever the modal closes.
  const [editFocusContext, setEditFocusContext] = useState(null);
  // 853bo (Stage 2): separate boolean so Add Group and Edit never collide -
  // reuses the same KBGEEditModal component in mode="create" rather than a
  // second modal/component.
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);
  const [postingIds, setPostingIds] = useState(() => new Set());
  const [backendReady, setBackendReady] = useState(true);
  const tableWrapRef = useRef(null);
  // 853ar (brief #7/#8): metrics have three explicit states. A failed or
  // unavailable measurement must render as "—", never as a trusted 0, and must
  // never drive a Winner badge. "available" is set ONLY when a real aggregate
  // read succeeds. Until the Admin aggregate RPC/view exists server-side, this
  // stays "unavailable" - the frontend deliberately does NOT fall back to the
  // old client-side full-waitlist tally (brief #8 forbids it and it exposed
  // whole-table reads). See FAITHBID_P0_2_P0_3_CANONICAL_GROWTH_ATTRIBUTION_MIGRATION.sql.
  const [metricsState, setMetricsState] = useState("loading");
  const [blueprintStatus, setBlueprintStatus] = useState(null);
  const [blueprintStatusState, setBlueprintStatusState] = useState("loading");

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);
  const loadBlueprintStatus = useCallback(async () => {
    setBlueprintStatusState("loading");
    try {
      const { data, error } = await supabase.rpc("kb_admin_get_growth_blueprint_status_v0");
      if (error || !data || typeof data !== "object") { setBlueprintStatus(null); setBlueprintStatusState("unavailable"); return; }
      setBlueprintStatus(data);
      setBlueprintStatusState("available");
    } catch { setBlueprintStatus(null); setBlueprintStatusState("unavailable"); }
  }, []);

  const loadGroups = useCallback(async () => {
    const databaseView = engineView === "outreach" || engineView === "general_vendor";
    if (!databaseView) {
      setGroups([]);
      setGroupsTotal(0);
      setBackendReady(true);
      setMetricsState("unavailable");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setMetricsState("loading");
    // P3-3: fetch only the active database-backed view and only the visible
    // page. Catalog tabs are local and never touch `groups`. This replaces
    // the previous 500-row loop that downloaded all 4,318 production rows.
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    const allowedSortKeys = new Set(["name", "platform", "audience_type", "member_count", "last_posted_at"]);
    const sortKey = allowedSortKeys.has(sort.key) ? sort.key : "member_count";
    const audienceValue = { Vendor: "vendor", "Church / Ministry": "church", Both: "both", "Community / Reach": "community" }[audience] || null;
    const safeSearch = debouncedSearch.trim().replace(/[%_,()]/g, " ").replace(/\s+/g, " ").slice(0, 80);
    let query = supabase.from("groups").select("*", { count: "exact" });
    query = engineView === "general_vendor"
      ? query.eq("growth_segment", "general_vendor")
      : query.or("growth_segment.is.null,growth_segment.neq.general_vendor");
    if (platform !== "All") query = query.eq("platform", platform);
    if (audienceValue) query = query.eq("audience_type", audienceValue);
    if (minReach > 0) query = query.gte("member_count", minReach);
    if (safeSearch) {
      const term = `%${safeSearch}%`;
      query = query.or(["name", "platform", "audience_type", "category", "notes", "access_type", "privacy"].map((column) => `${column}.ilike.${term}`).join(","));
    }
    const { data: pageData, error: loadError, count } = await query
      .order(sortKey, { ascending: sort.dir === "asc", nullsFirst: false })
      .range(from, to);
    const allRows = Array.isArray(pageData) ? pageData : [];
    if (loadError) {
      setBackendReady(false);
      setError(loadError.message || "Growth Engine backend is not configured.");
      setGroups([]);
      setGroupsTotal(0);
      setMetricsState("unavailable");
      setLoading(false);
      return;
    }
    setBackendReady(true);
    setGroupsTotal(Number(count || 0));
    const rows = allRows;

    // 853ar (brief #7/#8): trusted metrics come ONLY from a server-side,
    // admin-authorized aggregate that counts canonical (server-validated)
    // attribution and returns counts without applicant PII. The old v1
    // approach (fetch every waitlist row, tally client-side) is removed:
    // it read the whole table and turned any failure into a false zero.
    //
    // This calls kb_growth_group_signup_counts() (defined in the migration
    // file). Until that function exists in the database, the read fails and
    // metricsState becomes "unavailable" -> the table shows "—", the group
    // modal shows an Admin config warning, and NO Winner badge is assigned.
    // A missing aggregate is never silently treated as "every group has 0".
    let countsByGroup = null;
    let healthByGroup = null;
    try {
      const { data: healthRows, error: healthError } = await supabase.rpc("kb_admin_get_growth_channel_health_v0");
      if (!healthError && Array.isArray(healthRows)) {
        healthByGroup = healthRows.reduce((acc, row) => {
          const gid = String(row.group_id || "");
          if (gid) acc[gid] = row;
          return acc;
        }, {});
        countsByGroup = Object.fromEntries(Object.entries(healthByGroup).map(([gid, row]) => [gid, Number(row.tracked_signup_count || 0) || 0]));
      }
    } catch { healthByGroup = null; countsByGroup = null; }
    if (!countsByGroup) {
      try {
        const { data: agg, error: aggError } = await supabase.rpc("kb_growth_group_signup_counts");
        if (!aggError && Array.isArray(agg)) countsByGroup = agg.reduce((acc, row) => { const gid = String(row.group_id || ""); if (gid) acc[gid] = Number(row.tracked_signup_count || 0) || 0; return acc; }, {});
      } catch { countsByGroup = null; }
    }

    if (countsByGroup) {
      setMetricsState("available");
      setGroups(rows.map((g) => ({ ...g, ...(healthByGroup?.[String(g.id)] || {}), tracked_signups: countsByGroup[String(g.id)] || 0 })));
    } else {
      setMetricsState("unavailable");
      setGroups(rows.map((g) => ({ ...g })));
    }
    setLoading(false);
  }, [audience, currentPage, debouncedSearch, engineView, minReach, pageSize, platform, sort.dir, sort.key]);

  useEffect(() => {
    const timer = setTimeout(() => { loadGroups(); }, 0);
    return () => clearTimeout(timer);
  }, [loadGroups]);
  useEffect(() => { loadBlueprintStatus(); }, [loadBlueprintStatus]);

  const catalogRows = useMemo(() => {
    const existing = new Set(groups.map((g) => String(g.link || g.name || "").trim().toLowerCase()).filter(Boolean));
    return KBGE_INSTAGRAM_CATALOG.filter((g) => !existing.has(String(g.link || g.name || "").trim().toLowerCase()));
  }, [groups]);

  const allRows = useMemo(() => [...groups, ...catalogRows], [groups, catalogRows]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const rows = allRows.filter((g) => {
      const isCatalogRow = Boolean(g.is_catalog);
      // 872b: was a 2-way split (outreach vs. partners) where "partners"
      // silently lumped Joinable Communities in with actual partner-page
      // outreach prospects — the exact "Instagram outreach feels gone"
      // complaint from the audit. Now three explicit views, matching
      // KBGE_INSTAGRAM_TYPE_ORDER's own three-way split so the tab state
      // and the Instagram-type filter never disagree with each other.
      // General Vendor Groups rows carry growth_segment === 'general_vendor'
      // and must never appear under Outreach/Joinable/Partners, and no
      // other row may appear under General Vendor Groups — the predicate
      // is symmetric so isolation holds in both directions regardless of
      // platform, audience_type, category, or name.
      const isGeneralVendor = g.growth_segment === "general_vendor";
      if (engineView === "outreach" && (isCatalogRow || isGeneralVendor)) return false;
      if (engineView === "joinable" && (!isCatalogRow || g.catalog_type !== "Joinable Communities")) return false;
      if (engineView === "partners" && (!isCatalogRow || g.catalog_type !== "Partner Pages")) return false;
      if (engineView === "general_vendor" && !isGeneralVendor) return false;
      if (engineView !== "general_vendor" && isGeneralVendor) return false;
      if (platform !== "All" && kbgeClean(g.platform, "Other") !== platform) return false;
      if (audience !== "All" && kbgeAudienceLabel(g.audience_type) !== audience) return false;
      if (platform === "Instagram" && instagramType !== "All Instagram") {
        if ((g.catalog_type || "Saved Instagram") !== instagramType) return false;
      }
      // 872b: Min Reach is a working-view filter only — it never deletes or
      // touches Supabase. Smaller groups stay stored; this just hides them
      // from the current table pass. value 0 ("All") always passes.
      if (minReach > 0 && Number(g.member_count || 0) < minReach) return false;
      if (q) {
        // 872b: search previously checked name/platform/audience_type/notes
        // only. Expanded per audit to cover category, catalog_type,
        // access_type, and privacy, plus the human-readable audience label
        // (so searching "church" matches audience_type "church" even
        // though the label reads "Church / Ministry").
        const hay = `${g.name || ""} ${g.platform || ""} ${kbgeAudienceLabel(g.audience_type) || ""} ${g.audience_type || ""} ${g.category || ""} ${g.catalog_type || ""} ${g.notes || ""} ${g.access_type || ""} ${g.privacy || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    rows.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      let av = a[sort.key];
      let bv = b[sort.key];
      if (["member_count", "tracked_signups", "drops_count", "post_count"].includes(sort.key)) {
        av = Number(av || 0);
        bv = Number(bv || 0);
      } else if (sort.key === "last_posted_at") {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      } else {
        av = String(av || "").toLowerCase();
        bv = String(bv || "").toLowerCase();
      }
      if (av > bv) return dir;
      if (av < bv) return -dir;
      return 0;
    });
    return rows;
  }, [allRows, engineView, platform, audience, instagramType, debouncedSearch, sort, minReach]);

  // 872b: whenever any filter/search/sort/pageSize changes, snap back to
  // page 1. Without this, a user on page 45 could apply a filter that only
  // has 2 pages of results and see "No groups found" even though matching
  // rows exist — they'd just be on a page number that no longer exists.
  useEffect(() => {
    setCurrentPage(1);
  }, [engineView, platform, audience, instagramType, debouncedSearch, sort, minReach, pageSize]);

  const reviewTodayKey = new Date().toISOString().slice(0,10);
  const reviewTrackedRows = allRows.filter(row => !row?.is_catalog);
  const growthReviewDueCount = reviewTrackedRows.filter(row => row.growth_next_review_at && String(row.growth_next_review_at).slice(0,10) <= reviewTodayKey).length;
  const growthReviewScheduledCount = reviewTrackedRows.filter(row => row.growth_next_review_at && String(row.growth_next_review_at).slice(0,10) > reviewTodayKey).length;
  const growthReviewMissingCount = reviewTrackedRows.filter(row => !row.growth_next_review_at && (['member','requested'].includes(String(row.join_status || '').toLowerCase()) || row.posting_rules_reviewed_at || row.growth_priority_tier === 'A')).length;
  const databaseView = engineView === "outreach" || engineView === "general_vendor";
  const totalMatchingRows = databaseView ? groupsTotal : filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalMatchingRows / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginatedRows = databaseView ? filtered : filtered.slice(pageStart, pageStart + pageSize);

  // 893: keep the actual page state in sync with the clamped page the UI
  // displays. Without this, a filter can shrink the result set while
  // currentPage is still a now-impossible value; the table shows safePage,
  // but Previous/Next keep calculating from the stale hidden value, making
  // top rows look "stuck" across clicks.
  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

  // 893: page/filter/sort changes should start the user at the top of the
  // table body. Otherwise the sticky header + preserved scroll position can
  // make a new page feel like it didn't move, especially when many low-reach
  // rows have similar names/counts.
  useEffect(() => {
    const el = tableWrapRef.current;
    if (el) el.scrollTop = 0;
  }, [safePage, engineView, platform, audience, instagramType, debouncedSearch, sort, minReach, pageSize]);

  const setSortKey = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));
  const sortClass = (key) => sort.key === key ? `sort ${sort.dir}` : "";

  // 853ar (brief #1/#12/#13) — Mark Posted updates the EXACT drop created at
  // link generation, atomically, via an admin-only server RPC. It never
  // inserts a second drop and never manufactures a drop id. The old pattern
  // (update group, insert a NEW drop, roll back on failure) is removed: it
  // created a drop B unrelated to the drop A embedded in the actual link,
  // permanently breaking the post→signup relationship.
  //
  // kb_mark_growth_drop_posted(p_drop_id) is defined in the migration file
  // and must: validate admin, confirm the drop is pending/link_generated,
  // set status='posted' + posted_at, update the group's last_posted_at and
  // cached counters, and return the updated rows - all in one transaction.
  const _markDropPosted = async (dropId) => {
    if (!dropId || postingIds.has(dropId)) return;
    setPostingIds((ids) => new Set(ids).add(dropId));
    try {
      const { data, error } = await supabase.rpc("kb_mark_growth_drop_posted", { p_drop_id: dropId });
      if (error) {
        showToast(`Could not mark posted: ${error.message}. The Growth Engine mark-posted function may not be installed yet.`, "error");
        return;
      }
      // Server returns the updated group row (or enough to refresh it).
      const updatedGroup = Array.isArray(data) ? data[0] : data;
      if (updatedGroup && updatedGroup.id) {
        setGroups((rows) => rows.map((r) => r.id === updatedGroup.id ? { ...r, ...updatedGroup } : r));
      }
      showToast("Marked posted", "success");
      // Refresh so trusted metrics and drop lists reflect the change.
      loadGroups();
    } finally {
      setPostingIds((ids) => { const next = new Set(ids); next.delete(dropId); return next; });
    }
  };

  const applySavedGroup = (saved) => setGroups((rows) => rows.map((r) => r.id === saved.id ? saved : r));

  // 876: applies one audience_type value to every selected id in a single
  // Supabase update call (.in("id", [...])), same as the single-row edit
  // modal's update — no schema change, no new table, no batching loop of
  // individual writes. On success, merges the new audience_type into local
  // state for just the affected rows (same pattern as applySavedGroup)
  // rather than a full loadGroups() reload, so a bulk edit of a handful of
  // rows out of 3,083 doesn't force a full page re-fetch.
  const applyBulkAudience = async (newAudienceType) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkSaving(true);
    try {
      const { data, error: bulkError } = await supabase
        .from("groups")
        .update({ audience_type: newAudienceType })
        .in("id", ids)
        .select("id, audience_type");
      if (bulkError) {
        showToast(bulkError.message || "Bulk update failed — nothing was changed.", "error");
        return;
      }
      const updatedById = new Map((data || []).map((r) => [r.id, r.audience_type]));
      setGroups((rows) => rows.map((r) => updatedById.has(r.id) ? { ...r, audience_type: updatedById.get(r.id) } : r));
      showToast(`Updated ${updatedById.size} group${updatedById.size === 1 ? "" : "s"} to ${kbgeAudienceLabel(newAudienceType)}`, "success");
      setSelectedIds(new Set());
      setBulkMode(false);
    } catch {
      showToast("Bulk update failed — nothing was changed.", "error");
    } finally {
      setBulkSaving(false);
    }
  };

  // 853bo (Stage 2): on successful Add Group insert, refresh through the
  // existing loadGroups() path (per scope) rather than splicing an
  // optimistic row into state - the new group appears the same way any
  // other group does, sourced from a real confirmed database read.
  const handleGroupAdded = () => {
    loadGroups();
  };

  const totalReach = filtered.reduce((sum, g) => sum + Number(g.member_count || 0), 0);

  return (
    <div className="kbge-root">
      <style>{KBGE_STYLES}</style>

      <section className="kbge-blueprint-status" aria-label="Growth Engine blueprint status">
        <div className="kbge-blueprint-head">
          <div><span>Blueprint operating status</span><strong>{blueprintStatusState === "available" ? (blueprintStatus?.interpretation || "Live") : blueprintStatusState === "loading" ? "Loading live blueprint evidence…" : "Blueprint status unavailable"}</strong></div>
          <button className="miniBtn" onClick={loadBlueprintStatus}>Refresh status</button>
        </div>
        {blueprintStatusState === "available" ? <>
          <div className="kbge-milestone-ladder">{(blueprintStatus?.milestone_ladder || []).map((step) => <div key={step.stage}><span>{step.stage}</span><strong>{Number(step.count || 0)}</strong></div>)}</div>
          <div className="kbge-gate-note">First-five completion gate: <strong>{blueprintStatus?.cohort?.completed || 0}/5 real projects</strong> · Vendor bench {blueprintStatus?.gates?.vendor_bench_enabled ? "enabled" : "gated"} · Trust evidence {blueprintStatus?.gates?.trust_evidence_auto_drafts_enabled ? "enabled" : "gated"}. QA projects never unlock these modules.</div>
          <details className="kbge-blueprint-details"><summary>View all 12 module states</summary><div className="kbge-module-grid">{(blueprintStatus?.modules || []).map((m) => <div key={m.module}><strong>{m.module}</strong><span>{m.functionality}</span><small>{m.data_status} · Lifecycle: {m.lifecycle_proven}</small></div>)}</div></details>
          <details className="kbge-blueprint-details"><summary>Permanent trust and platform guardrails</summary><div className="kbge-guardrail-list">{(blueprintStatus?.guardrails || []).map((g) => <div key={g.key}><strong>{g.rule}</strong><span>{g.rationale}</span></div>)}</div></details>
        </> : null}
      </section>

      <div className="kbge-view-tabs" role="tablist" aria-label="Growth Engine view">
        <button role="tab" aria-selected={engineView === "outreach"} className={`kbge-view-tab ${engineView === "outreach" ? "active" : ""}`} onClick={() => setEngineView("outreach")}>Outreach Groups</button>
        {/* 876: leaving the Outreach Groups tab also exits bulk mode and
            clears any in-progress selection — bulk edit only applies to
            rows on this tab, so a selection left over from here shouldn't
            silently persist (and become applicable again) after switching
            to a catalog tab and back. */}
        <button role="tab" aria-selected={engineView === "joinable"} className={`kbge-view-tab ${engineView === "joinable" ? "active" : ""}`} onClick={() => { setEngineView("joinable"); setBulkMode(false); setSelectedIds(new Set()); }}>Joinable Communities</button>
        <button role="tab" aria-selected={engineView === "partners"} className={`kbge-view-tab ${engineView === "partners" ? "active" : ""}`} onClick={() => { setEngineView("partners"); setBulkMode(false); setSelectedIds(new Set()); }}>Partner Pages</button>
        {/* General Vendor Groups: real DB rows (is_catalog false, same as
            Outreach Groups), isolated exclusively by growth_segment ===
            'general_vendor' — never by platform+audience, name, or
            category. See the `filtered` useMemo below for the matching
            predicate. Positioned immediately right of Partner Pages per
            spec. Also exits bulk mode on entry, same as the other
            catalog-style tabs, since bulk edit is scoped to Outreach
            Groups only. */}
        <button role="tab" aria-selected={engineView === "general_vendor"} className={`kbge-view-tab ${engineView === "general_vendor" ? "active" : ""}`} onClick={() => { setEngineView("general_vendor"); setPlatform("Facebook"); setBulkMode(false); setSelectedIds(new Set()); }}>General Vendor Groups</button>
      </div>

      <div className="topLine">
        <div className="titleBlock">
          <h1>Groups</h1>
          {/* 873b: "shown" was ambiguous once pagination existed — filtered.length
              counts everything matching the current filters, not just the rows
              visible on this page. Relabeled to "matching" to avoid that
              misread; the reach total still sums the whole matching set. */}
          <span>{filtered.length} matching · {kbgeFormatMembers(totalReach)} combined reach · {growthReviewDueCount} review due · {growthReviewScheduledCount} scheduled · {growthReviewMissingCount} missing dates</span>
        </div>
        <div className="topControls">
          <input className="search" placeholder="Search names, notes, category..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>{KBGE_PLATFORM_ORDER.map((p) => <option key={p}>{p}</option>)}</select>
          {platform === "Instagram" ? <select aria-label="Instagram type" value={instagramType} onChange={(e) => setInstagramType(e.target.value)}>{KBGE_INSTAGRAM_TYPE_ORDER.map((type) => <option key={type}>{type}</option>)}</select> : null}
          <select value={audience} onChange={(e) => setAudience(e.target.value)}>{KBGE_AUDIENCE_ORDER.map((a) => <option key={a}>{a}</option>)}</select>
          <select aria-label="Min Reach" title="Smaller groups stay stored but are hidden from this working view." value={minReach} onChange={(e) => setMinReach(Number(e.target.value))}>
            {KBGE_MIN_REACH_OPTIONS.map((opt) => <option key={opt.label} value={opt.value}>Min Reach: {opt.label}</option>)}
          </select>
          <select aria-label="Rows per page" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {KBGE_PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size} / page</option>)}
          </select>
          {/* 873b: only rendered once a filter is actually active, so it doesn't
              sit there doing nothing at default state. Resets search, platform,
              instagram type, audience, and min reach in one click — sort and
              pageSize are left alone since those are display preferences, not
              filters narrowing the result set.
              General Vendor Groups correction: this tab's whole dataset is
              Facebook, so "unfiltered" here means platform === "Facebook",
              not the Instagram default used by every other tab. Both the
              visibility check and the reset action branch on engineView so
              existing tabs keep their exact original behavior. */}
          {engineView === "general_vendor"
            ? ((search || platform !== "Facebook" || audience !== "All" || minReach !== 0) ? (
                <button className="miniBtn" onClick={() => { setSearch(""); setPlatform("Facebook"); setAudience("All"); setMinReach(0); }}>Reset filters</button>
              ) : null)
            : ((search || platform !== "Instagram" || instagramType !== "Joinable Communities" || audience !== "All" || minReach !== 0) ? (
                <button className="miniBtn" onClick={() => { setSearch(""); setPlatform("Instagram"); setInstagramType("Joinable Communities"); setAudience("All"); setMinReach(0); }}>Reset filters</button>
              ) : null)}
          {/* 876: bulk edit only makes sense on the Outreach Groups tab —
              catalog rows (Joinable Communities / Partner Pages) aren't
              rows in the groups table, so there's nothing to bulk-update
              for them. Toggling off clears any in-progress selection. */}
          {engineView === "outreach" ? (
            <button
              className={`miniBtn ${bulkMode ? "active" : ""}`}
              onClick={() => { setBulkMode((v) => !v); setSelectedIds(new Set()); }}
            >
              {bulkMode ? "Cancel bulk edit" : "Bulk edit"}
            </button>
          ) : null}
          <button className="miniBtn" onClick={() => { loadGroups(); loadBlueprintStatus(); }}>Refresh</button>
          <button className="miniBtn addGroupBtn" onClick={() => setCreating(true)}>+ Add Group</button>
        </div>
      </div>

      {bulkMode && engineView === "outreach" ? (
        <div className="kbge-bulk-bar">
          <span className="kbge-bulk-count">
            {selectedIds.size === 0 ? "Select groups below to bulk-edit their audience" : `${selectedIds.size} group${selectedIds.size === 1 ? "" : "s"} selected`}
          </span>
          {selectedIds.size > 0 ? (
            <>
              <span className="kbge-bulk-setto">Set audience to:</span>
              <button className="miniBtn" disabled={bulkSaving} onClick={() => applyBulkAudience("church")}>Church / Ministry</button>
              <button className="miniBtn" disabled={bulkSaving} onClick={() => applyBulkAudience("vendor")}>Vendor</button>
              <button className="miniBtn" disabled={bulkSaving} onClick={() => applyBulkAudience("both")}>Both</button>
              <button className="miniBtn" disabled={bulkSaving} onClick={() => applyBulkAudience("community")}>Community / Reach</button>
              {bulkSaving ? <span className="kbge-bulk-saving">Saving…</span> : null}
              <button className="miniBtn" disabled={bulkSaving} onClick={() => setSelectedIds(new Set())}>Clear selection</button>
            </>
          ) : null}
        </div>
      ) : null}

      {!loading && !backendReady && platform !== "Instagram" ? (
        <div className="kbge-config-state">
          <div className="kbge-config-kicker">Backend not configured</div>
          <div className="kbge-config-title">Growth Engine is safely paused.</div>
          <div className="kbge-config-copy">The optional <code>groups</code> / <code>growth_drops</code> backend is unavailable or blocked by RLS. The rest of FaithBid is unaffected; configure those tables before using the Growth console.</div>
          <button className="miniBtn" onClick={loadGroups}>Retry check</button>
        </div>
      ) : (
      <div className="tableWrap" ref={tableWrapRef}>
        {!backendReady && platform === "Instagram" ? (
          <div className="catalogNotice"><strong>Instagram research is available.</strong> Saved database groups and tracked results will appear after the Growth Engine backend reconnects.</div>
        ) : metricsState === "unavailable" ? (
          <div className="catalogNotice"><strong>Tracked results are unavailable.</strong> Research leads remain visible; saved-group counts show a dash and no Winner label is assigned.</div>
        ) : null}
        <table className="groupsTable">
          <colgroup>
            {/* 876: checkbox column only exists in bulk mode on the Outreach
                Groups tab — catalog rows have no id in the groups table to
                select for a bulk write, so bulk mode is scoped to this tab
                only (see the toolbar toggle above). */}
            {bulkMode && engineView === "outreach" ? <col style={{ width: "4%" }} /> : null}
            {/* 874c: Next column only carries real signal on the Outreach
                Groups tab (it's dynamic there — driven by posting history).
                On Joinable Communities / Partner Pages it's static text that
                just restates the tab, so it's dropped and its width folds
                into Group + Activity instead of sitting there unused. */}
            <col style={{ width: (engineView === "outreach" || engineView === "general_vendor") ? "22%" : "28%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: (engineView === "outreach" || engineView === "general_vendor") ? "10%" : "20%" }} />
            {(engineView === "outreach" || engineView === "general_vendor") ? <col style={{ width: "10%" }} /> : null}
            <col style={{ width: "22%" }} />
          </colgroup>
          <thead>
            <tr>
              {bulkMode && engineView === "outreach" ? (
                <th className="checkboxHead">
                  {/* 876: selects/deselects every row on the CURRENT page
                      only (paginatedRows), not all 3,083 matching rows —
                      "select all" across every page would be an easy way
                      to accidentally bulk-edit far more than intended. */}
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={paginatedRows.length > 0 && paginatedRows.every((g) => selectedIds.has(g.id))}
                    onChange={(e) => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        paginatedRows.forEach((g) => { e.target.checked ? next.add(g.id) : next.delete(g.id); });
                        return next;
                      });
                    }}
                  />
                </th>
              ) : null}
              <th className={sortClass("name")} onClick={() => setSortKey("name")}>Group</th>
              <th className={sortClass("member_count")} onClick={() => setSortKey("member_count")}>Reach</th>
              <th>Platform / Type</th>
              <th className={sortClass("audience_type")} onClick={() => setSortKey("audience_type")}>Audience</th>
              <th className="optionalCol" onClick={() => setSortKey("last_posted_at")}>Activity</th>
              {(engineView === "outreach" || engineView === "general_vendor") ? <th>Next</th> : null}
              <th className="actionsHead">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && filtered.length === 0 && <tr><td colSpan={((engineView === "outreach" || engineView === "general_vendor") ? 7 : 6) + (bulkMode && engineView === "outreach" ? 1 : 0)} className="stateCell">Loading groups...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={((engineView === "outreach" || engineView === "general_vendor") ? 7 : 6) + (bulkMode && engineView === "outreach" ? 1 : 0)} className="stateCell">No groups found.</td></tr>}
            {paginatedRows.map((g) => {
              const action = g.is_catalog
                ? (g.catalog_type === "Joinable Communities" ? { label:g.access_type || "Join", tone:"info" } : { label:"Partner outreach", tone:"warn" })
                : kbgeNextAction(g, metricsState === "available");
              const stepContext = kbgeNextStepContext(action);
              const postCount = Number(g.drops_count ?? g.post_count ?? 0) || 0;
              const reviewDate = g.growth_next_review_at ? String(g.growth_next_review_at).slice(0,10) : "";
              const reviewDue = !!reviewDate && reviewDate <= reviewTodayKey;
              const reviewEligible = !g.is_catalog && (['member','requested'].includes(String(g.join_status || '').toLowerCase()) || g.posting_rules_reviewed_at || g.growth_priority_tier === 'A');
              // 872b: Notes moved out of its own column (was crowding the
              // table at any page size) into the Group cell's hover title,
              // alongside the group name, so the full note text is still
              // one hover away rather than removed from the UI.
              const groupTitle = [kbgeClean(g.name), g.posting_rule_finding ? `Rule evidence (${kbgeStatusLabel(g.posting_rule_basis)}): ${g.posting_rule_finding}` : null, g.fit_rationale ? `Fit: ${g.fit_rationale}` : null, g.notes || null].filter(Boolean).join("\n\n");
              return (
                <tr key={g.id} className={bulkMode && selectedIds.has(g.id) ? "kbge-row-selected" : ""}>
                  {bulkMode && engineView === "outreach" ? (
                    <td className="checkboxCell">
                      <input
                        type="checkbox"
                        aria-label={`Select ${kbgeClean(g.name)}`}
                        checked={selectedIds.has(g.id)}
                        onChange={(e) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            e.target.checked ? next.add(g.id) : next.delete(g.id);
                            return next;
                          });
                        }}
                      />
                    </td>
                  ) : null}
                  <td><div className="groupName" title={groupTitle}>{kbgeClean(g.name)}{String(g.join_status || "").toLowerCase() === "member" ? <span style={{marginLeft:6,color:"#2f855a",fontSize:11,fontWeight:800}}>(Joined)</span> : String(g.join_status || "").toLowerCase() === "requested" ? <span style={{marginLeft:6,color:"#9a6700",fontSize:11,fontWeight:800}}>(Requested)</span> : null}{g.posting_rule_basis && g.posting_rule_basis !== "unknown" ? <span style={{marginLeft:6,color:g.posting_rule_basis === "confirmed" ? "#2f855a" : "#9a6700",fontSize:10,fontWeight:800}}>{kbgeStatusLabel(g.posting_rule_basis)} rules{g.growth_priority_tier ? ` · ${g.growth_priority_tier}/${g.strategic_fit_score || "—"}` : ""}</span> : null}{reviewDate ? <span style={{marginLeft:6,color:reviewDue?"#b42318":"#466339",fontSize:10,fontWeight:800}}>{reviewDue ? "Review due" : `Review ${kbgeFormatDate(reviewDate)}`}</span> : reviewEligible ? <span style={{marginLeft:6,color:"#8a6a22",fontSize:10,fontWeight:800}}>Review date missing</span> : null}</div></td>
                  <td className="membersCell">{kbgeFormatMembers(g.member_count)}</td>
                  <td><span className={`plainPill ${g.catalog_type === "Joinable Communities" ? "joinable" : ""}`}>{g.catalog_type || `${kbgeClean(g.platform, "Other")} Group`}</span></td>
                  <td>{kbgeAudienceLabel(g.audience_type)}</td>
                  <td className="optionalCol">{g.is_catalog ? "Research" : <>{kbgeFormatDate(g.last_posted_at)} · {metricsState === "available" ? Number(g.tracked_signups || 0) : "—"}/{postCount}{g.channel_health_status ? <span style={{marginLeft:6,fontSize:9.5,fontWeight:800,color:g.channel_health_status === "producing" ? "#166534" : g.channel_health_status === "dead_weight" ? "#b91c1c" : "#667085"}}>{kbgeStatusLabel(g.channel_health_status)}</span> : null}</>}</td>
                  {(engineView === "outreach" || engineView === "general_vendor") ? <td><span className={`nextPill ${action.tone}`}>{action.label}</span></td> : null}
                  <td>
                    <div className="rowActions">
                      <button onClick={() => g.link && window.open(g.link, "_blank", "noopener,noreferrer")} disabled={!g.link}>{g.is_catalog ? "Profile" : "Open"}</button>
                      {g.is_catalog ? (
                        g.catalog_type === "Joinable Communities" ? <button className="primaryAction" onClick={() => window.open(g.join_link || g.link, "_blank", "noopener,noreferrer")}>Join</button> : <button className="primaryAction" onClick={() => window.open(g.link, "_blank", "noopener,noreferrer")}>Outreach</button>
                      ) : <>
                        <button onClick={() => { setEditFocusContext(stepContext.field ? stepContext : null); setEditing(g); }}>{stepContext.buttonLabel}</button>
                        <button onClick={() => { setEditFocusContext(null); setEditing(g); }}>Edit</button>
                      </>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="kbge-pagination">
          <button className="miniBtn" disabled={safePage <= 1} onClick={() => setCurrentPage(Math.max(1, safePage - 1))}>Previous</button>
          <span className="kbge-page-info">Page {safePage} of {totalPages} · {totalMatchingRows} groups</span>
          <button className="miniBtn" disabled={safePage >= totalPages} onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}>Next</button>
        </div>
      )}

      {editing && <KBGEEditModal group={editing} focusContext={editFocusContext} onClose={() => { setEditing(null); setEditFocusContext(null); }} onSaved={applySavedGroup} onDropsChanged={loadGroups} showToast={showToast} />}
      {creating && <KBGEEditModal
        mode="create"
        defaultPlatform={engineView === "general_vendor" ? "Facebook" : (platform === "All" ? "Facebook" : platform)}
        // General Vendor Groups correction: Add Group opened from this tab
        // must produce a row that immediately belongs in it — Facebook
        // platform, vendor audience, and growth_segment='general_vendor' —
        // so the new row doesn't vanish from the tab it was created in or
        // silently surface under Outreach Groups. Every other tab passes
        // neither prop, so defaultAudienceType/defaultGrowthSegment fall
        // back to KBGEEditModal's own defaults ("church" / null),
        // identical to existing behavior before this change.
        {...(engineView === "general_vendor" ? { defaultAudienceType: "vendor", defaultGrowthSegment: "general_vendor" } : {})}
        onClose={() => setCreating(false)}
        onSaved={handleGroupAdded}
        showToast={showToast}
      />}
      {toast && <KBGEToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

const KBGE_STYLES = `
.kbge-root{
  --bg:#f4f2ee;
  --panel:#ffffff;
  --ink:#121212;
  --muted:#667085;
  --faint:#98a2b3;
  --line:#e4e0d8;
  --line-soft:#f0ede7;
  --head:#fbfaf7;
  --row:#ffffff;
  --row-alt:#fdfcf9;
  --hover:#f6f9ff;
  --gold:#9a6a1f;
  --navy:#111827;
  --green:#166534;
  --green-bg:#ecfdf5;
  --amber:#92400e;
  --amber-bg:#fffbeb;
  --red:#b91c1c;
  --red-bg:#fef2f2;
  --blue:#1d4ed8;
  --blue-bg:#eff6ff;
}
.kbge-root *{box-sizing:border-box}
.kbge-root .kbge-blueprint-status{margin:0 0 10px;padding:12px 14px;background:#111827;color:#fff;border:1px solid #252f42;border-radius:10px;box-shadow:0 2px 8px rgba(17,24,39,.12)}
.kbge-root .kbge-blueprint-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.kbge-root .kbge-blueprint-head>div{display:grid;gap:3px}.kbge-root .kbge-blueprint-head span{font-size:9px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#d8c18f}.kbge-root .kbge-blueprint-head strong{font-size:12px;line-height:1.4}.kbge-root .kbge-blueprint-head .miniBtn{background:#fff;color:#111827;border-color:#fff}
.kbge-root .kbge-milestone-ladder{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.kbge-root .kbge-milestone-ladder div{display:flex;align-items:center;justify-content:space-between;gap:8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.11);border-radius:7px;padding:7px 9px}.kbge-root .kbge-milestone-ladder span{font-size:10px;color:#d8dee9}.kbge-root .kbge-milestone-ladder strong{font-family:DM Mono,monospace;font-size:15px}
.kbge-root .kbge-gate-note{margin-top:8px;font-size:10.5px;line-height:1.5;color:#d8dee9}.kbge-root .kbge-gate-note strong{color:#fff}.kbge-root .kbge-blueprint-details{margin-top:8px;border-top:1px solid rgba(255,255,255,.1);padding-top:7px}.kbge-root .kbge-blueprint-details summary{cursor:pointer;font-size:10.5px;font-weight:800;color:#d8c18f}.kbge-root .kbge-module-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}.kbge-root .kbge-module-grid div,.kbge-root .kbge-guardrail-list div{display:grid;gap:2px;padding:7px 8px;background:rgba(255,255,255,.05);border-radius:6px}.kbge-root .kbge-module-grid strong,.kbge-root .kbge-guardrail-list strong{font-size:9.5px}.kbge-root .kbge-module-grid span{font-size:9px;color:#d8c18f}.kbge-root .kbge-module-grid small,.kbge-root .kbge-guardrail-list span{font-size:8.75px;line-height:1.4;color:#b9c1cf}.kbge-root .kbge-guardrail-list{display:grid;gap:6px;margin-top:8px}
@media(max-width:800px){.kbge-root .kbge-milestone-ladder{grid-template-columns:repeat(2,minmax(0,1fr))}.kbge-root .kbge-module-grid{grid-template-columns:1fr}}
.kbge-root button,.kbge-root input,.kbge-root select,.kbge-root textarea{font-family:inherit}
.kbge-root{min-height:100vh;padding:6px 8px 10px;overflow-x:hidden;}
.kbge-root .kbge-view-tabs{display:flex;flex-wrap:wrap;gap:2px 4px;margin-bottom:10px;border-bottom:1px solid var(--line);}
.kbge-root .kbge-view-tab{height:32px;border:none;background:transparent;color:var(--muted);font-size:12.5px;font-weight:700;padding:0 14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;}
.kbge-root .kbge-view-tab:hover{color:var(--ink);}
.kbge-root .kbge-view-tab.active{color:var(--ink);border-bottom-color:var(--gold);}
.kbge-root .topLine{min-height:34px;height:auto;display:flex;align-items:flex-start;justify-content:space-between;gap:10px 14px;margin-bottom:10px;padding:0;flex-wrap:wrap;}
.kbge-root .titleBlock{display:flex;align-items:baseline;gap:10px;min-width:220px;flex:1 1 260px;text-align:left;padding-top:5px;}
.kbge-root h1{font-size:18px;line-height:1;margin:0;font-weight:800;letter-spacing:-.04em;color:var(--ink);}
.kbge-root .titleBlock span{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kbge-root .topControls{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:7px;min-width:0;max-width:100%;flex:2 1 680px;}
.kbge-root .search{height:28px;width:250px;max-width:100%;flex:1 1 250px;border:1px solid var(--line);border-radius:6px;padding:0 9px;font-size:12px;background:#fff;color:var(--ink);outline:none;}
.kbge-root .search:focus{border-color:#b7b0a5;box-shadow:0 0 0 2px rgba(154,106,31,.08)}
.kbge-root select{height:28px;border:1px solid var(--line);border-radius:6px;background:#fff;color:#344054;font-size:12px;padding:0 8px;outline:none;}
.kbge-root .miniBtn{height:28px;border:1px solid var(--line);border-radius:6px;background:#fff;color:#344054;font-size:12px;font-weight:700;padding:0 10px;cursor:pointer;}
.kbge-root .miniBtn:hover{border-color:#b7b0a5;color:var(--ink)}
.kbge-root .miniBtn:disabled{opacity:.45;cursor:not-allowed;}
.kbge-root .kbge-pagination{display:flex;align-items:center;justify-content:center;gap:14px;padding:10px 0 2px;}
.kbge-root .kbge-page-info{font-size:12px;color:var(--muted);font-weight:600;}
.kbge-root .miniBtn.active{background:var(--gold);border-color:var(--gold);color:#fff;}
.kbge-root .kbge-bulk-bar{display:flex;align-items:center;gap:10px;padding:8px 12px;margin-bottom:8px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;flex-wrap:wrap;}
.kbge-root .kbge-bulk-count{font-size:12px;font-weight:700;color:#9a3412;}
.kbge-root .kbge-bulk-setto{font-size:12px;color:#9a3412;margin-left:4px;}
.kbge-root .kbge-bulk-saving{font-size:12px;color:#9a3412;font-style:italic;}
.kbge-root .checkboxHead,.kbge-root .checkboxCell{text-align:center;width:36px;}
.kbge-root .checkboxHead input,.kbge-root .checkboxCell input{width:15px;height:15px;cursor:pointer;}
.kbge-root tr.kbge-row-selected{background:#fffbeb;}
.kbge-root .tableWrap{height:calc(100vh - 118px);min-height:320px;background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:auto;box-shadow:0 1px 2px rgba(17,24,39,.04);scroll-behavior:auto;}
.kbge-root .catalogNotice{margin:0;padding:9px 12px;background:#fff7ed;border-bottom:1px solid #fed7aa;font-size:11.5px;line-height:1.4;color:#9a3412;white-space:normal;}
.kbge-root .kbge-config-state{height:calc(100vh - 118px);min-height:320px;background:var(--panel);border:1px solid var(--line);border-radius:10px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:34px;box-shadow:0 1px 2px rgba(17,24,39,.04);}
.kbge-root .kbge-config-kicker{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:8px;}
.kbge-root .kbge-config-title{font-size:22px;font-weight:800;letter-spacing:-.04em;color:var(--ink);margin-bottom:8px;}
.kbge-root .kbge-config-copy{max-width:620px;font-size:13px;line-height:1.65;color:var(--muted);margin-bottom:18px;white-space:normal;}
.kbge-root .kbge-config-copy code{font-size:12px;background:#f8f4eb;border:1px solid var(--line);border-radius:6px;padding:1px 5px;color:var(--gold);}
/* 853bp (Actions-column visibility fix, corrects the 853bo regression):
   min-width reduced from the 1260px regression to 1050px, which fits the
   ~1100px usable desktop table area confirmed in the screenshot. Column
   percentages were rebalanced (see colgroup above) so Actions gets ~24%
   (~252px at this width) - mathematically verified (canvas text-metric
   measurement) to hold all three existing buttons ("Open Group",
   "Mark Posted…", "Edit") on one line with margin to spare, while Group
   keeps a healthy 26% for names/tooltips. */
.kbge-root .groupsTable{width:100%;min-width:920px;border-collapse:collapse;table-layout:fixed;background:#fff;font-size:12px;}
.kbge-root th{position:sticky;top:0;z-index:2;height:26px;padding:5px 8px;text-align:left;background:var(--head);border-bottom:1px solid var(--line);border-right:1px solid var(--line-soft);color:#7a746b;font-size:9.25px;font-weight:800;letter-spacing:.075em;text-transform:uppercase;white-space:nowrap;cursor:pointer;user-select:none;}
.kbge-root th:first-child{padding-left:6px;text-align:left;}
.kbge-root td:first-child{padding-left:6px;text-align:left;}
.kbge-root th:last-child,.kbge-root td:last-child{border-right:none;}
.kbge-root .groupsTable td:last-child{padding-left:5px;padding-right:5px;}
.kbge-root th:hover{color:#111827}
.kbge-root th.sort.desc::after{content:" ↓";font-size:10px;color:var(--gold)}
.kbge-root th.sort.asc::after{content:" ↑";font-size:10px;color:var(--gold)}
/* 853bp: header changed from right-aligned to left-aligned so "Actions"
   sits directly above the visible, left-aligned button group below it
   (previously right-aligned against an oversized column, which is what
   pushed the header itself off-screen in the regression). */
.kbge-root .actionsHead{cursor:default;text-align:left;padding-left:5px;}
.kbge-root td{height:26px;padding:2px 8px;border-bottom:1px solid #f1eee8;border-right:1px solid #f5f2ed;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#202936;line-height:1.05;text-align:left;}
/* 853bp: the Actions column still needs to escape the generic td no-wrap
   rule (so wrapped buttons aren't clipped at narrower widths), but no
   longer relies on overflow:visible to make an oversized column "reach"
   its content - the column itself is now sized to fit, so this is a
   narrow safety allowance, not the primary fix. */
.kbge-root .groupsTable td:last-child{height:auto;min-height:26px;overflow:visible;text-overflow:clip;white-space:normal;vertical-align:middle;}
.kbge-root tr:nth-child(even) td{background:var(--row-alt);}
.kbge-root tr:hover td{background:var(--hover);}
.kbge-root .groupName{display:block;width:100%;font-size:12px;font-weight:800;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.05;letter-spacing:-.01em;text-align:left;margin-left:0;padding-left:0;}
.kbge-root .groupLink{display:none;}
.kbge-root .groupsTable th:first-child,.kbge-root .groupsTable td:first-child,.kbge-root .groupsTable .kbge-root .groupName{padding-left:6px!important;margin-left:0!important;text-align:left!important;}
.kbge-root .groupsTable td:first-child{max-width:0;}

.kbge-root .membersCell{font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;font-size:14px;font-weight:800;color:var(--gold);letter-spacing:-.055em;text-align:left;}
.kbge-root .numCell{font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;font-size:12px;font-weight:800;color:#111827;}
.kbge-root .plainPill{display:inline-flex;align-items:center;height:18px;border:1px solid #e7e2da;border-radius:999px;padding:0 7px;background:#fff;color:#344054;font-size:10px;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;}
.kbge-root .plainPill.joinable{background:#ecfdf5;border-color:#bbf7d0;color:#166534;}
.kbge-root .notesCell{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#5f6672;line-height:1.2;}
.kbge-root .nextPill{display:inline-flex;align-items:center;height:18px;border-radius:999px;padding:0 7px;font-size:9.75px;font-weight:800;border:1px solid #e5e7eb;background:#f9fafb;color:#667085;max-width:100%;overflow:hidden;text-overflow:ellipsis;}
.kbge-root .nextPill.warn{background:var(--amber-bg);border-color:#fde68a;color:var(--amber)}
.kbge-root .nextPill.danger{background:var(--red-bg);border-color:#fecaca;color:var(--red)}
.kbge-root .nextPill.info{background:var(--blue-bg);border-color:#bfdbfe;color:var(--blue)}
.kbge-root .nextPill.success{background:var(--green-bg);border-color:#bbf7d0;color:var(--green)}
/* 853bp: corrects the regression - buttons are now left-aligned starting
   at the visible edge of the Actions cell (justify-content:flex-start)
   instead of right-aligned against the far edge of an oversized column
   that extended past the visible/scrolled area. min-width:max-content
   (which forced the container to be exactly as wide as its unwrapped
   content, fighting the cell's real width) is removed in favor of
   min-width:0, so the flex container stays inside its cell and only
   wraps onto a second line - via flex-wrap - if a narrower viewport
   genuinely can't fit all three buttons on one line. */
.kbge-root .rowActions{display:flex;flex-wrap:nowrap;align-items:center;gap:5px;justify-content:flex-start;min-width:0;width:100%;overflow:visible;padding:3px 0;}
.kbge-root .rowActions button{height:22px;flex:0 0 auto;border:1px solid var(--line);border-radius:5px;background:#fff;color:#344054;font-size:9.75px;font-weight:800;padding:0 7px;cursor:pointer;white-space:nowrap;line-height:1;}
.kbge-root .rowActions button:hover{border-color:#b7b0a5;color:#111827;background:#fbfaf7;}
.kbge-root .rowActions .primaryAction{border-color:#c9a45c;background:#faf6ec;color:#6b4b13;}
.kbge-root .rowActions button:disabled{opacity:.4;cursor:not-allowed;}
.kbge-root .stateCell{height:150px;text-align:center;color:#98a2b3;font-size:13px;}
.kbge-root .errorText{color:var(--red);white-space:normal;}
.kbge-root .toast{position:fixed;right:18px;bottom:18px;background:#111827;color:#fff;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:700;box-shadow:0 12px 34px rgba(17,24,39,.22);z-index:20;}
.kbge-root .toast.error{background:#7f1d1d}.kbge-root .toast.success{background:#14532d}
.kbge-root .modalBack{position:fixed;inset:0;background:rgba(17,24,39,.42);display:flex;align-items:center;justify-content:center;padding:18px;z-index:30;}
.kbge-root .modal{width:min(760px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:12px;border:1px solid var(--line);box-shadow:0 28px 80px rgba(17,24,39,.26);}
.kbge-root .modalHead{height:58px;padding:12px 16px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:10px;}
.kbge-root .modalTitle{font-size:14px;font-weight:800;color:#111827;}.kbge-root .modalSub{font-size:11px;color:#667085;margin-top:2px;}
.kbge-root .xBtn{width:28px;height:28px;border:1px solid var(--line);border-radius:7px;background:#fff;font-size:18px;line-height:1;color:#667085;cursor:pointer;}
/* 853br (Stage 4 Step 2): compact, premium contextual guidance banner shown
   only when the modal is opened via "Next Step…". Deliberately a slim
   single line, not a warning/alert box - gold accent bar matches the
   existing brand palette (var(--gold)) rather than amber/red status colors,
   since this is guidance, not an error or a blocking condition. */
.kbge-root .focusHint{margin:10px 16px 0;padding:8px 12px;border-radius:8px;background:#faf6ec;border:1px solid #ecdfc0;border-left:3px solid var(--gold);color:#5c4b23;font-size:11.5px;font-weight:600;line-height:1.4;}
.kbge-root .modalStats{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid var(--line);background:#f3f4f6;}
.kbge-root .modalStats div{background:#fff;padding:11px 14px;border-right:1px solid var(--line);}.kbge-root .modalStats div:last-child{border-right:none}
.kbge-root .modalStats strong{display:block;font-size:18px;font-weight:800;color:#111827;letter-spacing:-.04em;line-height:1;}.kbge-root .modalStats span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:#98a2b3;margin-top:5px;}
.kbge-root .formGrid{padding:15px 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.kbge-root .field{display:flex;flex-direction:column;gap:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#667085;}.kbge-root .field.wide{grid-column:1/-1;}
.kbge-root .field input,.kbge-root .field select,.kbge-root .field textarea{width:100%;border:1px solid var(--line);border-radius:7px;background:#fff;color:#111827;font-size:12px;font-weight:500;text-transform:none;letter-spacing:0;padding:7px 9px;outline:none;}.kbge-root .field input,.kbge-root .field select{height:32px}.kbge-root .field textarea{resize:vertical;line-height:1.4;}
.kbge-root .field input:focus,.kbge-root .field select:focus,.kbge-root .field textarea:focus{border-color:#b7b0a5;box-shadow:0 0 0 2px rgba(154,106,31,.08)}
.kbge-root .modalFoot{height:52px;padding:10px 16px;border-top:1px solid var(--line);display:flex;align-items:center;gap:7px;}
.kbge-root .spacer{flex:1}.kbge-root .ghostBtn,.kbge-root .darkBtn{height:30px;border-radius:7px;padding:0 11px;font-size:12px;font-weight:800;cursor:pointer}.kbge-root .ghostBtn{border:1px solid var(--line);background:#fff;color:#344054}.kbge-root .darkBtn{border:1px solid #111827;background:#111827;color:#fff}.kbge-root .darkBtn:disabled{opacity:.55;cursor:not-allowed}
@media(max-width:1100px){.kbge-root .optionalCol{display:none}.kbge-root .groupsTable col:nth-child(6),.kbge-root .groupsTable col:nth-child(7){width:0!important}.kbge-root .groupsTable col:nth-child(1){width:21%!important}.kbge-root .groupsTable col:nth-child(5){width:26%!important}.kbge-root .groupsTable col:nth-child(9){width:16%!important}}
@media(max-width:900px){.kbge-root{padding:7px}.kbge-root .topLine{height:auto;align-items:flex-start;flex-direction:column;padding-left:0}.kbge-root .topControls{width:100%;justify-content:flex-start;flex:1 1 auto}.kbge-root .search{width:100%;flex:1 1 220px}.kbge-root .tableWrap{height:calc(100vh - 168px)}.kbge-root .groupsTable{min-width:0}.kbge-root .titleBlock{width:100%;justify-content:flex-start}.kbge-root .titleBlock span{max-width:75%;}.kbge-root .modalStats{grid-template-columns:repeat(2,1fr)}.kbge-root .formGrid{grid-template-columns:1fr}.kbge-root .modalFoot{height:auto;flex-wrap:wrap}.kbge-root .spacer{display:none}}
@media(max-width:680px){.kbge-root .groupsTable col:nth-child(3),.kbge-root .groupsTable th:nth-child(3),.kbge-root .groupsTable td:nth-child(3){display:none}.kbge-root .groupsTable col:nth-child(1){width:25%!important}.kbge-root .groupsTable col:nth-child(5){width:31%!important}.kbge-root .groupsTable col:nth-child(9){width:20%!important}.kbge-root td,.kbge-root th{padding-left:5px;padding-right:5px}.kbge-root .rowActions button{padding:0 5px}}
.kbge-root .fieldError{margin-top:2px;font-size:10.5px;font-weight:700;color:var(--red);text-transform:none;letter-spacing:0;}
.kbge-root .addGroupBtn{font-weight:800;}
`;
