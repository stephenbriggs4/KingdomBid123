import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { withRequestDeadline } from "./supabaseReliability";
import "./styles/church-intelligence.css";

const TABS = [["organizations","Organizations"],["queue","Research Queue"],["sources","Sources"],["health","Data Health"]];

function Empty({ eyebrow, title, detail }) {
  return <div className="ci-empty"><span aria-hidden="true">CI</span><div><p className="ci-eyebrow">{eyebrow}</p><h3>{title}</h3><p>{detail}</p></div></div>;
}

function Metric({ label, value, detail, tone = "" }) {
  return <article className={`ci-metric ${tone}`}><span>{label}</span><strong>{value}</strong><p>{detail}</p></article>;
}

export default function ChurchIntelligence({ currentUser, isAdmin, nav }) {
  const [tab,setTab]=useState("organizations");
  const [organizations,setOrganizations]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [checkedAt,setCheckedAt]=useState(null);

  const refresh=useCallback(async()=>{
    if(!currentUser?.id||!isAdmin)return;
    setLoading(true);setError("");
    try{
      const {data,error:rpcError}=await withRequestDeadline(
        signal=>supabase.rpc("ci_list_organizations",{p_requested_purpose:"research",p_limit:100}).abortSignal(signal),
        {timeoutMs:12000,label:"Church Intelligence organization read"},
      );
      if(rpcError)throw rpcError;
      setOrganizations(Array.isArray(data)?data:[]);setCheckedAt(new Date());
    }catch(err){setOrganizations([]);setError(err?.message||"The private research service did not respond.");}
    finally{setLoading(false);}
  },[currentUser?.id,isAdmin]);
  useEffect(()=>{
    const task=setTimeout(()=>{void refresh();},0);
    return()=>clearTimeout(task);
  },[refresh]);
  const online=!loading&&!error;
  const checked=useMemo(()=>checkedAt?checkedAt.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):"Not checked",[checkedAt]);
  const foundationChecks=useMemo(()=>[
    ["Private RPC boundary",online?"Verified":error?"Unavailable":"Not checked",online?"Admin-authorized research read succeeded.":error||"The private service has not been checked yet."],
    ["Canonical hierarchy","Designed","The approved organization → campus → site constraints require database acceptance-test evidence before this is marked verified."],
    ["Purpose restrictions","Designed","The schema preserves claim-level rights snapshots; no promoted Dallas evidence exists yet to exercise the path."],
    ["Dallas geography","Not populated","No City of Dallas boundary version or membership run has been loaded into Church Intelligence yet."],
    ["Operational ownership","Designed","The bridge contract is defined; no cross-system handoff has been exercised from this workspace."],
    ["Production acquisition","Paused","Intentionally paused until the 50-case gold-set measurement gate."],
  ],[online,error]);

  if(!isAdmin)return <div className="ci-denied"><p className="ci-eyebrow">Internal workspace</p><h1>Church Intelligence is restricted.</h1><p>This research workspace is available only to FaithBid platform administrators.</p><button type="button" onClick={()=>nav?.("projects")}>Back to marketplace</button></div>;

  return <section className="ci-shell" aria-label="Church Intelligence">
    <header className="ci-hero"><div><p className="ci-eyebrow">FaithBid internal · Dallas V1</p><h1>Church Intelligence</h1><p>Build a verified picture of every Dallas church, preserve why each fact can be used, and hand qualified organizations into Growth without creating another CRM.</p></div><div className="ci-actions"><span className={online?"live":""}>{loading?"Checking private service":online?"Private service online":"Service needs attention"}</span><button type="button" onClick={refresh} disabled={loading}>{loading?"Checking…":"Refresh"}</button></div></header>
    <div className="ci-metrics"><Metric label="Canonical organizations" value={organizations.length} detail="Purpose-filtered research records"/><Metric label="Dallas authority" value="Not loaded" detail="City-limits design awaiting an imported version" tone="gold"/><Metric label="Evidence boundary" value="Designed" detail="Awaiting exercised promotion evidence" tone="green"/><Metric label="Operational handoff" value="Not exercised" detail="Growth and Marketplace remain the owners"/></div>
    <nav className="ci-tabs" aria-label="Church Intelligence sections">{TABS.map(([id,label])=><button key={id} type="button" className={tab===id?"active":""} aria-current={tab===id?"page":undefined} onClick={()=>setTab(id)}>{label}</button>)}</nav>
    <div className="ci-panel">
      {tab==="organizations"&&<><div className="ci-panel-head"><div><p className="ci-eyebrow">Canonical research</p><h2>Organizations</h2></div><span>{organizations.length} visible for research</span></div>{loading?<div className="ci-loading" role="status">Loading verified organizations…</div>:error?<div className="ci-alert" role="alert"><div><strong>Church Intelligence could not load.</strong><span>{error}</span></div><button type="button" onClick={refresh}>Try again</button></div>:organizations.length?<div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Organization</th><th>Research state</th><th>Coverage</th></tr></thead><tbody>{organizations.map(row=><tr key={row.id}><td><strong>{row.canonical_name||"Unnamed organization"}</strong><small>{row.id}</small></td><td><span className="ci-status">{row.operating_state||"unknown"}</span></td><td>Research-authorized evidence</td></tr>)}</tbody></table></div>:<Empty eyebrow="Dallas V1" title="The research foundation is ready." detail="No canonical churches have been promoted yet. Acquisition remains intentionally stopped until the Dallas gold-set and measurement gate are approved."/>}</>}
      {tab==="queue"&&<><div className="ci-panel-head"><div><p className="ci-eyebrow">Human review</p><h2>Research Queue</h2></div><span>Acquisition remains gated</span></div><Empty eyebrow="Controlled rollout" title="No Dallas review work has been released yet." detail="Boundary ambiguity, duplicates, corrections, and source conflicts will appear here after the approved gold-set run—not before."/></>}
      {tab==="sources"&&<><div className="ci-panel-head"><div><p className="ci-eyebrow">Evidence policy</p><h2>Sources</h2></div><span>Purpose-scoped by design</span></div><Empty eyebrow="Source registry" title="Source policy is private and evidence-backed." detail="Current source defaults live in the registry while each claim keeps the immutable rights snapshot that applied when it was collected."/></>}
      {tab==="health"&&<><div className="ci-panel-head"><div><p className="ci-eyebrow">Foundation status</p><h2>Data Health</h2></div><span>Last checked {checked}</span></div><div className="ci-health-grid">{foundationChecks.map(([label,status,detail])=><article className="ci-health" key={label}><span className={status==="Verified"?"good":"paused"}>{status}</span><h3>{label}</h3><p>{detail}</p></article>)}</div></>}
    </div>
  </section>;
}
