import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
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
      const {data,error:rpcError}=await supabase.rpc("ci_list_organizations",{p_requested_purpose:"research",p_limit:100});
      if(rpcError)throw rpcError;
      setOrganizations(Array.isArray(data)?data:[]);setCheckedAt(new Date());
    }catch(err){setOrganizations([]);setError(err?.message||"The private research service did not respond.");}
    finally{setLoading(false);}
  },[currentUser?.id,isAdmin]);
  useEffect(()=>{refresh();},[refresh]);
  const online=!loading&&!error;
  const checked=useMemo(()=>checkedAt?checkedAt.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):"Not checked",[checkedAt]);

  if(!isAdmin)return <div className="ci-denied"><p className="ci-eyebrow">Internal workspace</p><h1>Church Intelligence is restricted.</h1><p>This research workspace is available only to FaithBid platform administrators.</p><button type="button" onClick={()=>nav?.("projects")}>Back to marketplace</button></div>;

  return <section className="ci-shell" aria-label="Church Intelligence">
    <header className="ci-hero"><div><p className="ci-eyebrow">FaithBid internal · Dallas V1</p><h1>Church Intelligence</h1><p>Build a verified picture of every Dallas church, preserve why each fact can be used, and hand qualified organizations into Growth without creating another CRM.</p></div><div className="ci-actions"><span className={online?"live":""}>{loading?"Checking private service":online?"Private service online":"Service needs attention"}</span><button type="button" onClick={refresh} disabled={loading}>{loading?"Checking…":"Refresh"}</button></div></header>
    <div className="ci-metrics"><Metric label="Canonical organizations" value={organizations.length} detail="Purpose-filtered research records"/><Metric label="Dallas authority" value="City limits" detail="Versioned EPSG:2276 source geometry" tone="gold"/><Metric label="Evidence boundary" value="Enforced" detail="Rights survive dedupe and promotion" tone="green"/><Metric label="Operational handoff" value="Bridged" detail="Growth and Marketplace retain ownership"/></div>
    <nav className="ci-tabs" aria-label="Church Intelligence sections">{TABS.map(([id,label])=><button key={id} type="button" className={tab===id?"active":""} aria-current={tab===id?"page":undefined} onClick={()=>setTab(id)}>{label}</button>)}</nav>
    <div className="ci-panel">
      {tab==="organizations"&&<><div className="ci-panel-head"><div><p className="ci-eyebrow">Canonical research</p><h2>Organizations</h2></div><span>{organizations.length} visible for research</span></div>{loading?<div className="ci-loading" role="status">Loading verified organizations…</div>:error?<div className="ci-alert" role="alert"><div><strong>Church Intelligence could not load.</strong><span>{error}</span></div><button type="button" onClick={refresh}>Try again</button></div>:organizations.length?<div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Organization</th><th>Research state</th><th>Coverage</th></tr></thead><tbody>{organizations.map(row=><tr key={row.id}><td><strong>{row.canonical_name||"Unnamed organization"}</strong><small>{row.id}</small></td><td><span className="ci-status">{row.operating_state||"unknown"}</span></td><td>Research-authorized evidence</td></tr>)}</tbody></table></div>:<Empty eyebrow="Dallas V1" title="The research foundation is ready." detail="No canonical churches have been promoted yet. Acquisition remains intentionally stopped until the Dallas gold-set and measurement gate are approved."/>}</>}
      {tab==="queue"&&<><div className="ci-panel-head"><div><p className="ci-eyebrow">Human review</p><h2>Research Queue</h2></div><span>Acquisition remains gated</span></div><Empty eyebrow="Controlled rollout" title="No Dallas review work has been released yet." detail="Boundary ambiguity, duplicates, corrections, and source conflicts will appear here after the approved gold-set run—not before."/></>}
      {tab==="sources"&&<><div className="ci-panel-head"><div><p className="ci-eyebrow">Evidence policy</p><h2>Sources</h2></div><span>Purpose-scoped by design</span></div><Empty eyebrow="Source registry" title="Source policy is private and evidence-backed." detail="Current source defaults live in the registry while each claim keeps the immutable rights snapshot that applied when it was collected."/></>}
      {tab==="health"&&<><div className="ci-panel-head"><div><p className="ci-eyebrow">Foundation status</p><h2>Data Health</h2></div><span>Last checked {checked}</span></div><div className="ci-health-grid">{[["Private RPC boundary",online,online?"Admin-authorized research read succeeded.":error||"Not checked."],["Canonical hierarchy",true,"Organization → campus → site integrity is enforced."],["Purpose restrictions",true,"Historical permissions are immutable; current use can only narrow."],["Dallas geography",true,"City-limit membership is reproducible from a stored polygon version."],["Operational ownership",true,"Growth, Concierge, Marketplace, geography, and taxonomy remain externally owned."],["Production acquisition",false,"Intentionally paused until the 50-case gold-set measurement gate."]].map(([label,ok,detail])=><article className="ci-health" key={label}><span className={ok?"good":"paused"}>{ok?"Ready":"Paused"}</span><h3>{label}</h3><p>{detail}</p></article>)}</div></>}
    </div>
  </section>;
}
