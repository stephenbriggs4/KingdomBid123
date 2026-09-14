import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const EMPTY_ANALYTICS_STATS = Object.freeze({ openProjects:0, completedProjects:0, vendors:0, verifiedVendors:0, bids:0, savedProjects:0, projectLinks:0, inboxThreads:0 });

export default function AnalyticsScreen({ currentUser, nav, role, dependencies }) {
  const {
    countUserConversationsSafe,
    isAdminUser,
    KB_BP_MOBILE,
    KBIntentionalState,
    KBSkeleton,
    logError,
    queueActivityNavigation,
    useViewportWidth,
  } = dependencies;
  const viewportWidth = useViewportWidth(1440);
  const isMobile = viewportWidth < KB_BP_MOBILE;
  const isTablet = viewportWidth < 1100;
  const isVendorRole = role === 'vendor';
  const hasAnalyticsAdminAccess = isAdminUser(currentUser);
  const [stats, setStats] = useState(EMPTY_ANALYTICS_STATS);
  const [activity, setActivity] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);

  useEffect(() => {
    let alive = true;
    const userId = currentUser?.id || null;
    if (!userId) {
      setStats(EMPTY_ANALYTICS_STATS);
      setActivity([]);
      setAnalyticsError(null);
      setLoadingAnalytics(false);
      return () => { alive = false; };
    }
    const countQuery = (query) => query.select('id', { count:'exact', head:true });
    const zeroCount = Promise.resolve({ count:0, error:null });
    const scopedActivityQuery = hasAnalyticsAdminAccess
      ? supabase.from('project_activity_feed').select('id,title,body,kind,created_at').order('created_at', { ascending:false }).limit(8)
      : supabase.from('project_activity_feed').select('id,title,body,kind,created_at').or(`church_id.eq.${userId},actor_user_id.eq.${userId},vendor_user_id.eq.${userId}`).order('created_at', { ascending:false }).limit(8);

    (async () => {
      setLoadingAnalytics(true);
      setAnalyticsError(null);
      try {
        let requests;
        if (hasAnalyticsAdminAccess) {
          requests = [
            countQuery(supabase.from('projects')).eq('status','open'),
            countQuery(supabase.from('projects')).eq('status','completed'),
            countQuery(supabase.from('vendors')),
            countQuery(supabase.from('vendors')).eq('verified', true),
            countQuery(supabase.from('bids')),
            countQuery(supabase.from('saved_projects')),
            countQuery(supabase.from('project_vendor_links')),
            countQuery(supabase.from('conversations')),
            scopedActivityQuery,
          ];
        } else if (isVendorRole) {
          requests = [
            countQuery(supabase.from('projects')).eq('status','open'),
            countQuery(supabase.from('bids')).eq('vendor_id', userId).eq('status','hired'),
            countQuery(supabase.from('vendors')),
            countQuery(supabase.from('vendors')).eq('verified', true),
            countQuery(supabase.from('bids')).eq('vendor_id', userId),
            countQuery(supabase.from('saved_projects')).eq('user_id', userId),
            countQuery(supabase.from('project_vendor_links')).eq('vendor_user_id', userId),
            countUserConversationsSafe(userId),
            scopedActivityQuery,
          ];
        } else {
          requests = [
            countQuery(supabase.from('projects')).eq('church_id', userId).eq('status','open'),
            countQuery(supabase.from('projects')).eq('church_id', userId).eq('status','completed'),
            countQuery(supabase.from('vendors')),
            countQuery(supabase.from('vendors')).eq('verified', true),
            countQuery(supabase.from('bids')).eq('church_id', userId),
            countQuery(supabase.from('saved_projects')).eq('user_id', userId),
            countQuery(supabase.from('project_vendor_links')).eq('church_id', userId),
            countUserConversationsSafe(userId),
            scopedActivityQuery,
          ];
        }
        const [openRes, completeRes, vendorRes, verifiedRes, bidRes, savedRes, linksRes, convoRes, feedRes] = await Promise.all(requests.map(req => req || zeroCount));
        if (!alive) return;
        const firstError = [openRes, completeRes, vendorRes, verifiedRes, bidRes, savedRes, linksRes, convoRes, feedRes].find(res => res?.error)?.error;
        if (firstError) throw firstError;
        setStats({
          openProjects: openRes.count || 0,
          completedProjects: completeRes.count || 0,
          vendors: vendorRes.count || 0,
          verifiedVendors: verifiedRes.count || 0,
          bids: bidRes.count || 0,
          savedProjects: savedRes.count || 0,
          projectLinks: linksRes.count || 0,
          inboxThreads: convoRes.count || 0,
        });
        setActivity(Array.isArray(feedRes.data) ? feedRes.data : []);
      } catch(err){
        logError('analytics-fetch', err, { userId, role, hasAnalyticsAdminAccess });
        if (alive) {
          setAnalyticsError('Analytics could not fully load. Refresh or check your connection.');
          setActivity([]);
        }
      } finally {
        if (alive) setLoadingAnalytics(false);
      }
    })();
    return () => { alive = false; };
  }, [currentUser?.id, role, hasAnalyticsAdminAccess, isVendorRole, countUserConversationsSafe, logError]);

  const formatCount = (value) => Number(value || 0).toLocaleString('en-US');
  const verifiedRate = stats.vendors ? Math.round((stats.verifiedVendors / stats.vendors) * 100) : 0;
  const decisionLoad = stats.savedProjects + stats.projectLinks + stats.inboxThreads;
  const projectTotal = stats.openProjects + stats.completedProjects;
  const completionRate = projectTotal ? Math.round((stats.completedProjects / projectTotal) * 100) : 0;
  const bidPressure = stats.openProjects ? Math.round((stats.bids / Math.max(1, stats.openProjects)) * 10) / 10 : stats.bids;
  const heroTitle = hasAnalyticsAdminAccess ? 'Platform command analytics' : isVendorRole ? 'Vendor pipeline analytics' : 'Church project analytics';
  const heroBody = hasAnalyticsAdminAccess
    ? 'A clean read on marketplace activity, trust supply, inbox pressure, and decision movement across FaithBid.'
    : isVendorRole
      ? 'Track open opportunities, submitted bids, saved work, and execution signals without digging through every workspace.'
      : 'See which projects are active, where vendors are engaging, and what needs attention before decisions stall.';
  const primaryCta = isVendorRole ? 'Open my work' : 'Open my projects';
  const primaryRoute = isVendorRole ? 'my-work' : 'my-projects';
  const metricCards = hasAnalyticsAdminAccess ? [
    { label:'Open projects', value:stats.openProjects, sub:'Marketplace supply', tone:'#1C2814' },
    { label:'Completed', value:stats.completedProjects, sub:`${completionRate}% completion mix`, tone:'#3f6b4b' },
    { label:'Total bids', value:stats.bids, sub:`${bidPressure} bids / open project`, tone:'#b08840' },
    { label:'Verified vendors', value:stats.verifiedVendors, sub:`${verifiedRate}% of directory`, tone:'#4b6f82' },
    { label:'Saved projects', value:stats.savedProjects, sub:'Decision layer', tone:'#755d39' },
    { label:'Vendor links', value:stats.projectLinks, sub:'Matchmaking activity', tone:'#5a614d' },
    { label:'Inbox threads', value:stats.inboxThreads, sub:'Conversation load', tone:'#6c5b7b' },
    { label:'Directory vendors', value:stats.vendors, sub:'Total supply', tone:'#2f3f2c' },
  ] : isVendorRole ? [
    { label:'Open opportunities', value:stats.openProjects, sub:'Available to review', tone:'#1C2814' },
    { label:'Hired bids', value:stats.completedProjects, sub:'Won engagements', tone:'#3f6b4b' },
    { label:'My bids', value:stats.bids, sub:'Submitted pipeline', tone:'#b08840' },
    { label:'Inbox threads', value:stats.inboxThreads, sub:'Active conversations', tone:'#4b6f82' },
    { label:'Saved projects', value:stats.savedProjects, sub:'Watchlist', tone:'#755d39' },
    { label:'Vendor links', value:stats.projectLinks, sub:'Church-side connections', tone:'#5a614d' },
    { label:'Verified vendors', value:stats.verifiedVendors, sub:`${verifiedRate}% verified`, tone:'#6c5b7b' },
    { label:'Directory vendors', value:stats.vendors, sub:'Marketplace supply', tone:'#2f3f2c' },
  ] : [
    { label:'My open projects', value:stats.openProjects, sub:'Needs vendor attention', tone:'#1C2814' },
    { label:'Completed projects', value:stats.completedProjects, sub:`${completionRate}% completion mix`, tone:'#3f6b4b' },
    { label:'Bids received', value:stats.bids, sub:`${bidPressure} bids / open project`, tone:'#b08840' },
    { label:'Inbox threads', value:stats.inboxThreads, sub:'Active conversations', tone:'#4b6f82' },
    { label:'Saved projects', value:stats.savedProjects, sub:'Decision layer', tone:'#755d39' },
    { label:'Vendor links', value:stats.projectLinks, sub:'Shortlisted vendors', tone:'#5a614d' },
    { label:'Verified vendors', value:stats.verifiedVendors, sub:`${verifiedRate}% verified`, tone:'#6c5b7b' },
    { label:'Directory vendors', value:stats.vendors, sub:'Available network', tone:'#2f3f2c' },
  ];
  const pulseCards = [
    { label:'Trust coverage', value: stats.vendors ? `${verifiedRate}%` : '—', body: stats.vendors ? `${formatCount(stats.verifiedVendors)} of ${formatCount(stats.vendors)} vendor profiles are verified.` : 'Vendor supply will populate as profiles are created.' },
    { label:'Decision load', value: formatCount(decisionLoad), body: `${formatCount(stats.savedProjects)} saved projects, ${formatCount(stats.projectLinks)} vendor links, and ${formatCount(stats.inboxThreads)} inbox threads.` },
    { label:'Bid pressure', value: stats.openProjects ? `${bidPressure}×` : formatCount(stats.bids), body: stats.openProjects ? 'Average bid volume per open project.' : 'Bid activity will become more useful once projects are open.' },
  ];
  const feedItems = Array.isArray(activity) && activity.length ? activity : [];
  const actionCards = [
    { label:'Activity Center', body:'Review unread movement, approvals, saved items, and execution alerts.', action:()=>queueActivityNavigation(nav), cta:'Open activity' },
    { label:isVendorRole ? 'My Work' : 'My Projects', body:isVendorRole ? 'Review bids, won projects, and active vendor execution.' : 'Review church-side projects, bids, vendors, and project rooms.', action:()=>nav(primaryRoute), cta:primaryCta },
    ...(hasAnalyticsAdminAccess ? [
      { label:'Admin Console', body:'Check platform queues, approvals, disputes, and operating metrics.', action:()=>nav('admin'), cta:'Open admin' },
      { label:'QA Console', body:'Run release-gate checks before shipping another app pass.', action:()=>nav('qa'), cta:'Open QA' },
    ] : []),
  ];
  const pagePad = isMobile ? '18px 14px 58px' : isTablet ? '24px 22px 72px' : '30px 34px 88px';

  return (
    <div className="analytics-root" style={{background:'linear-gradient(180deg,#fbf7ef 0%,#f4eadb 100%)',minHeight:'100vh',padding:pagePad,color:'#1C2814'}}>
      <div style={{maxWidth:1380,margin:'0 auto'}}>
        <div style={{position:'relative',overflow:'hidden',borderRadius:30,background:'radial-gradient(circle at 86% 10%, rgba(213,184,115,0.24), transparent 34%), linear-gradient(135deg,#142015 0%,#24331f 62%,#31422a 100%)',border:'1px solid rgba(239,225,195,0.22)',boxShadow:'0 28px 80px rgba(28,40,20,0.20)',padding:isMobile ? '24px 20px' : '30px 34px',marginBottom:18}}>
          <div style={{position:'absolute',right:-80,top:-80,width:230,height:230,borderRadius:'50%',background:'rgba(255,255,255,0.055)'}} />
          <div style={{position:'absolute',left:-90,bottom:-110,width:250,height:250,borderRadius:'50%',background:'rgba(213,184,115,0.08)'}} />
          <div style={{position:'relative',zIndex:1,display:'grid',gridTemplateColumns:isTablet ? '1fr' : 'minmax(0,1fr) 360px',gap:24,alignItems:'stretch'}}>
            <div>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'#d8bd7a',marginBottom:10}}>{hasAnalyticsAdminAccess ? 'Workspace analytics' : isVendorRole ? 'Vendor workspace' : 'Church workspace'}</div>
              <div style={{fontFamily:"var(--font-display),serif",fontSize:isMobile ? 35 : 54,lineHeight:0.98,letterSpacing:'-0.05em',color:'#fffdf8',maxWidth:760}}>{heroTitle}</div>
              <div style={{fontSize:15,color:'rgba(255,253,248,0.74)',maxWidth:720,lineHeight:1.72,marginTop:14}}>{heroBody}</div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:22}}>
                <button type='button' onClick={()=>nav(primaryRoute)} style={{height:44,padding:'0 18px',borderRadius:999,border:'none',background:'#efe1c3',fontSize:13,fontWeight:800,color:'#162014',cursor:'pointer',boxShadow:'0 14px 28px rgba(0,0,0,0.18)'}}>{primaryCta}</button>
                <button type='button' onClick={()=>queueActivityNavigation(nav)} style={{height:44,padding:'0 18px',borderRadius:999,border:'1px solid rgba(255,255,255,0.20)',background:'rgba(255,255,255,0.08)',fontSize:13,fontWeight:800,color:'#fffdf8',cursor:'pointer'}}>Open Activity</button>
                {hasAnalyticsAdminAccess && <button type='button' onClick={()=>nav('admin')} style={{height:44,padding:'0 18px',borderRadius:999,border:'1px solid rgba(255,255,255,0.18)',background:'rgba(255,255,255,0.06)',fontSize:13,fontWeight:800,color:'#fffdf8',cursor:'pointer'}}>Admin</button>}
              </div>
            </div>
            <div style={{border:'1px solid rgba(255,255,255,0.14)',borderRadius:24,background:'rgba(255,255,255,0.085)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.10)',padding:20,display:'grid',gap:14}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                <div>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,253,248,0.54)'}}>Pipeline pulse</div>
                  <div style={{fontFamily:"var(--font-display),serif",fontSize:38,lineHeight:1,color:'#fffdf8',marginTop:4}}>{loadingAnalytics ? '—' : formatCount(stats.bids + stats.projectLinks + stats.inboxThreads)}</div>
                </div>
                <div style={{width:74,height:74,borderRadius:'50%',border:'1px solid rgba(239,225,195,0.22)',background:'conic-gradient(from 160deg,#d8bd7a 0deg,#d8bd7a 230deg,rgba(255,255,255,0.13) 230deg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <div style={{width:54,height:54,borderRadius:'50%',background:'#1b2818',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,color:'#efe1c3'}}>{verifiedRate || 0}%</div>
                </div>
              </div>
              <div style={{fontSize:13,lineHeight:1.65,color:'rgba(255,253,248,0.72)'}}>Verified vendor coverage, bid volume, links, and conversation movement are now summarized into one clean operating read.</div>
              {analyticsError && <div style={{padding:'10px 12px',borderRadius:13,border:'1px solid rgba(255,176,176,0.24)',background:'rgba(255,176,176,0.08)',fontSize:12,color:'#ffd9d9'}}>{analyticsError}</div>}
            </div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:isMobile ? '1fr' : isTablet ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))',gap:12,marginBottom:16}}>
          {metricCards.map((card) => (
            <div key={card.label} style={{background:'#fffdf8',border:'1px solid #dfd5c2',borderRadius:20,padding:'16px 17px',boxShadow:'0 14px 34px rgba(28,40,20,0.055)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8c8170'}}>{card.label}</div>
                <span style={{width:9,height:9,borderRadius:'50%',background:card.tone,boxShadow:`0 0 0 4px ${card.tone}18`}} />
              </div>
              <div style={{fontFamily:"var(--font-display),serif",fontSize:32,lineHeight:0.96,letterSpacing:'-0.035em',color:'#1C2814'}}>{loadingAnalytics ? <KBSkeleton width={54} height={28} /> : formatCount(card.value)}</div>
              <div style={{fontSize:12,lineHeight:1.55,color:'#6f675a',marginTop:9}}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:isTablet ? '1fr' : 'minmax(0,1fr) 390px',gap:16,alignItems:'start'}}>
          <div style={{display:'grid',gap:16}}>
            <div style={{background:'#fffdf8',border:'1px solid #dfd5c2',borderRadius:26,padding:isMobile ? 18 : 22,boxShadow:'0 18px 46px rgba(28,40,20,0.06)'}}>
              <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:14,flexWrap:'wrap',marginBottom:16}}>
                <div>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'#b08840',marginBottom:6}}>Operating signals</div>
                  <div style={{fontFamily:"var(--font-display),serif",fontSize:28,lineHeight:1.04,letterSpacing:'-0.03em',color:'#1C2814'}}>What deserves attention</div>
                </div>
                <button type='button' onClick={()=>queueActivityNavigation(nav)} style={{height:38,padding:'0 14px',borderRadius:999,border:'1px solid #dfd5c2',background:'#fff',fontSize:12,fontWeight:800,color:'#1C2814',cursor:'pointer'}}>Review activity</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:isMobile ? '1fr' : 'repeat(3,minmax(0,1fr))',gap:10}}>
                {pulseCards.map(item => (
                  <div key={item.label} style={{border:'1px solid rgba(176,136,64,0.18)',background:'linear-gradient(180deg,#fffaf1,#fffdf8)',borderRadius:18,padding:16}}>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8c8170',marginBottom:8}}>{item.label}</div>
                    <div style={{fontFamily:"var(--font-display),serif",fontSize:30,lineHeight:1,color:'#1C2814'}}>{loadingAnalytics ? '—' : item.value}</div>
                    <div style={{fontSize:12,lineHeight:1.58,color:'#6f675a',marginTop:8}}>{item.body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:'#fffdf8',border:'1px solid #dfd5c2',borderRadius:26,padding:isMobile ? 18 : 22,boxShadow:'0 18px 46px rgba(28,40,20,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:14}}>
                <div>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'#b08840',marginBottom:6}}>Recent movement</div>
                  <div style={{fontSize:14,color:'#6f675a'}}>Latest scoped events from your marketplace, project, and inbox layer.</div>
                </div>
                <span style={{fontSize:11,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8c8170'}}>{loadingAnalytics ? 'Loading' : `${feedItems.length} items`}</span>
              </div>
              <div style={{display:'grid',gap:10}}>
                {loadingAnalytics ? Array.from({length:4}).map((_,idx) => (
                  <div key={idx} style={{padding:'14px 15px',borderRadius:16,border:'1px solid rgba(0,0,0,0.06)',background:'#fbfaf7'}}>
                    <KBSkeleton width='42%' height={14} />
                    <KBSkeleton width='78%' height={11} style={{marginTop:8}} />
                  </div>
                )) : feedItems.length ? feedItems.map(item => {
                  const kind = String(item.kind || 'activity').replace(/_/g,' ');
                  const dateLabel = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : 'Recent';
                  return (
                    <button key={item.id || `${item.title}-${item.created_at}`} type='button' onClick={()=>queueActivityNavigation(nav)} style={{width:'100%',textAlign:'left',display:'grid',gridTemplateColumns:'auto minmax(0,1fr) auto',gap:12,alignItems:'center',padding:'14px 15px',borderRadius:16,border:'1px solid rgba(0,0,0,0.06)',background:'#fbfaf7',cursor:'pointer'}}>
                      <span style={{width:36,height:36,borderRadius:13,background:'#1C2814',color:'#efe1c3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800}}>•</span>
                      <span style={{minWidth:0}}>
                        <span style={{display:'block',fontSize:13,fontWeight:800,color:'#1C2814',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.title || 'Workspace activity'}</span>
                        <span style={{display:'block',fontSize:12,lineHeight:1.55,color:'#6f675a',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginTop:2}}>{item.body || 'No detail yet'}</span>
                      </span>
                      <span style={{display:'grid',justifyItems:'end',gap:4}}>
                        <span style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase',color:'#b08840'}}>{kind}</span>
                        <span style={{fontSize:11,color:'#8c8170'}}>{dateLabel}</span>
                      </span>
                    </button>
                  );
                }) : (
                  <KBIntentionalState compact icon='◇' eyebrow='No recent events' title='Analytics is ready when activity starts.' body='Once projects, bids, saved vendors, and inbox messages move, this feed will become your operating log.' actionLabel='Open Activity' onAction={()=>queueActivityNavigation(nav)} style={{boxShadow:'none'}} />
                )}
              </div>
            </div>
          </div>

          <div style={{display:'grid',gap:14}}>
            <div style={{background:'#fffdf8',border:'1px solid #dfd5c2',borderRadius:26,padding:20,boxShadow:'0 18px 46px rgba(28,40,20,0.06)'}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'#b08840',marginBottom:8}}>Next best paths</div>
              <div style={{fontFamily:"var(--font-display),serif",fontSize:25,lineHeight:1.05,letterSpacing:'-0.03em',color:'#1C2814',marginBottom:14}}>Move from signal to action.</div>
              <div style={{display:'grid',gap:10}}>
                {actionCards.map(item => (
                  <div key={item.label} style={{border:'1px solid rgba(0,0,0,0.06)',background:'#fbfaf7',borderRadius:16,padding:14}}>
                    <div style={{fontSize:13,fontWeight:800,color:'#1C2814',marginBottom:4}}>{item.label}</div>
                    <div style={{fontSize:12,lineHeight:1.55,color:'#6f675a',marginBottom:11}}>{item.body}</div>
                    <button type='button' onClick={item.action} style={{height:34,padding:'0 12px',borderRadius:999,border:'1px solid #dfd5c2',background:'#fff',fontSize:11,fontWeight:800,color:'#1C2814',cursor:'pointer'}}>{item.cta}</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:'#1C2814',border:'1px solid rgba(239,225,195,0.18)',borderRadius:26,padding:20,boxShadow:'0 18px 46px rgba(28,40,20,0.16)',color:'#fffdf8'}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'#d8bd7a',marginBottom:8}}>Analytics readout</div>
              <div style={{fontSize:13,lineHeight:1.7,color:'rgba(255,253,248,0.72)'}}>
                {hasAnalyticsAdminAccess
                  ? `Marketplace supply is at ${formatCount(stats.openProjects)} open projects with ${formatCount(stats.verifiedVendors)} verified vendors supporting trust coverage.`
                  : isVendorRole
                    ? `You have ${formatCount(stats.bids)} submitted bid${stats.bids === 1 ? '' : 's'} and ${formatCount(stats.inboxThreads)} active inbox thread${stats.inboxThreads === 1 ? '' : 's'} tied to your workspace.`
                    : `Your workspace has ${formatCount(stats.openProjects)} open project${stats.openProjects === 1 ? '' : 's'}, ${formatCount(stats.bids)} received bid${stats.bids === 1 ? '' : 's'}, and ${formatCount(stats.inboxThreads)} active inbox thread${stats.inboxThreads === 1 ? '' : 's'}.`}
              </div>
              <div style={{height:1,background:'rgba(239,225,195,0.16)',margin:'16px 0'}} />
              <div style={{display:'grid',gap:9}}>
                {[['Verified rate', stats.vendors ? `${verifiedRate}%` : '—'], ['Decision items', formatCount(decisionLoad)], ['Open projects', formatCount(stats.openProjects)]].map(([label,value]) => (
                  <div key={label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                    <span style={{fontSize:11,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase',color:'rgba(255,253,248,0.48)'}}>{label}</span>
                    <span style={{fontSize:14,fontWeight:800,color:'#efe1c3'}}>{value}</span>
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
