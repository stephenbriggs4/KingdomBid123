import React, { useState } from "react";

export default function QAConsoleScreen({ currentUser, userProfile, nav, role, dependencies }) {
  const {
    getLaunchClientConfigChecks,
    getProjectDataQuality,
    getVendorDataQuality,
    isAdminUser,
    KB_STORAGE_SCHEMA_VERSION,
    kbIsDevRuntime,
    LAUNCH_READINESS_TABLE_CHECKS,
    listProjectInteropEntries,
    loadCompareWorkspaceState,
    logError,
    MANUAL_BACKEND_RELEASE_CHECKS,
    normalizeProjectEntity,
    normalizeVendorEntity,
    PLATFORM_RELEASE,
    queueActivityNavigation,
    readPersistenceManifest,
    runLaunchReadinessTableCheck,
    sendReferenceEmail,
    sendWaitlistEmail,
  } = dependencies;
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const hasQaAccess = isAdminUser(currentUser, userProfile);
  const safeNav = typeof nav === 'function' ? nav : () => {};
  const summarize = (checks = []) => {
    const passCount = checks.filter(item => item.ok).length;
    const blockers = checks.filter(item => !item.ok && item.severity === 'critical').length;
    const warnings = checks.filter(item => !item.ok && item.severity !== 'critical').length;
    const score = checks.length ? Math.round((passCount / checks.length) * 100) : 0;
    const state = !checks.length ? 'Not run yet' : blockers ? 'Blocked' : warnings ? 'Ship with caution' : 'Ready';
    return { passCount, blockers, warnings, score, state };
  };
  const summary = summarize(results);

  if (!hasQaAccess) {
    return (
      <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#fffdf8 0%,#fbf5e8 100%)',padding:'28px 22px'}}>
        <button type="button" onClick={() => safeNav(role === 'vendor' ? 'my-work' : 'my-projects')} style={{border:'1px solid #dfd5c2',background:'#fffdf8',borderRadius:999,padding:'9px 14px',fontSize:12,fontWeight:800,color:'#1C2814',cursor:'pointer',marginBottom:18}}>← Back to workspace</button>
        <div style={{maxWidth:720,margin:'40px auto',border:'1px solid rgba(197,48,48,0.16)',background:'#fffdf8',borderRadius:24,boxShadow:'0 22px 70px rgba(28,40,20,0.08)'}}>
          <div style={{padding:32,textAlign:'center'}}>
            <div style={{width:52,height:52,borderRadius:18,background:'rgba(197,48,48,0.08)',color:'#C53030',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:24}}>!</div>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:800,color:'#1C2814',marginBottom:8}}>QA Console is admin-only</div>
            <div style={{fontSize:14,color:'#7d7363',lineHeight:1.7,maxWidth:520,margin:'0 auto 20px'}}>
              This area runs internal schema and platform health checks. It is hidden from normal church and vendor accounts.
            </div>
            <button type="button" onClick={() => safeNav('projects')} style={{border:'none',borderRadius:999,background:'linear-gradient(135deg,#1C2814,#2b3a22)',color:'#f5ead6',padding:'11px 18px',fontSize:13,fontWeight:800,cursor:'pointer',boxShadow:'0 12px 26px rgba(28,40,20,0.14)'}}>Open marketplace</button>
          </div>
        </div>
      </div>
    );
  }

  const runChecks = async () => {
    if (!hasQaAccess) return;
    setRunning(true);
    const checks = [];
    const push = (label, ok, detail = '', severity = 'critical') => checks.push({ label, ok, detail, severity });
    try {
    const manifest = readPersistenceManifest();
    try { push('Current user loaded', !!currentUser?.id, currentUser?.id ? 'Authenticated session found' : 'No active user'); } catch { push('Current user loaded', false, 'User check crashed'); }
    try {
      push('Storage schema current', Number(manifest?.schemaVersion || 0) >= KB_STORAGE_SCHEMA_VERSION, manifest?.schemaVersion ? `Schema v${manifest.schemaVersion}` : 'Storage manifest missing schema version');
    } catch { push('Storage schema current', false, 'Storage manifest could not be read'); }
    try {
      push('Persistence scoped to user', !!manifest?.scopedUserId && String(manifest.scopedUserId) === String(currentUser?.id || manifest?.scopedUserId), manifest?.scopedUserId ? `Scoped to ${String(manifest.scopedUserId).slice(0, 8)}…` : 'No scoped user persisted');
    } catch { push('Persistence scoped to user', false, 'Scoped persistence check failed'); }
    try {
      const compare = loadCompareWorkspaceState();
      push('Activity workspace readable', !!compare && typeof compare === 'object', 'Local compare state is available');
    } catch { push('Activity workspace readable', false, 'Activity workspace state failed to load'); }
    try {
      const interop = listProjectInteropEntries();
      const interopReadable = !!interop && typeof interop === 'object';
      const interopCount = interopReadable ? Object.keys(interop || {}).length : 0;
      push('Project interop readable', interopReadable, interopReadable ? `${interopCount} project signals found` : 'Interop state unavailable');
    } catch { push('Project interop readable', false, 'Interop state failed to load'); }
    try {
      const vendorQuality = getVendorDataQuality(normalizeVendorEntity({ name:'QA Vendor', category:'Design', city:'Austin, TX', bio:'A'.repeat(80), tags:['Brand'], proof_points:['Case study'], image_url:'https://example.com/vendor.png', response_time:'Within 3 hours' }) || {});
      push('Vendor normalization returns quality score', vendorQuality.score >= 75, `Vendor quality score ${vendorQuality.score}%`, 'warning');
    } catch { push('Vendor normalization returns quality score', false, 'Vendor normalization helper failed', 'warning'); }
    try {
      const projectQuality = getProjectDataQuality(normalizeProjectEntity({ id:'qa-project', title:'QA Project', category:'Creative', city:'Dallas, TX', budget:'$5,000', timeline:'4 weeks', description:'A'.repeat(120), skills:['Design'], requirements:['References'] }) || {});
      push('Project normalization returns quality score', projectQuality.score >= 75, `Project quality score ${projectQuality.score}%`, 'warning');
    } catch { push('Project normalization returns quality score', false, 'Project normalization helper failed', 'warning'); }
    try {
      push('Platform launch config centralized', !!PLATFORM_RELEASE?.launchLabel && Array.isArray(PLATFORM_RELEASE?.capabilityRows) && PLATFORM_RELEASE.capabilityRows.length >= 4, `Launch label ${PLATFORM_RELEASE?.launchLabel || 'missing'}`, 'warning');
    } catch { push('Platform launch config centralized', false, 'Platform release config unavailable', 'warning'); }
    try {
      getLaunchClientConfigChecks(currentUser).forEach(item => push(item.label, item.ok, item.detail, item.severity));
    } catch (e) { push('Launch client config checks', false, String(e), 'warning'); }
    try {
      const launchChecks = await Promise.all(LAUNCH_READINESS_TABLE_CHECKS.map(check => runLaunchReadinessTableCheck(check)));
      launchChecks.forEach(item => push(item.label, item.ok, item.detail, item.severity));
    } catch (e) { if (kbIsDevRuntime()) console.warn('[kb] QAConsole: launch schema check runner failed', e); push('Launch schema check runner', false, String(e)); }
    try {
      const result = await sendWaitlistEmail({ role:'church', email:'' });
      push('waitlist email helper fails safely', result?.reason === 'missing_email', result?.reason === 'missing_email' ? 'Local helper exits before invoking the edge function when email is missing.' : `Unexpected helper response: ${result?.reason || 'none'}`, 'warning');
    } catch (e) { if (kbIsDevRuntime()) console.warn('[kb] QAConsole: waitlist email helper check failed', e); push('waitlist email helper fails safely', false, String(e), 'warning'); }
    try {
      const result = await sendReferenceEmail({ token:'', clientEmail:'', clientName:'', vendorName:'' });
      push('reference email helper fails softly', result && result.delivered === false, result?.reason ? `Helper returned ${result.reason}.` : 'Helper returned a non-delivery response instead of crashing.', 'warning');
    } catch (e) { if (kbIsDevRuntime()) console.warn('[kb] QAConsole: reference email helper check failed', e); push('reference email helper fails softly', false, String(e), 'warning'); }
    } catch (err) {
      logError("qa-run-checks", err);
    } finally {
      setResults(checks);
      setRunning(false);
    }
  };


  const statusTheme = summary.blockers
    ? { label: 'Blocked', color: '#f8d6d0', border: 'rgba(248,214,208,0.26)', bg: 'rgba(197,48,48,0.16)' }
    : summary.warnings
      ? { label: 'Caution', color: '#f4d68a', border: 'rgba(244,214,138,0.28)', bg: 'rgba(176,136,64,0.18)' }
      : results.length
        ? { label: 'Ready', color: '#d9e8c4', border: 'rgba(217,232,196,0.24)', bg: 'rgba(64,106,75,0.18)' }
        : { label: 'Not run', color: '#efe1c3', border: 'rgba(239,225,195,0.22)', bg: 'rgba(255,255,255,0.07)' };

  const checkTone = (item) => item.ok
    ? { border: 'rgba(72,118,82,0.18)', bg: '#f4f8ef', chipBg: '#e8f0dd', color: '#2f6d3d', mark: '✓', label: 'Pass' }
    : item.severity === 'critical'
      ? { border: 'rgba(197,48,48,0.18)', bg: '#fff5f2', chipBg: '#f8d6d0', color: '#b43c2e', mark: '!', label: 'Blocker' }
      : { border: 'rgba(176,136,64,0.22)', bg: '#fff9ed', chipBg: '#f4e5bf', color: '#946d24', mark: '△', label: 'Warning' };

  const resultGroups = results.length ? [
    { title: 'Session & persistence', items: results.filter(item => /user|storage|persistence|activity|interop/i.test(item.label)) },
    { title: 'Data quality & config', items: results.filter(item => /normalization|quality|launch|config/i.test(item.label)) },
    { title: 'Backend seams', items: results.filter(item => !/user|storage|persistence|activity|interop|normalization|quality|launch|config/i.test(item.label)) },
  ].filter(group => group.items.length) : [];

  const manualItems = [
    { label:'Admin KPI cards', detail:'Open Admin Overview and confirm the operating cards render without console noise.', action:()=>safeNav('admin') },
    { label:'Application review queues', detail:'Confirm directory, Faith Verification, Charter, Partnership, and Ambassador counts match their pending queues.', action:()=>safeNav('admin') },
    { label:'Commercial truth', detail:'Confirm neutral public pricing and accurate internal direct-payment copy.', action:()=>safeNav('admin') },
    { label:'Disputes flow', detail:'Open Disputes and change a status without breaking state.', action:()=>safeNav('admin') },
    { label:'Church-side workflow', detail:'Save a project, attach a vendor, open Inbox, and request a review.', action:()=>safeNav(role === 'vendor' ? 'marketplace' : 'activity') },
    { label:'Platform status copy', detail:'Open Settings and confirm launch-state copy is still accurate.', action:()=>safeNav('settings') },
    ...MANUAL_BACKEND_RELEASE_CHECKS.map(label => ({ label, detail:'Backend release task to verify outside the browser UI.', action:()=>safeNav('qa') })),
  ];

  return (
    <div className="kb-qa-console-root" style={{minHeight:'100vh',background:'linear-gradient(180deg,#f7f1e6 0%,#efe4d2 100%)',padding:'30px 32px 82px'}}>
      <div style={{maxWidth:1180,margin:'0 auto',display:'grid',gap:18}}>
        <div style={{border:'1px solid rgba(239,225,195,0.18)',borderRadius:30,background:'linear-gradient(135deg,#1C2814 0%,#29391f 58%,#354625 100%)',boxShadow:'0 26px 72px rgba(28,40,20,0.22)',overflow:'hidden',position:'relative'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 82% 18%,rgba(213,184,115,0.24),transparent 34%),radial-gradient(circle at 10% 100%,rgba(255,253,248,0.08),transparent 28%)',pointerEvents:'none'}} />
          <div style={{position:'relative',padding:'28px 30px 26px',display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:22,alignItems:'end'}}>
            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,height:26,padding:'0 10px',borderRadius:999,border:'1px solid rgba(239,225,195,0.18)',background:'rgba(255,255,255,0.06)',fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'#d8bd7a',marginBottom:13}}>Workspace QA</div>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(34px,5vw,52px)',lineHeight:0.95,letterSpacing:'-0.055em',color:'#fffdf8',fontWeight:700}}>Release gate</div>
              <div style={{fontSize:14,lineHeight:1.7,color:'rgba(255,253,248,0.70)',maxWidth:720,marginTop:12}}>Run a focused smoke check across persistence, local workspace seams, data normalization, launch config, and backend readiness before shipping the next FaithBid pass.</div>
            </div>
            <div style={{display:'grid',gap:10,minWidth:260}}>
              <div style={{border:`1px solid ${statusTheme.border}`,background:statusTheme.bg,borderRadius:22,padding:'16px 17px',color:'#fffdf8'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:9}}>
                  <span style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,253,248,0.52)'}}>Current status</span>
                  <span style={{fontSize:11,fontWeight:800,color:statusTheme.color}}>{statusTheme.label}</span>
                </div>
                <div style={{fontSize:34,lineHeight:1,fontWeight:800,letterSpacing:'-0.04em',color:'#fffdf8'}}>{results.length ? `${summary.score}%` : '—'}</div>
                <div style={{fontSize:12,color:'rgba(255,253,248,0.66)',marginTop:8}}>{results.length ? `${summary.passCount} of ${results.length} checks passing` : 'Run the gate to score this build.'}</div>
              </div>
              <div style={{display:'flex',gap:9,justifyContent:'flex-end',flexWrap:'wrap'}}>
                <button type='button' onClick={runChecks} disabled={running} style={{height:42,padding:'0 16px',borderRadius:999,border:'none',background:running ? 'rgba(239,225,195,0.42)' : '#efe1c3',fontSize:12,fontWeight:800,color:'#1C2814',cursor:running ? 'default' : 'pointer',boxShadow:'0 12px 26px rgba(0,0,0,0.16)'}}>{running ? 'Running…' : 'Run release gate'}</button>
                <button type='button' onClick={()=>queueActivityNavigation(nav)} style={{height:42,padding:'0 14px',borderRadius:999,border:'1px solid rgba(239,225,195,0.22)',background:'rgba(255,255,255,0.06)',fontSize:12,fontWeight:800,color:'#fffdf8',cursor:'pointer'}}>Activity</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12}}>
          {[
            { label:'Checks run', value: results.length || '—', sub: results.length ? 'Smoke-tested seams' : 'Waiting on run' },
            { label:'Passed', value: results.length ? summary.passCount : '—', sub: results.length ? 'Healthy checks' : 'Not scored yet' },
            { label:'Blockers', value: results.length ? summary.blockers : '—', sub: summary.blockers ? 'Critical failures' : 'No critical blockers' },
            { label:'Warnings', value: results.length ? summary.warnings : '—', sub: summary.warnings ? 'Review before ship' : 'No warnings flagged' },
          ].map(card => (
            <div key={card.label} style={{background:'#fffdf8',border:'1px solid #dfd5c2',borderRadius:22,padding:'17px 18px',boxShadow:'0 16px 42px rgba(28,40,20,0.055)'}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.13em',textTransform:'uppercase',color:'#9b8f7e',marginBottom:10}}>{card.label}</div>
              <div style={{fontSize:30,lineHeight:1,fontWeight:800,letterSpacing:'-0.045em',color:'#1C2814'}}>{card.value}</div>
              <div style={{fontSize:12,lineHeight:1.5,color:'#6f675a',marginTop:8}}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.55fr) minmax(310px,0.85fr)',gap:16,alignItems:'start'}}>
          <div style={{display:'grid',gap:14}}>
            <div style={{background:'#fffdf8',border:'1px solid #dfd5c2',borderRadius:26,padding:20,boxShadow:'0 18px 46px rgba(28,40,20,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:16,flexWrap:'wrap'}}>
                <div>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'#b08840',marginBottom:6}}>Automated checks</div>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:27,lineHeight:1.05,letterSpacing:'-0.035em',color:'#1C2814'}}>Browser and launch readiness</div>
                </div>
                {results.length > 0 ? <div style={{height:34,padding:'0 12px',borderRadius:999,border:`1px solid ${summary.blockers ? 'rgba(197,48,48,0.2)' : summary.warnings ? 'rgba(176,136,64,0.25)' : 'rgba(72,118,82,0.2)'}`,background:summary.blockers ? '#fff5f2' : summary.warnings ? '#fff9ed' : '#f4f8ef',display:'flex',alignItems:'center',fontSize:11,fontWeight:800,letterSpacing:'0.11em',textTransform:'uppercase',color:summary.blockers ? '#b43c2e' : summary.warnings ? '#946d24' : '#2f6d3d'}}>{summary.state}</div> : null}
              </div>

              {!results.length ? (
                <div style={{border:'1px dashed #d8c8ac',borderRadius:22,background:'#fbf5e8',padding:'34px 24px',textAlign:'center'}}>
                  <div style={{width:50,height:50,borderRadius:18,background:'#1C2814',color:'#efe1c3',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:20,fontWeight:800}}>✓</div>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:700,color:'#1C2814',letterSpacing:'-0.025em',marginBottom:8}}>Ready to run the release gate.</div>
                  <div style={{fontSize:13,lineHeight:1.65,color:'#6f675a',maxWidth:520,margin:'0 auto 18px'}}>This panel will group pass, warning, and blocker results once the automated checks finish.</div>
                  <button type='button' onClick={runChecks} disabled={running} style={{height:40,padding:'0 16px',borderRadius:999,border:'none',background:'#1C2814',color:'#fffdf8',fontSize:12,fontWeight:800,cursor:running ? 'default' : 'pointer'}}>{running ? 'Running…' : 'Run release gate'}</button>
                </div>
              ) : (
                <div style={{display:'grid',gap:13}}>
                  {resultGroups.map(group => (
                    <div key={group.title} style={{border:'1px solid #eadfce',borderRadius:20,background:'#fbfaf7',overflow:'hidden'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'12px 14px',borderBottom:'1px solid #eadfce',background:'#fffdf8'}}>
                        <span style={{fontSize:11,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8c8170'}}>{group.title}</span>
                        <span style={{fontSize:11,fontWeight:800,color:'#6f675a'}}>{group.items.filter(item => item.ok).length}/{group.items.length} pass</span>
                      </div>
                      <div style={{display:'grid',gap:8,padding:10}}>
                        {group.items.map(item => {
                          const tone = checkTone(item);
                          return (
                            <div key={item.label} style={{display:'grid',gridTemplateColumns:'auto minmax(0,1fr) auto',gap:12,alignItems:'start',padding:'12px 13px',borderRadius:15,border:`1px solid ${tone.border}`,background:tone.bg}}>
                              <span style={{width:28,height:28,borderRadius:10,background:tone.chipBg,color:tone.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,flexShrink:0}}>{tone.mark}</span>
                              <span style={{minWidth:0}}>
                                <span style={{display:'block',fontSize:13,fontWeight:800,color:'#1C2814',lineHeight:1.25}}>{item.label}</span>
                                <span style={{display:'block',fontSize:12.5,lineHeight:1.55,color:'#6f675a',marginTop:3}}>{item.detail}</span>
                              </span>
                              <span style={{height:26,padding:'0 9px',borderRadius:999,background:'#fffdf8',border:`1px solid ${tone.border}`,fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase',color:tone.color,display:'flex',alignItems:'center'}}>{tone.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{display:'grid',gap:14}}>
            <div style={{background:'#1C2814',border:'1px solid rgba(239,225,195,0.18)',borderRadius:26,padding:20,boxShadow:'0 18px 46px rgba(28,40,20,0.14)',color:'#fffdf8'}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'#d8bd7a',marginBottom:8}}>Ship readout</div>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,lineHeight:1.05,letterSpacing:'-0.035em',marginBottom:10}}>Know what is safe before you ship.</div>
              <div style={{fontSize:13,lineHeight:1.7,color:'rgba(255,253,248,0.70)'}}>{results.length ? (summary.blockers ? 'Critical blockers are present. Fix those before installing another app lock.' : summary.warnings ? 'No critical blockers, but warnings need a quick review before calling the pass clean.' : 'Automated checks are clean. Finish the manual checklist before shipping.') : 'Run the release gate, then walk the manual checklist on the right.'}</div>
              <div style={{height:1,background:'rgba(239,225,195,0.14)',margin:'16px 0'}} />
              <div style={{display:'grid',gap:9}}>
                {[['User', currentUser?.email || 'Admin session'], ['Role', role || 'workspace'], ['Checks', results.length ? `${summary.passCount}/${results.length}` : 'Not run']].map(([label,value]) => (
                  <div key={label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                    <span style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(255,253,248,0.46)'}}>{label}</span>
                    <span style={{fontSize:12.5,fontWeight:800,color:'#efe1c3',textAlign:'right',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:180}}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:'#fffdf8',border:'1px solid #dfd5c2',borderRadius:26,padding:20,boxShadow:'0 18px 46px rgba(28,40,20,0.06)'}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'#b08840',marginBottom:8}}>Manual checklist</div>
              <div style={{fontSize:13,lineHeight:1.6,color:'#6f675a',marginBottom:13}}>Short, concrete screens to open before calling the build shippable.</div>
              <div style={{display:'grid',gap:9}}>
                {manualItems.map((item, idx) => (
                  <div key={`${item.label}-${idx}`} style={{border:'1px solid #eadfce',background:'#fbfaf7',borderRadius:16,padding:12,display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:10,alignItems:'center'}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:12.5,fontWeight:800,color:'#1C2814',lineHeight:1.25}}>{item.label}</div>
                      <div style={{fontSize:11.5,lineHeight:1.45,color:'#7d7363',marginTop:3}}>{item.detail}</div>
                    </div>
                    <button type='button' onClick={item.action} style={{height:31,padding:'0 10px',borderRadius:999,border:'1px solid #dfd5c2',background:'#fffdf8',fontSize:10.5,fontWeight:800,color:'#1C2814',cursor:'pointer'}}>Open</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
