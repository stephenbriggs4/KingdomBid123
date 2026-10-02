import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";

let COMPARE_CRITERIA_META, DEFAULT_COMPARE_CRITERIA, KB_BP_MOBILE, KB_BP_TABLET, KB_COMPARE_WORKSPACE_MAX_ITEMS, KB_NAV_SCREENS, KB_PROJECT_OPS_KEY, OperationalAlertList, buildActivityCenterInteropItem, buildActivityCenterNotificationItem, buildActivityCenterProjectItem, buildOperationalAlertFeedItem, buildVendorPairSignals, buildVendorProfileSeed, collectOperationalAlertsForProjects, deriveCanonicalDealState, fetchVendorPairSignalMaps, firstNonEmpty, getCompareWorkspaceCount, getDealStateSummary, getInitialsSafe, getReturnNavigationTarget, listProjectInteropEntries, loadCompareWorkspaceState, logError, makeEmptyVendorPairSignalMaps, normalizeCompareCriteria, normalizeProjectEntity, normalizeProjectOpsSnapshot, queueInboxNavigation, queueProjectNavigation, queueVendorNavigation, readLocalJson, readReturnContext, removeCompareWorkspaceItem, runReturnNavigation, safeArray, saveCompareWorkspaceState, scoreVendorAgainstProject, selectNotificationsSafe, selectUserConversationsSafe, updateNotificationsSafe, useViewportWidth;
const EMPTY_ACTIVITY_ITEMS = Object.freeze([]);

function applyWorkspaceScreenDependencies(dependencies = {}) {
  ({ COMPARE_CRITERIA_META, DEFAULT_COMPARE_CRITERIA, KB_BP_MOBILE, KB_BP_TABLET, KB_COMPARE_WORKSPACE_MAX_ITEMS, KB_NAV_SCREENS, KB_PROJECT_OPS_KEY, OperationalAlertList, buildActivityCenterInteropItem, buildActivityCenterNotificationItem, buildActivityCenterProjectItem, buildOperationalAlertFeedItem, buildVendorPairSignals, buildVendorProfileSeed, collectOperationalAlertsForProjects, deriveCanonicalDealState, fetchVendorPairSignalMaps, firstNonEmpty, getCompareWorkspaceCount, getDealStateSummary, getInitialsSafe, getReturnNavigationTarget, listProjectInteropEntries, loadCompareWorkspaceState, logError, makeEmptyVendorPairSignalMaps, normalizeCompareCriteria, normalizeProjectEntity, normalizeProjectOpsSnapshot, queueInboxNavigation, queueProjectNavigation, queueVendorNavigation, readLocalJson, readReturnContext, removeCompareWorkspaceItem, runReturnNavigation, safeArray, saveCompareWorkspaceState, scoreVendorAgainstProject, selectNotificationsSafe, selectUserConversationsSafe, updateNotificationsSafe, useViewportWidth } = dependencies || {});
}

function CompareWorkspaceScreen({ nav = () => {}, role = '', showToast, currentUser = null }) {
  const viewportWidth = useViewportWidth(1440);
  const isCompact = viewportWidth < KB_BP_TABLET;
  const [workspace, setWorkspace] = useState(() => loadCompareWorkspaceState());
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    const initial = loadCompareWorkspaceState();
    return initial?.linkedProjectId || initial?.projects?.[0]?.id || null;
  });
  const [draftNotes, setDraftNotes] = useState(() => loadCompareWorkspaceState()?.notes || '');
  const [activeTab, setActiveTab] = useState('vendors');

  const syncWorkspace = useCallback(() => {
    const next = loadCompareWorkspaceState();
    setWorkspace(next);
    setDraftNotes(next?.notes || '');
    setSelectedProjectId(prev => prev || next?.linkedProjectId || next?.projects?.[0]?.id || null);
  }, []);

  useEffect(() => {
    const handler = () => syncWorkspace();
    window.addEventListener('storage', handler);
    window.addEventListener('kb:storage-sync', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('kb:storage-sync', handler);
    };
  }, [syncWorkspace]);

  const projects = useMemo(() => Array.isArray(workspace?.projects) ? workspace.projects : [], [workspace]);
  const vendors = useMemo(() => Array.isArray(workspace?.vendors) ? workspace.vendors : [], [workspace]);
  const criteria = normalizeCompareCriteria(workspace?.criteria || DEFAULT_COMPARE_CRITERIA);
  const selectedProject = projects.find(project => String(project?.id || '') === String(selectedProjectId || '')) || projects[0] || null;
  const hasSavedVendorsWithoutProject = vendors.length > 0 && !selectedProject;
  const compareProjectForDeal = useMemo(() => selectedProject ? normalizeProjectEntity(selectedProject) : null, [selectedProject]);
  const compareProjectId = String(compareProjectForDeal?.id || '').trim();
  const [compareVendorPairSignalMaps, setCompareVendorPairSignalMaps] = useState(() => makeEmptyVendorPairSignalMaps());
  const returnTarget = getReturnNavigationTarget(readReturnContext(), role === 'vendor' ? 'my-work' : 'projects');

  useEffect(() => {
    let cancelled = false;
    if (!compareProjectId || !currentUser?.id) {
      Promise.resolve().then(() => {
        if (!cancelled) setCompareVendorPairSignalMaps(makeEmptyVendorPairSignalMaps());
      });
      return () => { cancelled = true; };
    }
    fetchVendorPairSignalMaps({ projectId: compareProjectId, churchId: currentUser?.id })
      .then((maps) => {
        if (cancelled) return;
        setCompareVendorPairSignalMaps(maps || makeEmptyVendorPairSignalMaps());
      })
      .catch(() => {
        if (!cancelled) setCompareVendorPairSignalMaps(makeEmptyVendorPairSignalMaps());
      });
    return () => { cancelled = true; };
  }, [compareProjectId, currentUser?.id]);

  const compareVendorDealStateByKey = useMemo(() => {
    const next = new Map();
    if (!compareProjectForDeal || !compareProjectId || !currentUser?.id) return next;
    const now = new Date().toISOString();
    safeArray(vendors).forEach((vendor) => {
      const vendorKey = String(vendor?.id || vendor?.user_id || vendor?.name || '').trim();
      if (!vendorKey) return;
      const vendorId = String(firstNonEmpty(vendor?.id, vendor?.vendor_id, vendor?.user_id, '')).trim();
      const vendorUserId = String(firstNonEmpty(vendor?.user_id, vendor?.vendor_user_id, vendor?.vendor_id, vendor?.id, '')).trim();
      const engineBucket = buildVendorPairSignals({
        vendorId,
        vendorUserId,
        project: compareProjectForDeal,
        maps: compareVendorPairSignalMaps,
        role: 'church',
        now,
      });
      const engineDealState = deriveCanonicalDealState(engineBucket);
      const dealSummary = getDealStateSummary(engineDealState, { role: 'church', linkedBid: engineBucket?.linkedBid || null });
      next.set(vendorKey, { engineBucket, engineDealState, dealSummary });
    });
    return next;
  }, [vendors, compareProjectForDeal, compareProjectId, compareVendorPairSignalMaps, currentUser?.id]);

  const savedAtLabel = workspace?.updatedAt ? (() => {
    try { return new Date(workspace.updatedAt).toLocaleDateString(undefined, { month:'short', day:'numeric' }); } catch { return 'Saved'; }
  })() : 'Not saved yet';

  const scoredVendors = vendors.map(vendor => {
    const score = selectedProject ? scoreVendorAgainstProject(vendor, selectedProject, criteria) : null;
    return { vendor, score };
  }).sort((a, b) => Number(b?.score?.percent || 0) - Number(a?.score?.percent || 0));

  const leader = scoredVendors.find(item => !item?.score?.rejected) || scoredVendors[0] || null;
  const projectCount = projects.length;
  const vendorCount = vendors.length;
  const hasDecisionSet = projectCount > 0 && vendorCount > 0;
  const decisionReadiness = hasDecisionSet
    ? Math.min(100, 30 + (vendorCount >= 2 ? 40 : 22) + (criteria.length >= 3 ? 18 : 0) + (String(workspace?.notes || '').trim() ? 12 : 0))
    : 0;
  const comparePhaseOneRows = scoredVendors.slice(0, 3).map(({ vendor, score }) => {
    const dealMeta = compareVendorDealStateByKey.get(String(vendor?.id || vendor?.user_id || vendor?.name || '').trim())?.dealSummary || null;
    return {
      vendor,
      name: vendor?.name || 'Vendor',
      category: firstNonEmpty(vendor?.category, vendor?.specialty, vendor?.role, 'Not listed'),
      location: firstNonEmpty(vendor?.city, vendor?.service_area, vendor?.serviceArea, 'Remote / ask'),
      trust: vendor?.verified ? 'Faith Verified' : firstNonEmpty(vendor?.tier, vendor?.trust_tier, 'Open access'),
      proposal: firstNonEmpty(vendor?.proposal_amount, vendor?.bid_amount, vendor?.price, vendor?.budget, selectedProject?.budget, 'No proposal yet'),
      timeline: firstNonEmpty(vendor?.proposed_timeline, vendor?.timeline, selectedProject?.timeline, 'Timeline TBD'),
      projectContext: selectedProject ? firstNonEmpty(selectedProject?.title, selectedProject?.category, 'Selected project') : 'Add project context',
      status: dealMeta?.statusLabel || (score?.rejected ? 'Needs fit review' : 'Ready to compare'),
    };
  });

  const comparePhaseTwoSignals = scoredVendors.slice(0, 3).map(({ vendor, score }, vendorIndex) => {
    const reasons = score?.reasons || {};
    return {
      id: vendor?.id || vendor?.user_id || vendor?.name || `compare-signal-${vendorIndex}`,
      name: vendor?.name || 'Vendor',
      scoreLabel: score ? (score.rejected ? 'Needs fit review' : `${Math.round(score.percent || 0)}% fit`) : 'Add project context',
      fit: reasons.fit || 'Add project context to explain service fit.',
      responsiveness: reasons.timeline || 'Timeline and response history are not documented yet.',
      trust: reasons.trust || (vendor?.verified ? 'Faith Verified vendor.' : 'Trust data not documented yet.'),
      price: reasons.price || 'Proposal/budget fit is not documented yet.',
      tier: score?.tier || (score?.rejected ? 'reject' : 'watch'),
    };
  });
  const refreshFromStorage = () => setWorkspace(loadCompareWorkspaceState());

  const saveNotes = () => {
    const next = saveCompareWorkspaceState({ ...workspace, notes: draftNotes });
    setWorkspace(next);
    showToast && showToast('Compare notes saved');
  };

  const toggleCriterion = (key) => {
    const exists = criteria.includes(key);
    const nextCriteria = exists ? criteria.filter(item => item !== key) : [...criteria, key];
    if (nextCriteria.length === 0) return;
    const next = saveCompareWorkspaceState({ ...workspace, criteria: nextCriteria });
    setWorkspace(next);
  };

  const removeItem = (type, id, label = 'Item') => {
    removeCompareWorkspaceItem(type, id);
    const next = loadCompareWorkspaceState();
    setWorkspace(next);
    if (type === 'projects' && String(selectedProjectId || '') === String(id || '')) setSelectedProjectId(next?.linkedProjectId || next?.projects?.[0]?.id || null);
    showToast && showToast(`${label} removed from compare`);
  };

  const openProject = (project) => {
    if (!project) return;
    queueProjectNavigation(nav, { projectId: project.id, projectTitle: project.title, screen: KB_NAV_SCREENS.projects, returnContext:{ scope:'compare', projectId:project.id, projectTitle:project.title } });
  };

  const openVendor = (vendor) => {
    if (!vendor) return;
    queueVendorNavigation(nav, buildVendorProfileSeed(vendor), { returnContext:{ scope:'compare', projectId:selectedProject?.id || null, projectTitle:selectedProject?.title || null, vendorId:vendor.id || vendor.user_id || null } });
  };

  const openBack = () => runReturnNavigation(readReturnContext(), nav, role === 'vendor' ? 'my-work' : 'projects');

  const fmtScore = (score) => {
    if (!score) return '—';
    if (score.rejected) return 'Needs fit';
    return `${Math.round(score.percent || 0)}%`;
  };

  const criterionLabel = (key) => COMPARE_CRITERIA_META?.[key]?.label || key;
  const criterionHint = (key) => COMPARE_CRITERIA_META?.[key]?.hint || '';

  const shellStyle = {
    minHeight:'calc(100vh - 48px)',
    padding:isCompact ? '20px 16px 42px' : '28px clamp(28px,4vw,56px) 56px',
    background:'radial-gradient(circle at top left, rgba(201,164,92,0.13), transparent 30%), linear-gradient(180deg,#f7efe2 0%,#efe4d3 100%)',
    fontFamily:"var(--font-sans), system-ui, sans-serif",
    color:'#172116',
  };
  const cardStyle = {
    background:'rgba(255,253,248,0.88)',
    border:'1px solid rgba(28,40,20,0.12)',
    borderRadius:24,
    boxShadow:'0 20px 60px rgba(28,40,20,0.10)',
  };
  const eyebrowStyle = { fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase', color:'#9a6a1f' };
  const smallMuted = { fontSize:12.5, lineHeight:1.55, color:'rgba(28,40,20,0.58)' };
  const actionButton = (primary = false) => ({
    height:40,
    borderRadius:999,
    border:primary ? 'none' : '1px solid rgba(28,40,20,0.13)',
    background:primary ? 'linear-gradient(135deg,#172116,#32482c)' : 'rgba(255,253,248,0.78)',
    color:primary ? '#fffdf8' : '#172116',
    padding:'0 16px',
    fontSize:12.5,
    fontWeight:800,
    cursor:'pointer',
    boxShadow:primary ? '0 12px 28px rgba(28,40,20,0.18)' : 'none',
  });

  const emptyState = (
    <div style={{...cardStyle,padding:isCompact ? 26 : 34,textAlign:'center'}}>
      <div style={{width:56,height:56,borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',background:'rgba(176,136,64,0.11)',border:'1px solid rgba(176,136,64,0.20)',fontWeight:800,color:'#9a6a1f'}}>◇</div>
      <div style={{...eyebrowStyle,marginBottom:8}}>Compare workspace</div>
      <div style={{fontFamily:"var(--font-display), serif",fontSize:30,lineHeight:1.05,fontWeight:800,letterSpacing:'-0.035em',marginBottom:10}}>No saved items yet.</div>
      <div style={{...smallMuted,maxWidth:520,margin:'0 auto 20px'}}>Save projects from Marketplace or vendors from the directory and they will appear here as a focused decision board.</div>
      <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
        <button type="button" style={actionButton(true)} onClick={() => nav(role === 'vendor' ? 'projects' : 'projects')}>Browse projects</button>
        <button type="button" style={actionButton(false)} onClick={() => nav('vendors')}>Browse vendors</button>
      </div>
    </div>
  );

  const pickProjectState = (
    <div style={{minHeight:isCompact ? '48vh' : '54vh',display:'flex',alignItems:'center',justifyContent:'center',padding:isCompact ? '34px 4px 54px' : '48px 20px 72px'}}>
      <div style={{width:'100%',maxWidth:760,textAlign:'center'}}>
        <div style={{...eyebrowStyle,marginBottom:10}}>Compare workspace</div>
        <div style={{fontFamily:"var(--font-display), serif",fontSize:isCompact ? 34 : 44,lineHeight:0.98,fontWeight:800,letterSpacing:'-0.055em',color:'#172116',marginBottom:12}}>Which project are you scoring vendors against?</div>
        <div style={{...smallMuted,fontSize:14,maxWidth:560,margin:'0 auto'}}>Scoring, deal status, and fit signals all sharpen once you pick a project.</div>
        {projects.length > 0 ? (
          <div style={{display:'grid',gap:10,maxWidth:640,margin:'26px auto 0',textAlign:'left'}}>
            {projects.map(project => (
              <button type="button" key={project.id || project.title} onClick={() => { setSelectedProjectId(project.id); saveCompareWorkspaceState({ ...workspace, linkedProjectId:project.id }); refreshFromStorage(); }} style={{width:'100%',border:'1px solid rgba(28,40,20,0.12)',borderRadius:20,background:'rgba(255,253,248,0.52)',padding:'16px 18px',textAlign:'left',cursor:'pointer',boxShadow:'0 14px 32px rgba(28,40,20,0.06)'}}>
                <div style={{fontSize:15,fontWeight:800,color:'#172116',letterSpacing:'-0.025em',lineHeight:1.25}}>{project.title || 'Saved project'}</div>
                <div style={{...smallMuted,fontSize:12,marginTop:5}}>{firstNonEmpty(project.budget, project.category, 'Budget TBD')} · {firstNonEmpty(project.category, project.city, 'Project')}</div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{marginTop:26}}>
            <button type="button" style={actionButton(true)} onClick={() => nav('projects')}>Browse my projects</button>
            <div style={{...smallMuted,fontSize:12,marginTop:12}}>Save a project from your project list to start comparing.</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="kb-compare-workspace-root" style={shellStyle}>
      <div style={{maxWidth:1240,margin:'0 auto'}}>
        <section style={{...cardStyle,overflow:'hidden',marginBottom:18,background:'linear-gradient(135deg,#172116 0%,#273d24 58%,#594222 100%)',color:'#fffdf8'}}>
          <div style={{padding:isCompact ? '24px 22px' : '30px 34px',display:'grid',gridTemplateColumns:isCompact ? '1fr' : '1.35fr 0.65fr',gap:22,alignItems:'stretch'}}>
            <div>
              <button type="button" onClick={openBack} style={{border:'1px solid rgba(255,255,255,0.16)',background:'rgba(255,255,255,0.08)',color:'rgba(255,253,248,0.86)',height:32,borderRadius:999,padding:'0 12px',fontSize:11.5,fontWeight:800,cursor:'pointer',marginBottom:16}}>{returnTarget?.label || 'Back'}</button>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.18em',textTransform:'uppercase',color:'#d5b873',marginBottom:8}}>Workspace / Compare</div>
              <h1 style={{fontFamily:"var(--font-display), serif",fontSize:isCompact ? 36 : 48,lineHeight:0.96,letterSpacing:'-0.055em',margin:'0 0 12px'}}>Decision board for projects and vendors.</h1>
              <div style={{fontSize:14,lineHeight:1.65,color:'rgba(255,253,248,0.76)',maxWidth:720}}>Keep saved opportunities, vendor options, scoring criteria, and decision notes in one clean workspace before you message, invite, shortlist, or hire.</div>
            </div>
            <div style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:20,padding:18,display:'flex',flexDirection:'column',justifyContent:'space-between',gap:16}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[['Projects',`${projectCount} / ${KB_COMPARE_WORKSPACE_MAX_ITEMS}`],['Vendors',`${vendorCount} / ${KB_COMPARE_WORKSPACE_MAX_ITEMS}`],['Criteria',criteria.length],['Ready',`${decisionReadiness}%`]].map(([label,value]) => (
                  <div key={label} style={{border:'1px solid rgba(255,255,255,0.10)',borderRadius:16,padding:'12px 12px',background:'rgba(255,255,255,0.06)'}}>
                    <div style={{fontSize:20,fontWeight:800,letterSpacing:'-0.03em'}}>{value}</div>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.13em',textTransform:'uppercase',color:'rgba(255,253,248,0.58)'}}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11.5,color:'rgba(255,253,248,0.64)',display:'flex',justifyContent:'space-between',gap:12}}><span>Last saved</span><strong style={{color:'#fffdf8'}}>{savedAtLabel}</strong></div>
            </div>
          </div>
        </section>

        {projectCount + vendorCount === 0 ? emptyState
        : !selectedProject && !hasSavedVendorsWithoutProject ? pickProjectState
        : (
          <div style={{display:'grid',gridTemplateColumns:isCompact ? '1fr' : '330px minmax(0,1fr) 300px',gap:16,alignItems:'start'}}>
            <aside style={{display:'grid',gap:14}}>
              <section style={{...cardStyle,padding:16}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:12}}>
                  <div>
                    <div style={eyebrowStyle}>Projects</div>
                    <div style={{fontSize:18,fontWeight:800,letterSpacing:'-0.03em'}}>Compare context</div>
                  </div>
                  <button type="button" style={actionButton(false)} onClick={() => nav('projects')}>Add</button>
                </div>
                <div style={{display:'grid',gap:9}}>
                  {projects.length ? projects.map(project => {
                    const active = String((selectedProject || {})?.id || '') === String(project?.id || '');
                    return (
                      <div key={project.id || project.title} style={{border:active ? '1px solid rgba(176,136,64,0.55)' : '1px solid rgba(28,40,20,0.10)',borderRadius:18,background:active ? 'linear-gradient(180deg,#fff8e8,#fffdf8)' : 'rgba(255,253,248,0.72)',padding:12,boxShadow:active ? '0 12px 28px rgba(176,136,64,0.12)' : 'none'}}>
                        <button type="button" onClick={() => { setSelectedProjectId(project.id); saveCompareWorkspaceState({ ...workspace, linkedProjectId:project.id }); refreshFromStorage(); }} style={{width:'100%',border:'none',background:'transparent',padding:0,textAlign:'left',cursor:'pointer'}}>
                          <div style={{fontSize:13.5,fontWeight:800,color:'#172116',letterSpacing:'-0.02em',lineHeight:1.25}}>{project.title || 'Saved project'}</div>
                          <div style={{...smallMuted,fontSize:11.5,marginTop:5}}>{firstNonEmpty(project.category, project.city, 'Project')} · {project.budget || 'Budget TBD'}</div>
                        </button>
                        <div style={{display:'flex',gap:8,marginTop:10}}>
                          <button type="button" onClick={() => openProject(project)} style={{...actionButton(false),height:30,padding:'0 10px',fontSize:11}}>Open</button>
                          <button type="button" onClick={() => removeItem('projects', project.id, project.title || 'Project')} style={{...actionButton(false),height:30,padding:'0 10px',fontSize:11,color:'#8a3324'}}>Remove</button>
                        </div>
                      </div>
                    );
                  }) : <div style={{border:'1px dashed rgba(28,40,20,0.16)',borderRadius:18,padding:18,textAlign:'center',...smallMuted}}>No project saved yet. Vendor snapshots stay visible here; add a project when you want sharper scoring.</div>}
                </div>
              </section>

              <section style={{...cardStyle,padding:16}}>
                <div style={{...eyebrowStyle,marginBottom:10}}>Scoring criteria</div>
                <div style={{display:'grid',gap:8}}>
                  {Object.keys(COMPARE_CRITERIA_META).map(key => {
                    const active = criteria.includes(key);
                    return (
                      <button key={key} type="button" onClick={() => toggleCriterion(key)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,border:active ? '1px solid rgba(176,136,64,0.46)' : '1px solid rgba(28,40,20,0.10)',background:active ? '#fff7e5' : 'rgba(255,253,248,0.68)',borderRadius:14,padding:'10px 11px',textAlign:'left',cursor:'pointer'}}>
                        <span>
                          <span style={{display:'block',fontSize:12.5,fontWeight:800,color:'#172116'}}>{criterionLabel(key)}</span>
                          <span style={{display:'block',fontSize:10.8,color:'rgba(28,40,20,0.50)',marginTop:2}}>{criterionHint(key)}</span>
                        </span>
                        <span style={{width:18,height:18,borderRadius:999,display:'inline-flex',alignItems:'center',justifyContent:'center',background:active ? '#b08840' : 'rgba(28,40,20,0.08)',color:'#fff',fontSize:11,fontWeight:800}}>{active ? '✓' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </aside>

            <section style={{...cardStyle,padding:isCompact ? 16 : 18,minWidth:0}}>
              <div style={{marginBottom:16,padding:14,border:'1px solid rgba(28,40,20,0.10)',borderRadius:18,background:'linear-gradient(180deg,#fffdf8,#fbf5eb)'}}>
                <div style={{display:'flex',alignItems:isCompact ? 'flex-start' : 'center',justifyContent:'space-between',gap:12,marginBottom:10,flexDirection:isCompact ? 'column' : 'row'}}>
                  <div>
                    <div style={eyebrowStyle}>Phase 1 / canonical compare</div>
                    <div style={{fontSize:18,fontWeight:800,letterSpacing:'-0.03em',color:'#172116'}}>Project-contextual vendor facts</div>
                  </div>
                  <div style={{fontSize:11,fontWeight:800,color:'rgba(28,40,20,0.54)',maxWidth:330}}>Existing fields only: proposal, timeline, specialty, trust, status, and selected project context.</div>
                </div>
                {comparePhaseOneRows.length ? (
                  <div style={{overflowX:'auto',border:'1px solid rgba(28,40,20,0.08)',borderRadius:14}}>
                    <table style={{width:'100%',borderCollapse:'collapse',minWidth:780,background:'rgba(255,253,248,0.82)'}}>
                      <thead><tr>{['Vendor','Specialty','Location','Trust','Proposal / budget','Timeline','Status'].map(head => <th key={head} style={{textAlign:'left',padding:'10px 11px',fontSize:9.5,fontWeight:800,letterSpacing:'0.13em',textTransform:'uppercase',color:'rgba(28,40,20,0.52)',borderBottom:'1px solid rgba(28,40,20,0.09)'}}>{head}</th>)}</tr></thead>
                      <tbody>
                        {comparePhaseOneRows.map(row => (
                          <tr key={row.vendor?.id || row.name}>
                            <td style={{padding:'11px',borderBottom:'1px solid rgba(28,40,20,0.07)',fontSize:12.5,fontWeight:800,color:'#172116'}}>{row.name}</td>
                            <td style={{padding:'11px',borderBottom:'1px solid rgba(28,40,20,0.07)',fontSize:12,color:'#56614f'}}>{row.category}</td>
                            <td style={{padding:'11px',borderBottom:'1px solid rgba(28,40,20,0.07)',fontSize:12,color:'#56614f'}}>{row.location}</td>
                            <td style={{padding:'11px',borderBottom:'1px solid rgba(28,40,20,0.07)',fontSize:12,color:'#56614f'}}>{row.trust}</td>
                            <td style={{padding:'11px',borderBottom:'1px solid rgba(28,40,20,0.07)',fontSize:12,color:'#56614f'}}>{row.proposal}</td>
                            <td style={{padding:'11px',borderBottom:'1px solid rgba(28,40,20,0.07)',fontSize:12,color:'#56614f'}}>{row.timeline}</td>
                            <td style={{padding:'11px',borderBottom:'1px solid rgba(28,40,20,0.07)',fontSize:12,fontWeight:800,color:'#2e5f34'}}>{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div style={{...smallMuted,padding:'14px 2px'}}>Add two or three vendors to compare canonical project-fit facts here.</div>}
              </div>
              <div style={{marginBottom:16,padding:14,border:'1px solid rgba(176,136,64,0.16)',borderRadius:18,background:'linear-gradient(180deg,#fffaf0,#fffdf8)'}}>
                <div style={{display:'flex',alignItems:isCompact ? 'flex-start' : 'center',justifyContent:'space-between',gap:12,marginBottom:10,flexDirection:isCompact ? 'column' : 'row'}}>
                  <div>
                    <div style={eyebrowStyle}>Phase 2 / derived intelligence</div>
                    <div style={{fontSize:18,fontWeight:800,letterSpacing:'-0.03em',color:'#172116'}}>Explainable fit signals</div>
                  </div>
                  <div style={{fontSize:11,fontWeight:800,color:'rgba(28,40,20,0.54)',maxWidth:360}}>Deterministic signals from existing scoring fields. Model-backed intelligence stays deferred.</div>
                </div>
                {comparePhaseTwoSignals.length ? (
                  <div style={{display:'grid',gridTemplateColumns:isCompact ? '1fr' : 'repeat(3,minmax(0,1fr))',gap:10}}>
                    {comparePhaseTwoSignals.map(signal => (
                      <div key={signal.id} style={{padding:13,borderRadius:16,border:'1px solid rgba(28,40,20,0.09)',background:'rgba(255,253,248,0.74)',display:'grid',gap:8}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}><span style={{fontSize:12.5,fontWeight:800,color:'#172116'}}>{signal.name}</span><span style={{fontSize:10,fontWeight:800,color:'#8A6729'}}>{signal.scoreLabel}</span></div>
                        {[['Fit',signal.fit],['Response',signal.responsiveness],['Trust',signal.trust],['Price',signal.price]].map(([label,value]) => (
                          <div key={label} style={{fontSize:11.2,lineHeight:1.45,color:'#5f6758'}}><strong style={{color:'#34402f'}}>{label}:</strong> {value}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : <div style={{...smallMuted,padding:'10px 2px'}}>Add vendors to see derived fit signals.</div>}
              </div>
              <div style={{display:'flex',alignItems:isCompact ? 'flex-start' : 'center',justifyContent:'space-between',gap:12,marginBottom:14,flexDirection:isCompact ? 'column' : 'row'}}>
                <div>
                  <div style={eyebrowStyle}>Vendor board</div>
                  <div style={{fontSize:22,fontWeight:800,letterSpacing:'-0.04em'}}>Shortlist comparison</div>
                  <div style={{...smallMuted,marginTop:3}}>{selectedProject ? `Scored against ${selectedProject.title || 'selected project'}` : 'Add a project to make vendor scoring sharper.'}</div>
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button type="button" onClick={() => setActiveTab('vendors')} style={{...actionButton(activeTab === 'vendors'),height:34}}>Vendors</button>
                  <button type="button" onClick={() => setActiveTab('matrix')} style={{...actionButton(activeTab === 'matrix'),height:34}}>Matrix</button>
                  <button type="button" onClick={() => nav('vendors')} style={{...actionButton(false),height:34}}>Add vendor</button>
                </div>
              </div>

              {vendors.length === 0 ? (
                <div style={{border:'1px dashed rgba(28,40,20,0.16)',borderRadius:20,padding:'42px 22px',textAlign:'center',background:'rgba(255,253,248,0.58)'}}>
                  <div style={{fontSize:20,fontWeight:800,marginBottom:6}}>No vendors saved yet</div>
                  <div style={{...smallMuted,maxWidth:430,margin:'0 auto 16px'}}>Save vendors from the directory, bid review, or profile pages and compare them here.</div>
                  <button type="button" style={actionButton(true)} onClick={() => nav('vendors')}>Browse vendors</button>
                </div>
              ) : activeTab === 'matrix' ? (
                <div style={{overflowX:'auto',border:'1px solid rgba(28,40,20,0.10)',borderRadius:18}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:680,background:'rgba(255,253,248,0.72)'}}>
                    <thead>
                      <tr>
                        {['Vendor','Score',...criteria.map(criterionLabel),'Action'].map(head => <th key={head} style={{textAlign:'left',padding:'12px 12px',fontSize:10,fontWeight:800,letterSpacing:'0.13em',textTransform:'uppercase',color:'rgba(28,40,20,0.52)',borderBottom:'1px solid rgba(28,40,20,0.10)'}}>{head}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {scoredVendors.map(({ vendor, score }) => (
                        <tr key={vendor.id || vendor.name}>
                          <td style={{padding:'12px',borderBottom:'1px solid rgba(28,40,20,0.08)',fontSize:13,fontWeight:800}}>{vendor.name || 'Vendor'}</td>
                          <td style={{padding:'12px',borderBottom:'1px solid rgba(28,40,20,0.08)',fontSize:13,fontWeight:800,color:score?.rejected ? '#8a3324' : '#2e5f34'}}>{fmtScore(score)}</td>
                          {criteria.map(key => <td key={key} style={{padding:'12px',borderBottom:'1px solid rgba(28,40,20,0.08)',fontFamily:"var(--font-sans), monospace",fontSize:12,color:'#172116'}}>{score?.checks?.[key] ?? '—'}/10</td>)}
                          <td style={{padding:'12px',borderBottom:'1px solid rgba(28,40,20,0.08)'}}><button type="button" style={{...actionButton(false),height:30,padding:'0 10px',fontSize:11}} onClick={() => openVendor(vendor)}>Open</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{display:'grid',gap:12}}>
                  {scoredVendors.map(({ vendor, score }, index) => (
                    <article key={vendor.id || vendor.name} style={{border:index === 0 ? '1px solid rgba(176,136,64,0.44)' : '1px solid rgba(28,40,20,0.10)',borderRadius:20,padding:14,background:index === 0 ? 'linear-gradient(180deg,#fff8e8,#fffdf8)' : 'rgba(255,253,248,0.76)',boxShadow:index === 0 ? '0 14px 34px rgba(176,136,64,0.12)' : 'none'}}>
                      <div style={{display:'grid',gridTemplateColumns:isCompact ? '1fr' : 'minmax(0,1fr) 120px',gap:12,alignItems:'center'}}>
                        <div style={{display:'flex',gap:12,alignItems:'center',minWidth:0}}>
                          <div style={{width:44,height:44,borderRadius:15,background:vendor.gradient || 'linear-gradient(145deg,#5b7a5e,#3d5940)',color:'#fffdf8',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,letterSpacing:'-0.03em',flex:'0 0 auto'}}>{vendor.initials || getInitialsSafe(vendor.name || 'Vendor','VN')}</div>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:15,fontWeight:800,letterSpacing:'-0.03em',color:'#172116',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{vendor.name || 'Vendor'}</div>
                            <div style={{...smallMuted,fontSize:11.7,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{firstNonEmpty(vendor.role, vendor.category, 'Church vendor')} · {firstNonEmpty(vendor.city, 'Remote')} · {firstNonEmpty(vendor.price, 'Custom proposal')}</div>
                            {Array.isArray(vendor.recommendation_snapshot?.reasons) && vendor.recommendation_snapshot.reasons.length ? (
                              <>
                                <div style={{...smallMuted,fontSize:10.6,lineHeight:1.45,marginTop:3}}>Saved {vendor.recommendation_snapshot.display_date || 'earlier'} with these match signals: {vendor.recommendation_snapshot.reasons.join(' · ')}</div>
                                {String(vendor.recommendation_snapshot.watchout || '').trim() ? <div style={{...smallMuted,fontSize:10.6,lineHeight:1.45,marginTop:2}}>Saved watchout {vendor.recommendation_snapshot.display_date || 'earlier'}: {vendor.recommendation_snapshot.watchout}</div> : null}
                                <div style={{...smallMuted,fontSize:10.2,lineHeight:1.45,marginTop:2}}>Snapshot only; current verification and project facts appear above.</div>
                              </>
                            ) : null}
                            {compareVendorDealStateByKey.get(String(vendor?.id || vendor?.user_id || vendor?.name || '').trim())?.dealSummary?.statusLabel ? <div style={{...smallMuted,fontSize:10.6,lineHeight:1.45,marginTop:3}}>Current status: {compareVendorDealStateByKey.get(String(vendor?.id || vendor?.user_id || vendor?.name || '').trim())?.dealSummary?.statusLabel}</div> : null}
                          </div>
                        </div>
                        <div style={{textAlign:isCompact ? 'left' : 'right'}}>
                          <div style={{fontSize:24,fontWeight:800,letterSpacing:'-0.05em',color:score?.rejected ? '#8a3324' : '#2e5f34'}}>{fmtScore(score)}</div>
                          <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.11em',textTransform:'uppercase',color:'rgba(28,40,20,0.48)'}}>{score?.tier || 'score'}</div>
                        </div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:isCompact ? '1fr 1fr' : 'repeat(4,1fr)',gap:8,marginTop:12}}>
                        {criteria.map(key => (
                          <div key={key} style={{border:'1px solid rgba(28,40,20,0.09)',borderRadius:14,padding:'9px 10px',background:'rgba(255,255,255,0.62)'}}>
                            <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.11em',textTransform:'uppercase',color:'rgba(28,40,20,0.48)'}}>{criterionLabel(key)}</div>
                            <div style={{fontSize:14,fontWeight:800,color:'#172116',marginTop:2}}>{score?.checks?.[key] ?? '—'}/10</div>
                          </div>
                        ))}
                      </div>
                      <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                        <button type="button" style={{...actionButton(true),height:34}} onClick={() => openVendor(vendor)}>Open vendor</button>
                        <button type="button" style={{...actionButton(false),height:34}} onClick={() => removeItem('vendors', vendor.id, vendor.name || 'Vendor')}>Remove</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside style={{display:'grid',gap:14}}>
              <section style={{...cardStyle,padding:16}}>
                <div style={eyebrowStyle}>Recommendation</div>
                <div style={{fontSize:20,fontWeight:800,letterSpacing:'-0.04em',marginTop:5}}>{leader?.vendor?.name ? leader.vendor.name : 'Build the shortlist'}</div>
                <div style={{...smallMuted,marginTop:7}}>{leader?.score?.rejected ? leader.score.rejectionReason : leader?.score?.reasons?.fit || 'Add at least one project and two vendors for a stronger recommendation.'}</div>
                {leader?.vendor ? <button type="button" style={{...actionButton(true),width:'100%',marginTop:14}} onClick={() => openVendor(leader.vendor)}>Review leader</button> : null}
              </section>

              <section style={{...cardStyle,padding:16}}>
                <div style={eyebrowStyle}>Decision notes</div>
                <textarea value={draftNotes} onChange={e => setDraftNotes(e.target.value)} placeholder="Capture why a vendor is leading, what to ask next, or what still needs clarification..." style={{width:'100%',minHeight:156,resize:'vertical',boxSizing:'border-box',marginTop:10,border:'1px solid rgba(28,40,20,0.12)',borderRadius:16,padding:12,background:'rgba(255,253,248,0.78)',fontFamily:"var(--font-sans), system-ui, sans-serif",fontSize:12.5,lineHeight:1.55,color:'#172116',outline:'none'}} />
                <button type="button" style={{...actionButton(true),width:'100%',marginTop:10}} onClick={saveNotes}>Save notes</button>
              </section>

              <section style={{...cardStyle,padding:16}}>
                <div style={eyebrowStyle}>Next paths</div>
                <div style={{display:'grid',gap:8,marginTop:10}}>
                  <button type="button" style={{...actionButton(false),width:'100%',justifyContent:'center'}} onClick={() => nav('inbox')}>Open Inbox</button>
                  <button type="button" style={{...actionButton(false),width:'100%',justifyContent:'center'}} onClick={() => nav(role === 'vendor' ? 'my-work' : 'my-projects')}>Open active work</button>
                  <button type="button" style={{...actionButton(false),width:'100%',justifyContent:'center'}} onClick={() => nav('activity')}>Activity Center</button>
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityCenterScreen({ currentUser, nav = () => {}, role = '', showToast }) {
  const activityReturnTarget = getReturnNavigationTarget(readReturnContext(), "projects");
  const viewportWidth = useViewportWidth(1440);
  // 0165 - was viewportWidth < 620, which is narrower than the canonical
  // phone bottom-nav boundary (KB_BP_MOBILE = 760). Between 621-760px this
  // screen was treating itself as "tablet" (74px bottom padding) while the
  // real phone bottom nav is still visible and needs the full clearance
  // (62px nav + 18px breathing room = 80px minimum before safe-area-inset).
  // Aligning to KB_BP_MOBILE closes that gap without changing anything for
  // widths this screen already classified correctly.
  const isPhone = viewportWidth < KB_BP_MOBILE;
  const isTablet = viewportWidth < 1040;
  const [storedNotifications, setNotifications] = useState([]);
  const [storedConversations, setConversations] = useState([]);
  const [storedProjects, setProjects] = useState([]);
  const [loadedActivityScope, setLoadedActivityScope] = useState("");
  const [opsState, setOpsState] = useState(() => readLocalJson(KB_PROJECT_OPS_KEY, {}));
  const [interopState, setInteropState] = useState(() => listProjectInteropEntries());
  const [feedFilter, setFeedFilter] = useState('all');
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const currentActivityScope = currentUser?.id ? `${currentUser.id}:${role || "church"}` : "";

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    (async() => {
      try {
        const [notifRes, convoRes, projectRes] = await Promise.all([
          selectNotificationsSafe(query => query.select('*').eq('user_id', currentUser.id).order('created_at', { ascending:false }).limit(20), [], { timeoutMs:4500, quietTimeout:true }),
          selectUserConversationsSafe(currentUser.id, query => query.order('last_message_at',{ascending:false}).limit(20), { limit: 20 }),
          role === 'vendor'
            ? supabase.from('bids').select('project_id,vendor_id,vendor_name,status,projects(id,title,status,budget,church_name,city,posted_at)').eq('vendor_id', currentUser.id).eq('status','hired').limit(20)
            : supabase.from('projects').select('id,title,status,budget,posted_at,church_name,city').eq('church_id', currentUser.id).order('posted_at',{ascending:false}).limit(20),
        ]);
        if (cancelled) return;
        setNotifications(notifRes.data || []);
        setConversations(convoRes.data || []);
        setProjects((projectRes.data || []).map(row => row.projects ? normalizeProjectEntity(row.projects) : normalizeProjectEntity(row)).filter(Boolean));
        setLoadedActivityScope(currentActivityScope);
      } catch(err) {
        logError('activity-center-fetch', err);
        if (cancelled) return;
        setNotifications([]);
        setConversations([]);
        setProjects([]);
        setLoadedActivityScope(currentActivityScope);
      }
    })();
    const sync = () => {
      setOpsState(readLocalJson(KB_PROJECT_OPS_KEY, {}));
      setInteropState(listProjectInteropEntries());
    };
    window.addEventListener('storage', sync);
    window.addEventListener('kb:storage-sync', sync);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', sync);
      window.removeEventListener('kb:storage-sync', sync);
    };
  }, [currentUser?.id, role, currentActivityScope]);

  const activityDataIsCurrent = !!currentActivityScope && loadedActivityScope === currentActivityScope;
  const notifications = activityDataIsCurrent ? storedNotifications : EMPTY_ACTIVITY_ITEMS;
  const conversations = activityDataIsCurrent ? storedConversations : EMPTY_ACTIVITY_ITEMS;
  const projects = activityDataIsCurrent ? storedProjects : EMPTY_ACTIVITY_ITEMS;
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const normalizedOpsEntries = Object.entries(opsState || {}).map(([projectId, value]) => {
    const project = projects.find(item => String(item?.id || '') === String(projectId)) || { id:projectId };
    return normalizeProjectOpsSnapshot(project, value || {});
  });
  const pendingApprovals = normalizedOpsEntries.flatMap(v => v?.approvals || []).filter(a => a?.status === 'pending');
  const currentMilestones = normalizedOpsEntries.flatMap(v => v?.milestones || []).filter(m => m?.status === 'current');
  const operationalAlerts = collectOperationalAlertsForProjects(projects, opsState, role);
  const closeoutAlerts = operationalAlerts.filter(alert => String(alert.key || '').includes('closeout')).length;
  const preferredInboxConversation = useMemo(() => {
    const list = Array.isArray(conversations) ? conversations : [];
    return list.find(item => item?.id) || null;
  }, [conversations]);

  const markNotificationRead = async (notificationId) => {
    if (!notificationId || !currentUser?.id) return;
    try {
      const { error } = await updateNotificationsSafe(query => query.update({ read:true }).eq('id', notificationId).eq('user_id', currentUser.id));
      if (error) throw error;
      setNotifications(prev => prev.map(item => item.id === notificationId ? { ...item, read:true } : item));
    } catch(err){
      logError('notification-mark-read', err, { notificationId, userId: currentUser.id });
    }
  };

  const interopFeed = Object.entries(interopState || {}).map(([projectId, entry]) => buildActivityCenterInteropItem(projectId, entry, nav)).filter(Boolean).slice(0, 8);
  const projectFeed = projects.slice(0, 5).map(project => buildActivityCenterProjectItem(project, nav));
  const notificationFeed = notifications.slice(0, 9).map(notification => buildActivityCenterNotificationItem(notification, { nav, markRead:markNotificationRead, role }));
  const operationalFeed = operationalAlerts.slice(0, 9).map(alert => buildOperationalAlertFeedItem(alert, nav));
  const feed = [...operationalFeed, ...notificationFeed, ...interopFeed, ...projectFeed].slice(0, 16);

  const categoryCounts = feed.reduce((acc, item) => {
    const key = item?.category || 'notification';
    acc[key] = (acc[key] || 0) + 1;
    if (item?.unread) acc.unread = (acc.unread || 0) + 1;
    return acc;
  }, { all: feed.length, unread: 0 });

  const filteredFeed = feedFilter === 'all'
    ? feed
    : feedFilter === 'unread'
      ? feed.filter(item => item.unread)
      : feed.filter(item => item.category === feedFilter);

  const markAllRead = async () => {
    if (!currentUser?.id || !unreadNotifs || markingAllRead) return;
    setMarkingAllRead(true);
    try {
      const { error } = await updateNotificationsSafe(query => query.update({ read:true }).eq('user_id', currentUser.id).eq('read', false));
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, read:true })));
    } catch (err) {
      logError('notifications-mark-all-read', err, { userId: currentUser.id });
      showToast && showToast("Couldn't mark notifications read — please try again.", "error");
    } finally {
      setMarkingAllRead(false);
    }
  };

  const openInbox = () => queueInboxNavigation(nav, {
    target: preferredInboxConversation ? {
      conversationId:preferredInboxConversation.id,
      projectId:preferredInboxConversation.project_id || null,
      projectTitle:preferredInboxConversation.project_title || null,
      churchId:preferredInboxConversation.church_id || null,
      churchName:preferredInboxConversation.church_name || null,
      vendorId:preferredInboxConversation.vendor_id || null,
      vendorName:preferredInboxConversation.vendor_name || null,
    } : null,
    returnContext:{ scope:'activity', screen:'activity' },
  });

  const openWork = () => nav(role === 'vendor' ? 'my-work' : 'my-projects');
  const savedCount = getCompareWorkspaceCount();
  const activeProjectLabel = role === 'vendor' ? 'Hired projects' : 'Posted projects';
  const strongestSignal = operationalAlerts[0] || null;
  const nextSignalText = strongestSignal?.title || (unreadNotifs ? `${unreadNotifs} unread update${unreadNotifs === 1 ? '' : 's'}` : 'No urgent signal stacked');

  const metricCards = [
    {
      label:'Unread',
      value:unreadNotifs,
      body:'Fresh notifications and deal-room messages that have not been cleared.',
      tone:'gold',
      run:()=>setFeedFilter('unread'),
    },
    {
      label:'Execution',
      value:operationalAlerts.length,
      body:'Approvals, payment checkpoints, disputes, and closeout items.',
      tone:'danger',
      run:()=>setFeedFilter('alert'),
    },
    {
      label:'Saved',
      value:savedCount,
      body:'Projects and vendors parked in the compare workspace.',
      tone:'sage',
      run:()=>nav('compare'),
    },
    {
      label:'Milestones',
      value:currentMilestones.length,
      body:'Live delivery steps currently moving through the workspace.',
      tone:'navy',
      run:openWork,
    },
  ];

  const feedFilters = [
    ['all','All',categoryCounts.all || 0],
    ['unread','Unread',categoryCounts.unread || 0],
    ['alert','Execution',categoryCounts.alert || 0],
    ['deal','Deal room',categoryCounts.deal || 0],
    ['project','Projects',categoryCounts.project || 0],
    ['notification','Notices',categoryCounts.notification || 0],
  ];

  const toneMeta = (tone) => {
    if (tone === 'danger') return { accent:'#a53b2d', soft:'rgba(165,59,45,0.09)', border:'rgba(165,59,45,0.18)', glow:'rgba(165,59,45,0.10)' };
    if (tone === 'sage') return { accent:'#607452', soft:'rgba(96,116,82,0.10)', border:'rgba(96,116,82,0.18)', glow:'rgba(96,116,82,0.10)' };
    if (tone === 'navy') return { accent:'#1C2814', soft:'rgba(28,40,20,0.08)', border:'rgba(28,40,20,0.16)', glow:'rgba(28,40,20,0.08)' };
    return { accent:'#b08840', soft:'rgba(176,136,64,0.11)', border:'rgba(176,136,64,0.20)', glow:'rgba(176,136,64,0.10)' };
  };

  const feedTone = (category) => {
    if (category === 'alert') return { accent:'#a53b2d', icon:'!' };
    if (category === 'deal') return { accent:'#607452', icon:'↗' };
    if (category === 'project') return { accent:'#1C2814', icon:'□' };
    return { accent:'#b08840', icon:'•' };
  };

  const shellPadding = isPhone ? '20px 16px 64px' : isTablet ? '24px 24px 74px' : '30px 34px 84px';
  const heroGrid = isTablet ? '1fr' : 'minmax(0, 1fr) 360px';
  const bodyGrid = isTablet ? '1fr' : 'minmax(0, 1fr) 360px';
  const metricGrid = isPhone ? '1fr' : viewportWidth < 920 ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))';

  return (
    <div className="kb-activity-center-root" style={{background:'linear-gradient(180deg,#f7f2e8 0%,#f4eee3 45%,#efe6d8 100%)',minHeight:'100vh',padding:shellPadding}}>
      <div style={{maxWidth:1380,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:18,flexWrap:'wrap'}}>
          <button type='button' onClick={()=>nav(activityReturnTarget?.screen || 'projects')} style={{height:36,padding:'0 14px',borderRadius:999,border:'1px solid rgba(28,40,20,0.12)',background:'#fffdf8',fontSize:12.5,fontWeight:700,color:'#1C2814',cursor:'pointer',boxShadow:'0 2px 8px rgba(28,40,20,0.045)',display:'inline-flex',alignItems:'center',gap:7}}>← {activityReturnTarget?.label || 'Workspace'}</button>
          <div style={{fontSize:12.5,color:'rgba(28,40,20,0.46)',fontWeight:600}}>{activityReturnTarget?.label || 'Workspace'} <span style={{color:'rgba(176,136,64,0.60)'}}>·</span> <span style={{color:'#1C2814'}}>Activity Center</span></div>
        </div>

        <section style={{position:'relative',overflow:'hidden',borderRadius:26,border:'1px solid rgba(28,40,20,0.12)',background:'linear-gradient(135deg,#fffdf8 0%,#f8efe0 58%,#efe3cf 100%)',boxShadow:'0 18px 56px rgba(28,40,20,0.10)',marginBottom:18}}>
          <div style={{position:'absolute',right:-120,top:-140,width:340,height:340,borderRadius:'50%',background:'radial-gradient(circle,rgba(176,136,64,0.18),rgba(176,136,64,0) 66%)',pointerEvents:'none'}} />
          <div style={{display:'grid',gridTemplateColumns:heroGrid,gap:24,padding:isPhone ? '24px 20px' : '30px 32px',alignItems:'end',position:'relative'}}>
            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,height:30,padding:'0 11px',borderRadius:999,border:'1px solid rgba(176,136,64,0.22)',background:'rgba(176,136,64,0.10)',fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'#9a6a1f',marginBottom:14}}>Workspace signal desk</div>
              <h1 style={{fontFamily:"var(--font-display), serif",fontSize:'clamp(36px,4.7vw,62px)',fontWeight:400,letterSpacing:'-0.045em',lineHeight:0.97,color:'#1C2814',margin:'0 0 12px'}}>Activity without the noise.</h1>
              <p style={{fontSize:15.5,color:'rgba(28,40,20,0.64)',maxWidth:700,lineHeight:1.72,margin:0}}>A cleaner command layer for unread deal-room messages, project signals, active milestones, saved decisions, and execution alerts.</p>
            </div>
            <div style={{background:'rgba(28,40,20,0.94)',border:'1px solid rgba(255,255,255,0.10)',borderRadius:22,padding:20,color:'#fffdf8',boxShadow:'0 16px 38px rgba(28,40,20,0.18)'}}>
              <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'#d2ad62',marginBottom:10}}>Next best action</div>
              <div style={{fontFamily:"var(--font-display), serif",fontSize:27,fontWeight:500,letterSpacing:'-0.025em',lineHeight:1.04,marginBottom:9}}>{nextSignalText}</div>
              <div style={{fontSize:13,color:'rgba(255,253,248,0.68)',lineHeight:1.58,marginBottom:16}}>{strongestSignal?.body || 'Open the feed when something needs attention, or jump straight into your latest inbox thread.'}</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button type='button' onClick={openInbox} style={{height:40,padding:'0 15px',borderRadius:12,border:'none',background:'linear-gradient(180deg,#c9a45c,#a97827)',color:'#fff',fontSize:12.5,fontWeight:800,cursor:'pointer'}}>Open inbox →</button>
                <button type='button' onClick={openWork} style={{height:40,padding:'0 14px',borderRadius:12,border:'1px solid rgba(255,255,255,0.16)',background:'rgba(255,255,255,0.07)',color:'#fffdf8',fontSize:12.5,fontWeight:800,cursor:'pointer'}}>{role === 'vendor' ? 'My work' : 'My projects'}</button>
              </div>
            </div>
          </div>
        </section>

        <div style={{display:'grid',gridTemplateColumns:metricGrid,gap:12,marginBottom:18}}>
          {metricCards.map(card => {
            const meta = toneMeta(card.tone);
            return (
              <button key={card.label} type='button' onClick={card.run} style={{position:'relative',overflow:'hidden',minHeight:132,textAlign:'left',borderRadius:20,border:`1px solid ${meta.border}`,background:'#fffdf8',padding:'17px 18px',boxShadow:'0 8px 24px rgba(28,40,20,0.055)',cursor:'pointer',transition:'transform .16s ease, box-shadow .16s ease, border-color .16s ease'}}
                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 16px 34px ${meta.glow}`; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 24px rgba(28,40,20,0.055)'; }}>
                <div style={{position:'absolute',right:-28,top:-28,width:92,height:92,borderRadius:'50%',background:meta.soft}} />
                <div style={{position:'relative',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:14}}>
                  <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:meta.accent}}>{card.label}</div>
                  <span style={{width:28,height:28,borderRadius:10,background:meta.soft,border:`1px solid ${meta.border}`,display:'inline-flex',alignItems:'center',justifyContent:'center',color:meta.accent,fontWeight:800}}>→</span>
                </div>
                <div style={{position:'relative',fontFamily:"var(--font-display), serif",fontSize:34,fontWeight:500,letterSpacing:'-0.04em',lineHeight:1,color:'#1C2814',marginBottom:8}}>{card.value}</div>
                <div style={{position:'relative',fontSize:12.5,color:'rgba(28,40,20,0.58)',lineHeight:1.5}}>{card.body}</div>
              </button>
            );
          })}
        </div>

        <div style={{display:'grid',gridTemplateColumns:bodyGrid,gap:18,alignItems:'start'}}>
          <section style={{background:'#fffdf8',border:'1px solid rgba(28,40,20,0.12)',borderRadius:24,overflow:'hidden',boxShadow:'0 12px 34px rgba(28,40,20,0.08)'}}>
            <div style={{padding:isPhone ? '18px 18px 14px' : '20px 22px 16px',borderBottom:'1px solid rgba(28,40,20,0.08)',background:'linear-gradient(180deg,#fffdf8,#fbf5eb)'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexWrap:'wrap',marginBottom:14}}>
                <div>
                  <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b08840',marginBottom:6}}>Priority feed</div>
                  <div style={{fontFamily:"var(--font-display), serif",fontSize:28,fontWeight:500,color:'#1C2814',letterSpacing:'-0.03em',lineHeight:1}}>What moved recently</div>
                </div>
                <button type='button' disabled={!unreadNotifs || markingAllRead} onClick={markAllRead} style={{height:34,padding:'0 13px',borderRadius:999,border:'1px solid rgba(28,40,20,0.12)',background:'#fff',color:!unreadNotifs?'#aaa49a':'#1C2814',fontSize:11.5,fontWeight:800,cursor:!unreadNotifs?'not-allowed':'pointer'}}>{markingAllRead ? 'Marking…' : 'Mark all read'}</button>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                {feedFilters.map(([key,label,count]) => (
                  <button key={key} type='button' onClick={()=>setFeedFilter(key)} style={{height:32,padding:'0 12px',borderRadius:999,border:`1px solid ${feedFilter===key?'#1C2814':'rgba(28,40,20,0.12)'}`,background:feedFilter===key?'#1C2814':'#fffdf8',color:feedFilter===key?'#fffdf8':'rgba(28,40,20,0.66)',fontSize:11.5,fontWeight:800,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:7}}>
                    <span>{label}</span>
                    <span style={{minWidth:20,height:20,padding:'0 6px',borderRadius:999,display:'inline-flex',alignItems:'center',justifyContent:'center',background:feedFilter===key?'rgba(255,255,255,0.12)':'rgba(28,40,20,0.055)',fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800}}>{count}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{padding:isPhone ? 14 : 16}}>
              {filteredFeed.length ? (
                <div style={{display:'grid',gap:10}}>
                  {filteredFeed.map(item => {
                    const meta = feedTone(item.category);
                    return (
                      <button key={item.key} type='button' onClick={item.run} style={{width:'100%',display:'grid',gridTemplateColumns:isPhone ? '34px minmax(0,1fr)' : '40px minmax(0,1fr) auto',gap:13,alignItems:'start',textAlign:'left',padding:isPhone ? '13px 13px' : '15px 16px',borderRadius:18,border:`1px solid ${item.unread ? 'rgba(176,136,64,0.25)' : 'rgba(28,40,20,0.08)'}`,background:item.unread ? 'linear-gradient(180deg,#fffaf0,#fffdf8)' : '#fff',boxShadow:item.unread ? '0 10px 24px rgba(176,136,64,0.08)' : '0 1px 2px rgba(28,40,20,0.035)',cursor:'pointer',transition:'transform .16s ease, box-shadow .16s ease, border-color .16s ease'}}
                        onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 14px 28px rgba(28,40,20,0.075)'; e.currentTarget.style.borderColor='rgba(176,136,64,0.22)'; }}
                        onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=item.unread ? '0 10px 24px rgba(176,136,64,0.08)' : '0 1px 2px rgba(28,40,20,0.035)'; e.currentTarget.style.borderColor=item.unread ? 'rgba(176,136,64,0.25)' : 'rgba(28,40,20,0.08)'; }}>
                        <span style={{width:40,height:40,borderRadius:14,display:'inline-flex',alignItems:'center',justifyContent:'center',background:`${meta.accent}12`,border:`1px solid ${meta.accent}24`,color:meta.accent,fontSize:15,fontWeight:800,marginTop:1}}>{meta.icon}</span>
                        <span style={{minWidth:0}}>
                          <span style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                            <span style={{fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:meta.accent}}>{item.kind}</span>
                            {item.unread ? <span style={{height:20,padding:'0 7px',borderRadius:999,background:'rgba(176,136,64,0.10)',border:'1px solid rgba(176,136,64,0.18)',display:'inline-flex',alignItems:'center',fontSize:10,fontWeight:800,color:'#9a6a1f'}}>Unread</span> : null}
                          </span>
                          <span style={{display:'block',fontSize:15,fontWeight:800,color:'#1C2814',lineHeight:1.35,letterSpacing:'-0.01em',marginBottom:4,wordBreak:'break-word'}}>{item.title}</span>
                          <span style={{display:'block',fontSize:12.8,color:'rgba(28,40,20,0.57)',lineHeight:1.55,wordBreak:'break-word'}}>{item.body}</span>
                        </span>
                        {!isPhone ? <span style={{alignSelf:'center',fontSize:11,fontWeight:800,color:'rgba(28,40,20,0.32)',letterSpacing:'0.10em',textTransform:'uppercase'}}>{item.category}</span> : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{padding:'54px 24px',textAlign:'center',border:'1px dashed rgba(28,40,20,0.14)',borderRadius:22,background:'rgba(255,253,248,0.62)'}}>
                  <div style={{width:56,height:56,borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',background:'rgba(176,136,64,0.10)',border:'1px solid rgba(176,136,64,0.18)',color:'#9a6a1f',fontSize:22,fontWeight:800}}>✓</div>
                  <div style={{fontFamily:"var(--font-display), serif",fontSize:24,fontWeight:500,color:'#1C2814',letterSpacing:'-0.02em',marginBottom:7}}>Nothing in this lane.</div>
                  <div style={{fontSize:13,color:'rgba(28,40,20,0.58)',lineHeight:1.65,maxWidth:420,margin:'0 auto 18px'}}>Change the filter, open your inbox, or browse the marketplace to keep work moving.</div>
                  <div style={{display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap'}}>
                    <button type='button' onClick={()=>setFeedFilter('all')} style={{height:40,padding:'0 16px',borderRadius:12,border:'none',background:'linear-gradient(180deg,#c9a45c,#b08840)',color:'#fff',fontSize:12.5,fontWeight:800,cursor:'pointer'}}>Show all activity</button>
                    <button type='button' onClick={openInbox} style={{height:40,padding:'0 16px',borderRadius:12,border:'1px solid rgba(28,40,20,0.12)',background:'#fff',color:'#1C2814',fontSize:12.5,fontWeight:800,cursor:'pointer'}}>Open inbox</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside style={{display:'grid',gap:14,position:isTablet ? 'relative' : 'sticky',top:82}}>
            <section style={{background:'#fffdf8',border:'1px solid rgba(28,40,20,0.12)',borderRadius:22,padding:20,boxShadow:'0 12px 34px rgba(28,40,20,0.07)'}}>
              <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b08840',marginBottom:8}}>Execution stack</div>
              <div style={{fontFamily:"var(--font-display), serif",fontSize:25,fontWeight:500,color:'#1C2814',letterSpacing:'-0.03em',lineHeight:1.04,marginBottom:8}}>What needs action?</div>
              <div style={{fontSize:13,color:'rgba(28,40,20,0.58)',lineHeight:1.6,marginBottom:14}}>Approvals, payment coordination, disputes, and closeout steps are separated from passive notifications.</div>
              <OperationalAlertList alerts={operationalAlerts} max={4} compact onOpen={(alert)=>alert?.projectId ? queueProjectNavigation(nav, { projectId:alert.projectId, screen:KB_NAV_SCREENS.projects }) : openWork()} emptyLabel='No execution alerts are stacked right now.' />
            </section>

            <section style={{background:'linear-gradient(135deg,#1C2814,#2b3621)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:22,padding:22,color:'#fffdf8',boxShadow:'0 18px 44px rgba(28,40,20,0.22)'}}>
              <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'#d2ad62',marginBottom:10}}>Decision context</div>
              <div style={{fontFamily:"var(--font-display), serif",fontSize:25,fontWeight:500,letterSpacing:'-0.03em',lineHeight:1.05,marginBottom:10}}>Where should you look next?</div>
              <div style={{fontSize:13,color:'rgba(255,253,248,0.68)',lineHeight:1.65,marginBottom:16}}>Keep this page focused: unread, execution, saved decisions, and live delivery signals.</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[
                  { label:'Approvals', value:pendingApprovals.length },
                  { label:'Closeout', value:closeoutAlerts },
                  { label:'Saved', value:savedCount },
                  { label:activeProjectLabel, value:projects.length },
                ].map(row => (
                  <div key={row.label} style={{borderRadius:14,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.10)',padding:'12px 12px'}}>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(255,253,248,0.54)',marginBottom:5}}>{row.label}</div>
                    <div style={{fontFamily:"var(--font-display), serif",fontSize:25,fontWeight:600,color:'#d2ad62',lineHeight:1}}>{row.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{background:'#fffdf8',border:'1px solid rgba(28,40,20,0.12)',borderRadius:22,padding:20,boxShadow:'0 12px 34px rgba(28,40,20,0.06)'}}>
              <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b08840',marginBottom:12}}>Shortcuts</div>
              <div style={{display:'grid',gap:8}}>
                {[
                  { label: role === 'vendor' ? 'Open My Work' : 'Open My Projects', run:openWork },
                  { label:'Open Marketplace', run:()=>nav('projects') },
                  { label:'Jump into Inbox', run:openInbox },
                  { label:'Compare Workspace', run:()=>nav('compare') },
                ].map(item => (
                  <button key={item.label} type='button' onClick={item.run} style={{height:43,padding:'0 14px',borderRadius:13,border:'1px solid rgba(28,40,20,0.10)',background:'#fff',fontSize:13,fontWeight:800,color:'#1C2814',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span>{item.label}</span>
                    <span style={{color:'#b08840',fontSize:14,fontWeight:800}}>→</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function CompareWorkspaceScreenRoute({ dependencies, ...props }) {
  applyWorkspaceScreenDependencies(dependencies);
  return <CompareWorkspaceScreen {...props} />;
}

export function ActivityCenterScreenRoute({ dependencies, ...props }) {
  applyWorkspaceScreenDependencies(dependencies);
  return <ActivityCenterScreen {...props} />;
}
