import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';

/* Messages tab for My Projects (church + vendor): one row per project conversation on the left,
   the open thread on the right. Lean on purpose — no channels, reactions or announcements. */

function initialsOf(name = '') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase();
}

// A church name that is really an account handle (one lowercase token, e.g. an
// email local-part like "stephenbriggs0128") must never be shown to a vendor.
// Kept in sync with the same helper in src/App.jsx.
function isHandleLikeChurchName(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  return /^[a-z0-9._-]+$/.test(raw) && /[0-9._-]/.test(raw);
}

function formatWhen(value, { list = false } = {}) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86400000);
  const clock = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (days <= 0) return clock;
  if (days === 1) return list ? 'Yesterday' : `Yesterday ${clock}`;
  if (days < 7) return list ? d.toLocaleDateString([], { weekday: 'short' }) : `${d.toLocaleDateString([], { weekday: 'short' })} ${clock}`;
  const date = d.toLocaleDateString([], d.getFullYear() === now.getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
  return list ? date : `${date}, ${clock}`;
}

function dayLabel(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', ...(d.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }) });
}

function lifecycleControls(c, role) {
  const status = String(c?.project_status || '').toLowerCase();
  const requested = !!c?.completion_requested_at;
  const isChurch = role === 'church';
  if (status === 'hired') return { label: 'Hired', note: isChurch ? 'Confirm when the work has started.' : 'Start work when you are ready to begin.', primary: { action: 'start', label: isChurch ? 'Confirm work started' : 'Start work' } };
  if (status === 'in_progress' && requested) {
    return isChurch
      ? { label: 'Ready for your review', note: 'The vendor says the work is done. Accept it or ask for changes.', primary: { action: 'confirm_completion', label: 'Accept work' }, secondary: { action: 'request_changes', label: 'Request changes', needsNote: true } }
      : { label: 'Waiting on the church', note: 'You sent this for review.', primary: { action: 'cancel_completion_request', label: 'Withdraw review request', ghost: true } };
  }
  if (status === 'in_progress') {
    return isChurch
      ? { label: 'In progress', note: 'The vendor is working on this project.' }
      : { label: 'In progress', note: 'Send it for review when the work is finished.', primary: { action: 'request_completion', label: 'Ready for review' } };
  }
  if (status === 'completed') return { label: 'Completed', note: 'This project is finished and part of your FaithBid record.' };
  return null;
}

const LIFECYCLE_TOAST = {
  start: 'Project moved into progress.',
  request_completion: 'The church has been notified that the work is ready for review.',
  cancel_completion_request: 'Review request withdrawn.',
  request_changes: 'Changes requested. The vendor has been notified.',
  confirm_completion: 'Project completion confirmed.',
};

const STYLE = `
.mt-root{--ink:#13392e;--muted:#66716b;--line:#e3dccb;--green:#174b3a;--gold:#b08840;display:grid;gap:14px;color:var(--ink);font-family:var(--font-sans),sans-serif}
.mt-head h2{margin:0;font-family:var(--font-display),serif;font-size:clamp(30px,3vw,40px);font-weight:600;letter-spacing:-.03em;line-height:1.05}
.mt-head p{margin:4px 0 0;font-size:14px;color:var(--muted)}
.mt-tabs{display:flex;gap:22px;border-bottom:1px solid var(--line)}
.mt-tab{position:relative;border:0;background:none;padding:10px 2px 12px;font:600 14px var(--font-sans),sans-serif;color:var(--muted);cursor:pointer}
.mt-tab.on{color:var(--ink)}.mt-tab.on::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--gold)}
.mt-badge{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 6px;margin-left:6px;border-radius:999px;background:#f1e6c8;color:#7a5a1e;font:800 11px/1 var(--font-sans),sans-serif}
.mt-panes{display:grid;grid-template-columns:340px minmax(0,1fr);background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 2px 10px rgba(28,40,20,.05);height:min(680px,calc(100vh - 300px));min-height:460px;overflow:hidden}
.mt-list{display:flex;flex-direction:column;border-right:1px solid var(--line);min-height:0;background:#fffdf9}
.mt-search{margin:12px;position:relative}
.mt-search input{width:100%;height:40px;box-sizing:border-box;border:1.5px solid #d9d1bc;border-radius:10px;padding:0 12px 0 36px;font:14px var(--font-sans),sans-serif;color:var(--ink);background:#fff;outline:none}
.mt-search input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(176,136,64,.14)}
.mt-search svg{position:absolute;left:11px;top:11px;width:18px;height:18px;stroke:#7d8682;fill:none;stroke-width:2}
.mt-rows{flex:1;overflow-y:auto;padding:0 8px 10px}
.mt-sec{padding:12px 8px 6px;font:800 10.5px/1 var(--font-sans),sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.mt-row{width:100%;display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;padding:10px;border:0;border-radius:10px;background:transparent;cursor:pointer;font-family:var(--font-sans),sans-serif;color:var(--ink)}
.mt-row:hover{background:#f7f2e6}.mt-row.on{background:#f1ead8}
.mt-av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#e6ede6;color:#1b5a45;font:800 13px/1 var(--font-sans),sans-serif}
.mt-row.on .mt-av{background:var(--green);color:#fff}
.mt-row b{display:block;font-family:var(--font-display),serif;font-size:15.5px;font-weight:600;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mt-row small{display:block;margin-top:2px;font-size:12.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mt-row .meta{display:grid;justify-items:end;gap:5px;font-size:11.5px;color:var(--muted)}
.mt-unread{display:grid;place-items:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#f1e6c8;color:#7a5a1e;font:800 11.5px/1 var(--font-sans),sans-serif}
.mt-thread{display:flex;flex-direction:column;min-width:0;min-height:0}
.mt-thead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid var(--line)}
.mt-thead h3{margin:0;font-family:var(--font-display),serif;font-size:22px;font-weight:600;letter-spacing:-.02em;line-height:1.1}
.mt-thead p{margin:3px 0 0;font-size:13px;color:var(--muted)}
.mt-back{display:none;border:0;background:none;font:700 13px var(--font-sans),sans-serif;color:var(--green);cursor:pointer;padding:0 0 6px}
.mt-view{flex:none;height:36px;padding:0 14px;border-radius:9px;border:1.5px solid #c9bfa3;background:#fff;color:var(--green);font:800 12.5px var(--font-sans),sans-serif;cursor:pointer}
.mt-status{display:inline-flex;align-items:center;height:20px;padding:0 8px;margin-left:8px;border-radius:999px;background:#e7f0eb;color:#1b5a45;font:800 10px/1 var(--font-sans),sans-serif;letter-spacing:.08em;text-transform:uppercase;vertical-align:middle}
.mt-flow{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px 20px;background:#fbf6e8;border-bottom:1px solid var(--line)}
.mt-flow strong{font:800 12px var(--font-sans),sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#7a5a1e}
.mt-flow span.note{font-size:13px;color:#4f5c56;margin-left:10px}
.mt-flow .acts{display:flex;gap:8px;align-items:center}
.mt-act{height:34px;padding:0 14px;border-radius:9px;border:0;background:var(--green);color:#fff;font:800 12.5px var(--font-sans),sans-serif;cursor:pointer}
.mt-act.ghost{background:#fff;color:var(--green);border:1.5px solid #c9bfa3}
.mt-act:disabled{opacity:.6;cursor:wait}
.mt-changes{display:grid;gap:8px;padding:10px 20px;background:#fff8f0;border-bottom:1px solid var(--line)}
.mt-changes textarea{min-height:64px;box-sizing:border-box;border:1.5px solid #d3cab3;border-radius:10px;padding:10px 12px;font:14px var(--font-sans),sans-serif;resize:vertical;outline:none}
.mt-stream{flex:1;overflow-y:auto;padding:8px 22px 14px;background:#fff}
.mt-day{display:flex;align-items:center;gap:14px;margin:18px 0 10px;font:800 10.5px/1 var(--font-sans),sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8a918d}
.mt-day::before,.mt-day::after{content:"";flex:1;height:1px;background:var(--line)}
.mt-msg{display:grid;grid-template-columns:38px minmax(0,1fr);gap:12px;margin:14px 0}
.mt-msg .who{font-size:14.5px;font-weight:800;color:var(--ink)}.mt-msg .when{margin-left:8px;font-size:12px;font-weight:500;color:#8a918d}
.mt-msg .text{margin-top:2px;font-size:14.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word;color:#1c2a24}
.mt-msg.pending .text{opacity:.6}.mt-msg.failed .text{color:#a3352b}
.mt-retry{margin-left:8px;border:0;background:none;color:#a3352b;font:800 12px var(--font-sans),sans-serif;text-decoration:underline;cursor:pointer}
.mt-sys{margin:12px 0;text-align:center;font-size:12.5px;color:var(--muted)}
.mt-file{display:inline-flex;margin-top:6px;padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:#faf7ee;font-size:13px;font-weight:600;color:var(--green);text-decoration:none}
.mt-compose{display:flex;gap:10px;align-items:flex-end;padding:12px 16px 6px;border-top:1px solid var(--line)}
.mt-compose textarea{flex:1;min-width:0;width:100%;min-height:44px;max-height:140px;resize:none;box-sizing:border-box;border:1.5px solid #d3cab3;border-radius:12px;padding:11px 14px;font:14.5px/1.4 var(--font-sans),sans-serif;color:var(--ink);background:#fff;outline:none}
.mt-compose textarea:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(176,136,64,.14)}
.mt-send{height:44px;padding:0 22px;border:0;border-radius:11px;background:var(--green);color:#fff;font:800 14px var(--font-sans),sans-serif;cursor:pointer}
.mt-send:disabled{background:#c9d3cd;cursor:not-allowed}
.mt-attach{width:44px;height:44px;flex:none;border:1.5px solid #d3cab3;border-radius:11px;background:#fff;cursor:pointer;font-size:18px}
.mt-attach:disabled{opacity:.5;cursor:wait}
button.mt-file{cursor:pointer;font-family:inherit}
.mt-hint{padding:0 18px 12px;font-size:12px;color:#8a918d}
@media(max-width:560px){.mt-compose{gap:7px;padding:10px 10px 6px}.mt-compose textarea{padding:11px 10px;font-size:13.5px}.mt-attach{width:42px}.mt-send{padding:0 14px}}
.mt-empty{flex:1;display:grid;place-items:center;text-align:center;padding:30px;color:var(--muted)}
.mt-empty h4{margin:0 0 6px;font-family:var(--font-display),serif;font-size:22px;color:var(--ink)}
.mt-empty p{margin:0 auto;max-width:360px;font-size:14px;line-height:1.5}
.mt-empty button{margin-top:14px;height:40px;padding:0 18px;border:0;border-radius:10px;background:var(--green);color:#fff;font:800 13px var(--font-sans),sans-serif;cursor:pointer}
.mt-error{padding:12px 14px;margin:0 12px 8px;border-radius:10px;background:#fff5f2;border:1px solid #ead1cc;color:#8b3b2f;font-size:13px}
@media(max-width:820px){
  .mt-panes{grid-template-columns:1fr;height:calc(100vh - 260px);scroll-margin-top:72px}
  .mt-panes.thread-open{height:calc(100vh - 160px);height:calc(100dvh - 160px)}
  .mt-panes .mt-thread{display:none}
  .mt-panes.thread-open .mt-list{display:none}
  .mt-panes.thread-open .mt-thread{display:flex}
  .mt-back{display:block}
}
`;

const rateLimitMessage = (err) => { const text = String(err?.message || ''); return text.startsWith('rate_limited:') ? text.slice('rate_limited:'.length).trim() : null; };

export default function MessagesTab({ currentUser, role, showToast = () => {}, onOpenProject = null, initialConversationId = null, onUnreadChange = null }) {
  const uid = currentUser?.id || null;
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const panesRef = useRef(null);
  const [activeId, setActiveId] = useState(() => {
    try {
      const requested = window.sessionStorage.getItem('kb_messages_open_conversation');
      if (requested) { window.sessionStorage.removeItem('kb_messages_open_conversation'); return requested; }
      // the parent panel can remount this tab (e.g. after a project status change); keep the open thread
      const remembered = window.sessionStorage.getItem('kb_messages_active_conversation');
      if (remembered) return remembered;
    } catch { /* sessionStorage unavailable -- fall back to the initial conversation */ }
    return initialConversationId;
  });
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgError, setMsgError] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  const [changesOpen, setChangesOpen] = useState(false);
  const [changesNote, setChangesNote] = useState('');
  const streamRef = useRef(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  useEffect(() => {
    try {
      if (activeId) window.sessionStorage.setItem('kb_messages_active_conversation', String(activeId));
      else window.sessionStorage.removeItem('kb_messages_active_conversation');
    } catch { /* sessionStorage unavailable -- non-fatal */ }
  }, [activeId]);

  const loadConvos = useCallback(async ({ quiet = false } = {}) => {
    if (!uid) { setConvos([]); setLoading(false); return; }
    if (!quiet) setLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('faithbid_messages_inbox_v1', { p_limit: 100 });
      if (err) throw err;
      setConvos(Array.isArray(data) ? data : []);
      setError(false);
    } catch {
      if (!quiet) setError(true);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  useEffect(() => {
    const onOpen = (e) => {
      const id = e?.detail?.conversationId;
      if (id) { setActiveId(id); try { window.sessionStorage.removeItem('kb_messages_open_conversation'); } catch { /* non-fatal */ } loadConvos({ quiet: true }); }
    };
    window.addEventListener('kb:messages-open', onOpen);
    return () => window.removeEventListener('kb:messages-open', onOpen);
  }, [loadConvos]);

  const unreadTotal = useMemo(() => convos.reduce((n, c) => n + (Number(c.unread_count) || 0), 0), [convos]);
  useEffect(() => { if (typeof onUnreadChange === 'function') onUnreadChange(unreadTotal); }, [unreadTotal, onUnreadChange]);

  const counterpart = useCallback((c) => {
    const raw = (role === 'vendor' ? c.church_name : c.vendor_name) || '';
    if (raw && !isHandleLikeChurchName(raw)) return raw;
    return role === 'vendor' ? 'Church' : 'Vendor';
  }, [role]);

  const active = useMemo(() => convos.find((c) => String(c.id) === String(activeId)) || null, [convos, activeId]);
  useEffect(() => {
    if (!active || typeof window === 'undefined' || window.innerWidth > 820) return;
    const go = () => panesRef.current?.scrollIntoView({ block: 'start' });
    const id = window.requestAnimationFrame(go);
    const retry = window.setTimeout(go, 450);
    return () => { window.cancelAnimationFrame(id); window.clearTimeout(retry); };
  }, [activeId, !!active]);

  const loadMessages = useCallback(async (id) => {
    if (!id) { setMessages([]); return; }
    setLoadingMsgs(true);
    setMsgError(false);
    try {
      const { data, error: err } = await supabase
        .from('messages')
        .select('id,sender_id,text,body,created_at,message_type,event_data,file_name,file_url,file_path,read_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
        .limit(300);
      if (err) throw err;
      if (String(activeIdRef.current) !== String(id)) return;
      setMessages(data || []);
      // mark the other side's messages as read, then clear the badge locally
      const { error: readErr } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', id)
        .is('read_at', null)
        .neq('sender_id', uid);
      if (!readErr) setConvos((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, unread_count: 0 } : c)));
      // keep the bell honest: the notification rows for this thread are now read too
      supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('type', 'new_message').eq('read', false).eq('meta->>conversation_id', String(id)).then(() => {}, () => {});
    } catch {
      if (String(activeIdRef.current) === String(id)) setMsgError(true);
    } finally {
      setLoadingMsgs(false);
    }
  }, [uid]);

  useEffect(() => { loadMessages(activeId); }, [activeId, loadMessages]);

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, activeId]);

  // live updates
  useEffect(() => {
    if (!uid) return undefined;
    const channel = supabase
      .channel(`kb-messages-tab-${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload?.new;
        if (!m) return;
        if (String(m.conversation_id) === String(activeIdRef.current) && m.sender_id !== uid) {
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id).is('read_at', null).then(() => {});
        }
        loadConvos({ quiet: true });
      })
      .subscribe();
    return () => { try { channel.unsubscribe(); } catch { /* channel already gone -- non-fatal */ } };
  }, [uid, loadConvos]);

  const send = async (retryMessage = null) => {
    const text = (retryMessage ? retryMessage.text : draft).trim();
    if (!text || !activeId || !uid || sending) return;
    setSending(true);
    const tempId = retryMessage ? retryMessage.id : `tmp-${Date.now()}`;
    const optimistic = { id: tempId, sender_id: uid, text, created_at: new Date().toISOString(), message_type: 'text', _state: 'pending' };
    setMessages((prev) => (retryMessage ? prev.map((m) => (m.id === tempId ? optimistic : m)) : [...prev, optimistic]));
    if (!retryMessage) setDraft('');
    try {
      const { data, error: err } = await supabase.from('messages').insert({ conversation_id: activeId, sender_id: uid, text }).select().single();
      if (err) throw err;
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
      loadConvos({ quiet: true });
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _state: 'failed' } : m)));
      showToast(rateLimitMessage(err) || 'Message could not be sent. Tap Retry.', 'error');
    } finally {
      setSending(false);
    }
  };

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const attachFile = async (file) => {
    if (!file || !activeId || !uid || uploading) return;
    if (file.size > 25 * 1024 * 1024) { showToast('That file is over 25 MB. Please send a smaller one.', 'error'); return; }
    setUploading(true);
    try {
      const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80) || 'file';
      const path = `chat/${activeId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from('chat-files').upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw upErr;
      const { data, error: insErr } = await supabase.from('messages').insert({ conversation_id: activeId, sender_id: uid, text: draft.trim() || file.name, file_name: file.name, file_path: path, message_type: 'file' }).select().single();
      if (insErr) throw insErr;
      setDraft('');
      setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
      loadConvos({ quiet: true });
    } catch (err) {
      showToast(rateLimitMessage(err) || (err?.message?.includes('mime') ? 'That file type is not supported.' : 'File could not be sent. Please try again.'), 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const openFile = async (m) => {
    try {
      if (m.file_path) {
        const { data, error: err } = await supabase.storage.from('chat-files').createSignedUrl(m.file_path, 300);
        if (err) throw err;
        window.open(data.signedUrl, '_blank', 'noopener');
      } else if (m.file_url) window.open(m.file_url, '_blank', 'noopener');
    } catch { showToast('Could not open that file.', 'error'); }
  };

  const runLifecycle = async (action, note = null) => {
    if (!active?.project_id || pendingAction) return;
    if (action === 'confirm_completion' && typeof window !== 'undefined' && !window.confirm('Accept this work and mark the project complete?')) return;
    setPendingAction(action);
    try {
      const { error: err } = await supabase.rpc('marketplace_service_transition_project', { p_project_id: active.project_id, p_action: action, p_note: note || null });
      if (err) throw err;
      showToast(LIFECYCLE_TOAST[action] || 'Project updated.');
      setChangesOpen(false);
      setChangesNote('');
      await loadConvos({ quiet: true });
    } catch (err) {
      showToast(err?.message || 'That action could not be completed. Please try again.', 'error');
    } finally {
      setPendingAction('');
    }
  };

  const flow = active ? lifecycleControls(active, role) : null;

  const nameOf = (senderId) => (senderId === uid ? 'You' : (active ? counterpart(active) : 'Them'));

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return convos.filter((c) => {
      if (filter === 'archived') { if (!c.archived) return false; } else if (c.archived) return false;
      if (filter === 'unread' && !(Number(c.unread_count) > 0)) return false;
      if (!q) return true;
      return [counterpart(c), c.project_title, c.last_message].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [convos, filter, search, counterpart]);

  const needsReply = visible.filter((c) => Number(c.unread_count) > 0);
  const rest = visible.filter((c) => !(Number(c.unread_count) > 0));

  const renderRow = (c) => (
    <button key={c.id} type="button" className={`mt-row${String(c.id) === String(activeId) ? ' on' : ''}`} onClick={() => setActiveId(c.id)}>
      <span className="mt-av" aria-hidden="true">{initialsOf(counterpart(c))}</span>
      <span><b>{c.project_title || 'Project'}</b><small>{counterpart(c)}{c.last_message ? ` · ${c.last_message}` : ''}</small></span>
      <span className="meta"><span>{formatWhen(c.last_message_at, { list: true })}</span>{Number(c.unread_count) > 0 ? <span className="mt-unread" aria-label={`${c.unread_count} unread`}>{c.unread_count}</span> : null}</span>
    </button>
  );

  let lastDay = '';

  return (
    <div className="mt-root">
      <style>{STYLE}</style>
      <div className="mt-head">
        <h2>Messages</h2>
        <p>Your conversations with {role === 'vendor' ? 'churches' : 'vendors'}, organized by project.</p>
      </div>
      <div className="mt-tabs" role="tablist" aria-label="Message filters">
        {[['all', 'All'], ['unread', 'Unread'], ['archived', 'Archived']].map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={filter === key} className={`mt-tab${filter === key ? ' on' : ''}`} onClick={() => setFilter(key)}>
            {label}{key === 'unread' && unreadTotal > 0 ? <span className="mt-badge">{unreadTotal}</span> : null}
          </button>
        ))}
      </div>

      <div ref={panesRef} className={`mt-panes${activeId && active ? ' thread-open' : ''}`}>
        <aside className="mt-list" aria-label="Conversations">
          <div className="mt-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a conversation" aria-label="Find a conversation" />
          </div>
          {error ? (
            <div className="mt-error" role="alert">We couldn't load your conversations. Your messages are safe. <button type="button" className="mt-retry" style={{color:'#8b3b2f'}} onClick={() => loadConvos()}>Try again</button></div>
          ) : null}
          <div className="mt-rows">
            {loading ? <div className="mt-empty"><p>Loading conversations…</p></div> : null}
            {!loading && !error && visible.length === 0 ? (
              <div className="mt-empty">
                <div>
                  <h4>{filter === 'unread' ? 'All caught up.' : filter === 'archived' ? 'Nothing archived.' : 'No conversations yet.'}</h4>
                  <p>{filter === 'all' ? (role === 'vendor' ? 'When a church invites you to a project or replies to a proposal, the conversation appears here.' : 'When you message a vendor about a project, the conversation appears here.') : 'Nothing to show here right now.'}</p>
                </div>
              </div>
            ) : null}
            {needsReply.length ? <><div className="mt-sec">Needs a reply</div>{needsReply.map(renderRow)}</> : null}
            {rest.length ? <>{needsReply.length ? <div className="mt-sec">Everything else</div> : null}{rest.map(renderRow)}</> : null}
          </div>
        </aside>

        <section className="mt-thread" aria-label="Conversation">
          {active ? (
            <>
              <div className="mt-thead">
                <div style={{minWidth:0}}>
                  <button type="button" className="mt-back" onClick={() => setActiveId(null)}>← All conversations</button>
                  <h3>{active.project_title || 'Project'}{active.project_status ? <span className="mt-status">{String(active.project_status).replace(/_/g, ' ')}</span> : null}</h3>
                  <p>{counterpart(active)}</p>
                </div>
                {active.project_id && typeof onOpenProject === 'function' ? (
                  <button type="button" className="mt-view" onClick={() => onOpenProject({ id: active.project_id, title: active.project_title })}>View project</button>
                ) : null}
              </div>
              {flow ? (
                <div className="mt-flow">
                  <div><strong>{flow.label}</strong><span className="note">{flow.note}</span></div>
                  <div className="acts">
                    {flow.secondary ? <button type="button" className="mt-act ghost" disabled={!!pendingAction} onClick={() => setChangesOpen((v) => !v)}>{flow.secondary.label}</button> : null}
                    {flow.primary ? <button type="button" className={`mt-act${flow.primary.ghost ? ' ghost' : ''}`} disabled={!!pendingAction} onClick={() => runLifecycle(flow.primary.action)}>{pendingAction === flow.primary.action ? 'Working…' : flow.primary.label}</button> : null}
                  </div>
                </div>
              ) : null}
              {flow && flow.secondary && changesOpen ? (
                <div className="mt-changes">
                  <textarea value={changesNote} onChange={(e) => setChangesNote(e.target.value.slice(0, 1000))} placeholder="What needs to change? The vendor will see this." aria-label="Requested changes" />
                  <div className="acts" style={{display:'flex',gap:8}}>
                    <button type="button" className="mt-act" disabled={!!pendingAction || changesNote.trim().length < 3} onClick={() => runLifecycle('request_changes', changesNote.trim())}>{pendingAction === 'request_changes' ? 'Sending…' : 'Send request'}</button>
                    <button type="button" className="mt-act ghost" onClick={() => setChangesOpen(false)}>Cancel</button>
                  </div>
                </div>
              ) : null}
              <div className="mt-stream" ref={streamRef}>
                {loadingMsgs && messages.length === 0 ? <div className="mt-empty"><p>Loading messages…</p></div> : null}
                {msgError ? (
                  <div className="mt-error" role="alert" style={{margin:'12px 0'}}>We couldn't load this conversation. <button type="button" className="mt-retry" style={{color:'#8b3b2f'}} onClick={() => loadMessages(activeId)}>Try again</button></div>
                ) : null}
                {!loadingMsgs && !msgError && messages.length === 0 ? (
                  <div className="mt-empty"><div><h4>Start the conversation.</h4><p>Keep the first message specific: scope, timing, budget, files, or the next decision needed.</p></div></div>
                ) : null}
                {messages.map((m) => {
                  const day = dayLabel(m.created_at);
                  const showDay = day && day !== lastDay;
                  if (showDay) lastDay = day;
                  const body = m.text || m.body || '';
                  const isEvent = m.message_type && m.message_type !== 'text' && !m.file_name;
                  return (
                    <React.Fragment key={m.id}>
                      {showDay ? <div className="mt-day">{day}</div> : null}
                      {isEvent ? (
                        <div className="mt-sys">{body || String(m.message_type).replace(/_/g, ' ')}</div>
                      ) : (
                        <div className={`mt-msg${m._state === 'pending' ? ' pending' : ''}${m._state === 'failed' ? ' failed' : ''}`}>
                          <span className="mt-av" aria-hidden="true">{initialsOf(nameOf(m.sender_id))}</span>
                          <div>
                            <div><span className="who">{nameOf(m.sender_id)}</span><span className="when">{new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>{m._state === 'failed' ? <button type="button" className="mt-retry" onClick={() => send(m)}>Retry</button> : null}</div>
                            {body && !(m.file_name && body === m.file_name) ? <div className="text">{body}</div> : null}
                            {m.file_name ? <button type="button" className="mt-file" onClick={() => openFile(m)}>{m.file_name}</button> : null}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="mt-compose">
                <input ref={fileInputRef} type="file" hidden onChange={(e) => attachFile(e.target.files?.[0])} />
                <button type="button" className="mt-attach" aria-label="Attach a file" title="Attach a file" disabled={uploading} onClick={() => fileInputRef.current?.click()}>{uploading ? '…' : '📎'}</button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing && window.matchMedia && !window.matchMedia('(pointer: coarse)').matches) { e.preventDefault(); send(); } }}
                  placeholder={`Message ${counterpart(active)}`}
                  aria-label="Message"
                  rows={1}
                />
                <button type="button" className="mt-send" disabled={!draft.trim() || sending} onClick={() => send()}>Send</button>
              </div>
              <div className="mt-hint">Enter to send · Shift+Enter for a new line</div>
            </>
          ) : (
            <div className="mt-empty">
              <div>
                <h4>Select a conversation</h4>
                <p>Pick a project on the left to read and reply.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
