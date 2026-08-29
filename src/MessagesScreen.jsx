import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import {
  DealRoomCallComposerTool,
  DealRoomCallMessageCard,
} from "./features/deal-room/DealRoomCall";
import {
  buildDealRoomCallPreview,
  hydrateDealRoomCallEvent,
  normalizeDealRoomCallUrl,
} from "./features/deal-room/DealRoomCallUtils";

let BRAND, ConfirmModal, KBEmptyState, KB_BP_DESKTOP, KB_BP_TABLET_INBOX, KB_BP_WIDE, KB_INBOX_ASSIGN_KEY_GLOBAL, KB_INBOX_DRAFTS_KEY_GLOBAL, KB_INBOX_LAST_VIEWED_KEY_GLOBAL, KB_INBOX_MUTED_KEY_GLOBAL, KB_INBOX_NEXT_DISMISSED_KEY_GLOBAL, KB_INBOX_PINNED_KEY_GLOBAL, KB_INBOX_RESOLVED_KEY_GLOBAL, KB_INBOX_SNOOZE_KEY_GLOBAL, KB_INBOX_STARRED_KEY_GLOBAL, KB_INBOX_THREAD_META_SYNC_KEYS, KB_NAV_SCREENS, KB_RETURN_CONTEXT_KEY, PROJECT_PHASES, __KB_STORAGE_SYNC_EVENT, activateOnKey, buildVendorPairSignals, canCreateInboxConversation, countOpenDisputesSafe, createTrustedNotificationSafe, deriveCanonicalDealState, ensureInboxConversation, fetchUnreadConversationCountsSafe, fetchVendorPairSignalMaps, firstNonEmpty, formatMoney, getDealRoomActionSet, getDealStateBadge, getDealStateMeta, getDealStateSummary, getInitialsSafe, getReturnNavigationTarget, getSignedChatFileUrl, getUploadFailureMessage, getVendorPairSignalMapEntry, hydrateDealSystemEvent, kbIsDevRuntime, kbSafeSessionGet, kbSafeSessionSet, kbTrackChannel, loadProjectWorkspace, logError, makeEmptyVendorPairSignalMaps, markConversationReadSafe, mergeUniqueStrings, persistConversationUserStatePatch, persistSavedProjectRecord, pushProjectInteropSignal, queueProjectNavigation, queueVendorNavigation, readJsonStorage, readReturnContext, runSupabaseWithFallback, safeArray, sanitizePostgrestTerm, saveProjectOpsState, saveProjectWorkspace, selectConversationsSafe, transitionProjectLifecycleSafe, updateConversationSafe, updateNotificationsSafe, useViewportWidth, validateAppUploadFile, writeStorageAndEmit;

function applyMessagesScreenDependencies(dependencies = {}) {
  ({ BRAND, ConfirmModal, KBEmptyState, KB_BP_DESKTOP, KB_BP_TABLET_INBOX, KB_BP_WIDE, KB_INBOX_ASSIGN_KEY_GLOBAL, KB_INBOX_DRAFTS_KEY_GLOBAL, KB_INBOX_LAST_VIEWED_KEY_GLOBAL, KB_INBOX_MUTED_KEY_GLOBAL, KB_INBOX_NEXT_DISMISSED_KEY_GLOBAL, KB_INBOX_PINNED_KEY_GLOBAL, KB_INBOX_RESOLVED_KEY_GLOBAL, KB_INBOX_SNOOZE_KEY_GLOBAL, KB_INBOX_STARRED_KEY_GLOBAL, KB_INBOX_THREAD_META_SYNC_KEYS, KB_NAV_SCREENS, KB_RETURN_CONTEXT_KEY, PROJECT_PHASES, __KB_STORAGE_SYNC_EVENT, activateOnKey, buildVendorPairSignals, canCreateInboxConversation, countOpenDisputesSafe, createTrustedNotificationSafe, deriveCanonicalDealState, ensureInboxConversation, fetchUnreadConversationCountsSafe, fetchVendorPairSignalMaps, firstNonEmpty, formatMoney, getDealRoomActionSet, getDealStateBadge, getDealStateMeta, getDealStateSummary, getInitialsSafe, getReturnNavigationTarget, getSignedChatFileUrl, getUploadFailureMessage, getVendorPairSignalMapEntry, hydrateDealSystemEvent, kbIsDevRuntime, kbSafeSessionGet, kbSafeSessionSet, kbTrackChannel, loadProjectWorkspace, logError, makeEmptyVendorPairSignalMaps, markConversationReadSafe, mergeUniqueStrings, persistConversationUserStatePatch, persistSavedProjectRecord, pushProjectInteropSignal, queueProjectNavigation, queueVendorNavigation, readJsonStorage, readReturnContext, runSupabaseWithFallback, safeArray, sanitizePostgrestTerm, saveProjectOpsState, saveProjectWorkspace, selectConversationsSafe, transitionProjectLifecycleSafe, updateConversationSafe, updateNotificationsSafe, useViewportWidth, validateAppUploadFile, writeStorageAndEmit } = dependencies || {});
}

function hydrateInboxConversationMeta(conversation = {}, meta = {}) {
  const key = String(conversation?.id || '');
  return {
    ...conversation,
    starred: !!meta?.starredSet?.has?.(key),
    muted: !!meta?.mutedSet?.has?.(key),
    snoozedUntil: (meta?.snoozedMap || {})[key] || null,
    assignedTo: (meta?.assignmentMap || {})[key] || '',
    resolved: !!(meta?.resolvedMap || {})[key],
    pinnedRecord: (meta?.pinnedRecordMap || {})[key] || null,
    lastViewedAt: (meta?.lastViewedMap || {})[key] || null,
  };
}

function readInboxThreadMetaSnapshot() {
  return {
    draftsMap: readJsonStorage(KB_INBOX_DRAFTS_KEY_GLOBAL, {}) || {},
    nextDismissedMap: readJsonStorage(KB_INBOX_NEXT_DISMISSED_KEY_GLOBAL, {}) || {},
    starredIds: readJsonStorage(KB_INBOX_STARRED_KEY_GLOBAL, []) || [],
    snoozedMap: readJsonStorage(KB_INBOX_SNOOZE_KEY_GLOBAL, {}) || {},
    mutedIds: readJsonStorage(KB_INBOX_MUTED_KEY_GLOBAL, []) || [],
    assignmentMap: readJsonStorage(KB_INBOX_ASSIGN_KEY_GLOBAL, {}) || {},
    resolvedMap: readJsonStorage(KB_INBOX_RESOLVED_KEY_GLOBAL, {}) || {},
    pinnedRecordMap: readJsonStorage(KB_INBOX_PINNED_KEY_GLOBAL, {}) || {},
    lastViewedMap: readJsonStorage(KB_INBOX_LAST_VIEWED_KEY_GLOBAL, {}) || {},
  };
}

const IDENTITY_PERSIST_VALUE = (value) => value;
const NORMALIZE_PERSIST_STRING_LIST = (value) => mergeUniqueStrings(value || []);
function useStoredJsonSync(storageKey, value, normalize = IDENTITY_PERSIST_VALUE) {
  const normalizedValue = useMemo(() => normalize(value), [value, normalize]);
  useEffect(() => {
    writeStorageAndEmit(storageKey, normalizedValue);
  }, [storageKey, normalizedValue]);
  return normalizedValue;
}

function useInboxThreadState({ activeId = null, activeConvoRef = null, onToast = null, onMenuClose = null } = {}) {
  const initialStorageRef = useRef(null);
  if (!initialStorageRef.current) initialStorageRef.current = readInboxThreadMetaSnapshot();
  const initialStorage = initialStorageRef.current;

  const [draft, setDraft] = useState(activeId ? String(initialStorage.draftsMap[String(activeId)] || '') : '');
  const [nextDismissed, setNextDismissed] = useState(activeId ? !!initialStorage.nextDismissedMap[String(activeId)] : false);
  const [starredIds, setStarredIds] = useState(initialStorage.starredIds);
  const [snoozedMap, setSnoozedMap] = useState(initialStorage.snoozedMap);
  const [mutedIds, setMutedIds] = useState(initialStorage.mutedIds);
  const [assignmentMap, setAssignmentMap] = useState(initialStorage.assignmentMap);
  const [resolvedMap, setResolvedMap] = useState(initialStorage.resolvedMap);
  const [pinnedRecordMap, setPinnedRecordMap] = useState(initialStorage.pinnedRecordMap);
  const [lastViewedMap, setLastViewedMap] = useState(initialStorage.lastViewedMap);

  const starredSet = useMemo(() => new Set((starredIds || []).map(id => String(id))), [starredIds]);
  const mutedSet = useMemo(() => new Set((mutedIds || []).map(id => String(id))), [mutedIds]);

  useEffect(() => {
    const storage = readInboxThreadMetaSnapshot();
    if (activeId) {
      setDraft(String(storage.draftsMap[String(activeId)] || ''));
      setNextDismissed(!!storage.nextDismissedMap[String(activeId)]);
    } else {
      setDraft('');
      setNextDismissed(false);
    }
  }, [activeId]);

  useStoredJsonSync(KB_INBOX_STARRED_KEY_GLOBAL, starredIds, NORMALIZE_PERSIST_STRING_LIST);
  useStoredJsonSync(KB_INBOX_SNOOZE_KEY_GLOBAL, snoozedMap || {});
  useStoredJsonSync(KB_INBOX_MUTED_KEY_GLOBAL, mutedIds, NORMALIZE_PERSIST_STRING_LIST);
  useStoredJsonSync(KB_INBOX_ASSIGN_KEY_GLOBAL, assignmentMap || {});
  useStoredJsonSync(KB_INBOX_RESOLVED_KEY_GLOBAL, resolvedMap || {});
  useStoredJsonSync(KB_INBOX_PINNED_KEY_GLOBAL, pinnedRecordMap || {});
  useStoredJsonSync(KB_INBOX_LAST_VIEWED_KEY_GLOBAL, lastViewedMap || {});

  useEffect(() => {
    const syncConversationState = (event) => {
      if (event?.type === 'kb:storage-sync') {
        const syncKey = event?.detail?.key;
        if (syncKey && !KB_INBOX_THREAD_META_SYNC_KEYS.includes(syncKey)) return;
      }
      const storage = readInboxThreadMetaSnapshot();
      setStarredIds(storage.starredIds);
      setSnoozedMap(storage.snoozedMap);
      setMutedIds(storage.mutedIds);
      setAssignmentMap(storage.assignmentMap);
      setResolvedMap(storage.resolvedMap);
      setPinnedRecordMap(storage.pinnedRecordMap);
      setLastViewedMap(storage.lastViewedMap);
      if (activeId) {
        setDraft(String(storage.draftsMap[String(activeId)] || ''));
        setNextDismissed(!!storage.nextDismissedMap[String(activeId)]);
      } else {
        setDraft('');
        setNextDismissed(false);
      }
    };
    window.addEventListener('kb:conversation-state', syncConversationState);
    window.addEventListener('kb:storage-sync', syncConversationState);
    return () => {
      window.removeEventListener('kb:conversation-state', syncConversationState);
      window.removeEventListener('kb:storage-sync', syncConversationState);
    };
  }, [activeId]);

  const pushToast = (message) => {
    if (message && typeof onToast === 'function') onToast(message);
  };
  const closeMenu = () => {
    if (typeof onMenuClose === 'function') onMenuClose();
  };

  const getStoredDraft = (convoId) => {
    if (!convoId) return '';
    const drafts = readJsonStorage(KB_INBOX_DRAFTS_KEY_GLOBAL, {}) || {};
    return String(drafts[String(convoId)] || '');
  };
  const saveStoredDraft = (convoId, value) => {
    if (!convoId) return;
    const drafts = { ...(readJsonStorage(KB_INBOX_DRAFTS_KEY_GLOBAL, {}) || {}) };
    if (value) drafts[String(convoId)] = value;
    else delete drafts[String(convoId)];
    writeStorageAndEmit(KB_INBOX_DRAFTS_KEY_GLOBAL, drafts);
    persistConversationUserStatePatch(convoId, { draft_text: value || null });
  };
  const getNextDismissedForConvo = (convoId) => {
    if (!convoId) return false;
    const map = readJsonStorage(KB_INBOX_NEXT_DISMISSED_KEY_GLOBAL, {}) || {};
    return !!map[String(convoId)];
  };
  const setNextDismissedForConvo = (convoId, value) => {
    if (!convoId) return;
    const map = { ...(readJsonStorage(KB_INBOX_NEXT_DISMISSED_KEY_GLOBAL, {}) || {}) };
    if (value) map[String(convoId)] = true;
    else delete map[String(convoId)];
    writeStorageAndEmit(KB_INBOX_NEXT_DISMISSED_KEY_GLOBAL, map);
    persistConversationUserStatePatch(convoId, { next_up_dismissed: !!value });
  };
  const formatRelativeTime = (iso) => {
    if (!iso) return 'just now';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.max(0, Math.round(diff / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  };
  const getSnoozedUntil = (convoId) => (snoozedMap || {})[String(convoId)] || null;
  const isSnoozedThread = (convo) => {
    const until = getSnoozedUntil(convo?.id);
    return !!until && new Date(until).getTime() > Date.now();
  };
  const getAssignmentForConvo = (convoId) => (assignmentMap || {})[String(convoId)] || '';
  const isResolvedThread = (convoId) => !!(resolvedMap || {})[String(convoId)];
  const getPinnedRecordForConvo = (convoId) => (pinnedRecordMap || {})[String(convoId)] || null;
  const getLastViewedLabel = (convoId) => {
    const iso = (lastViewedMap || {})[String(convoId)] || null;
    return iso ? `Opened ${formatRelativeTime(iso)}` : 'Not opened yet';
  };
  const setThreadAssignment = (convoId, owner) => {
    if (!convoId) return;
    setAssignmentMap(prev => {
      const next = { ...(prev || {}) };
      if (owner) next[String(convoId)] = owner;
      else delete next[String(convoId)];
      return next;
    });
    persistConversationUserStatePatch(convoId, { assigned_to: owner || null });
    pushToast(owner ? `Assigned to ${owner}` : 'Cleared assignment');
    closeMenu();
  };
  const setThreadSnooze = (convoId, untilIso, label = 'Snoozed') => {
    if (!convoId) return;
    setSnoozedMap(prev => ({ ...(prev || {}), [String(convoId)]: untilIso }));
    persistConversationUserStatePatch(convoId, { snoozed_until: untilIso });
    pushToast(label);
    closeMenu();
  };
  const clearThreadSnooze = (convoId) => {
    if (!convoId) return;
    setSnoozedMap(prev => {
      const next = { ...(prev || {}) };
      delete next[String(convoId)];
      return next;
    });
    persistConversationUserStatePatch(convoId, { snoozed_until: null });
    pushToast('Snooze cleared');
    closeMenu();
  };
  const toggleMuteThread = (convoId) => {
    if (!convoId) return;
    setMutedIds(prev => {
      const key = String(convoId);
      const exists = (prev || []).map(String).includes(key);
      const next = exists ? (prev || []).filter(id => String(id) !== key) : [...(prev || []), convoId];
      persistConversationUserStatePatch(convoId, { is_muted: !exists });
      pushToast(exists ? 'Thread unmuted' : 'Thread muted');
      return next;
    });
    closeMenu();
  };
  const toggleResolvedThread = (convoId) => {
    if (!convoId) return;
    setResolvedMap(prev => {
      const next = { ...(prev || {}) };
      if (next[String(convoId)]) delete next[String(convoId)];
      else next[String(convoId)] = true;
      persistConversationUserStatePatch(convoId, { is_resolved: !!next[String(convoId)] });
      pushToast(next[String(convoId)] ? 'Thread marked resolved' : 'Thread reopened');
      return next;
    });
    closeMenu();
  };
  const pinMessageToRecord = (convoId, message) => {
    if (!convoId || !message) return;
    const payload = {
      id: message.id || null,
      text: message.type === 'file' ? `📎 ${message.fileName || 'Attachment'}` : String(message.text || '').slice(0, 220),
      type: message.type || 'text',
      fileUrl: message.fileUrl || null,
      fileName: message.fileName || null,
      author: message.from === 'me' ? 'You' : (activeConvoRef?.current?.name || 'Counterparty'),
      createdAt: message.createdAt || new Date().toISOString(),
    };
    setPinnedRecordMap(prev => ({ ...(prev || {}), [String(convoId)]: payload }));
    pushToast('Pinned to project record');
  };
  const clearPinnedRecord = (convoId) => {
    if (!convoId) return;
    setPinnedRecordMap(prev => {
      const next = { ...(prev || {}) };
      delete next[String(convoId)];
      return next;
    });
    pushToast('Removed pinned record');
  };
  const markThreadViewed = (convoId) => {
    if (!convoId) return;
    const stamp = new Date().toISOString();
    setLastViewedMap(prev => ({ ...(prev || {}), [String(convoId)]: stamp }));
  };
  const toggleStarThread = (convoId) => {
    if (!convoId) return;
    setStarredIds(prev => {
      const key = String(convoId);
      const exists = (prev || []).map(String).includes(key);
      const next = exists ? (prev || []).filter(id => String(id) !== key) : [...(prev || []), convoId];
      persistConversationUserStatePatch(convoId, { is_starred: !exists });
      pushToast(exists ? 'Removed from starred' : 'Starred thread');
      return next;
    });
  };

  return {
    draft,
    setDraft,
    nextDismissed,
    setNextDismissed,
    starredIds,
    snoozedMap,
    mutedIds,
    assignmentMap,
    resolvedMap,
    pinnedRecordMap,
    lastViewedMap,
    starredSet,
    mutedSet,
    getStoredDraft,
    saveStoredDraft,
    getNextDismissedForConvo,
    setNextDismissedForConvo,
    getSnoozedUntil,
    isSnoozedThread,
    getAssignmentForConvo,
    isResolvedThread,
    getPinnedRecordForConvo,
    getLastViewedLabel,
    setThreadAssignment,
    setThreadSnooze,
    clearThreadSnooze,
    toggleMuteThread,
    toggleResolvedThread,
    pinMessageToRecord,
    clearPinnedRecord,
    markThreadViewed,
    toggleStarThread,
  };
}



/* ╔══════════════════════════════════════════════════════════════════════════════
   ║  INBOX MODULE — MessagesScreen + sub-components
   ╟
   ╟  Components: InboxRail, InboxThreadList, InboxDealBanner,
   ╟              InboxComposer, MessagesScreen
   ╟
   ╟  External deps (passed as props or imported from module scope):
   ╟    supabase, logError, runSupabaseWithFallback, selectProfilesSafe
   ╟    mapConversationRow, hydrateInboxConversationMeta
   ╟    fetchUnreadConversationCountsSafe, getSignedChatFileUrl
   ╟    deriveCanonicalDealState, loadProjectWorkspace, saveProjectWorkspace
   ╟    countOpenDisputesSafe, queueInboxNavigation, queueProjectNavigation
   ╟    queueVendorNavigation, rememberReturnContext, stageLabel, openInboxThread
   ╟    KB_NAV_SCREENS, MESSAGE_PAGE_SIZE
   ╟
   ╟  To extract to src/features/inbox/MessagesScreen.jsx:
   ╟    1. Cut everything between these markers into the new file
   ╟    2. Add: import { supabase } from '../../supabaseClient'
   ╟    3. Import the helper functions listed above
   ╟    4. Add: export default MessagesScreen
   ╟    5. In App.jsx: import MessagesScreen from './features/inbox/MessagesScreen'
   ╚══════════════════════════════════════════════════════════════════════════════ */


function getKBAvatarInitials(name = "") {
  const cleaned = String(name || "").replace(/&/g, " and ").replace(/[^a-zA-Z0-9\s]/g, " ").trim();
  if (!cleaned) return "?";
  const words = cleaned.split(/\s+/).filter(Boolean).filter(w => !/^(the|and|of|at|for|a|an)$/i.test(w));
  const usable = words.length ? words : cleaned.split(/\s+/).filter(Boolean);
  if (usable.length === 1) return usable[0].slice(0, 2).toUpperCase();
  return `${usable[0][0] || ""}${usable[usable.length - 1][0] || ""}`.toUpperCase() || "?";
}



// Restored at module scope: previously lived inside the orphan InboxDealBanner
// component (now removed), but live MessagesScreen code still references it.
function getDealStageLabel(state) {
  if (state === "bid_placed" || state === "bid_under_review") return 'Bid placed';
  if (state === "milestone_pending") return 'Active';
  if (state === 'resolved') return 'Resolved';
  return getDealStateMeta(state || 'inquiry').label;
}

// 0171 — Deal Room Checkpoint 1. These helpers deliberately read only the
// canonical persisted project lifecycle. They do not consult workspace
// localStorage, hidden sync snapshots, milestone display guesses, or chat text.
function getCanonicalDealRoomStatus(project = {}) {
  const status = String(project?.status || '').trim().toLowerCase();
  if (status === 'completed') return { key:'completed', label:'Completed', tone:'complete' };
  if (status === 'in_progress' && project?.completion_requested_at) return { key:'ready_for_review', label:'Ready for review', tone:'review' };
  if (status === 'in_progress') return { key:'in_progress', label:'In progress', tone:'progress' };
  if (status === 'hired') return { key:'hired', label:'Hired', tone:'hired' };
  return { key:status || 'unknown', label:status ? status.replace(/_/g,' ') : 'Project', tone:'muted' };
}

function getCanonicalDealRoomNextAction(project = {}, viewerRole = 'church') {
  const status = String(project?.status || '').trim().toLowerCase();
  const roleKey = String(viewerRole || '').trim().toLowerCase();
  const isChurch = roleKey === 'church';
  const isVendor = roleKey === 'vendor';
  const hasCompletionRequest = !!project?.completion_requested_at;

  if (status === 'completed') {
    return {
      eyebrow:'Handoff confirmed',
      headline:'Project complete.',
      body:isChurch
        ? 'The work has been accepted and the completed project is now part of your FaithBid record.'
        : 'The church confirmed the handoff and the completed project is now part of your FaithBid record.',
      state:'completed',
    };
  }

  if (status === 'in_progress' && hasCompletionRequest) {
    return isChurch ? {
      eyebrow:'Your turn',
      headline:'Work is ready for your review.',
      body:'Review the shared work against the accepted agreement. The next marketplace step is to accept the handoff or request changes.',
      state:'ready_for_review',
    } : {
      eyebrow:'Waiting on the church',
      headline:'Your work is with the church for review.',
      body:'FaithBid has recorded the completion request. Keep any final context or files in this conversation while the church reviews the handoff.',
      state:'awaiting_review',
    };
  }

  if (status === 'in_progress') {
    return isVendor ? {
      eyebrow:'What happens next',
      headline:'Work is in progress.',
      body:'When the agreed work is ready, the next marketplace step is to submit it for church review.',
      state:'in_progress',
    } : {
      eyebrow:'Current state',
      headline:'Your vendor is working on the project.',
      body:'No approval is needed yet. Keep the accepted scope, shared files, and conversation together here while the work moves forward.',
      state:'in_progress',
    };
  }

  if (status === 'hired') {
    return isVendor ? {
      eyebrow:'What happens next',
      headline:"You're hired — the project is ready to begin.",
      body:'The accepted agreement is locked in. Once work begins, FaithBid can track the project through review and final handoff.',
      state:'hired',
    } : {
      eyebrow:'Current state',
      headline:'The vendor has been hired.',
      body:'The accepted agreement is locked in. Keep communication and shared work here as the project gets underway.',
      state:'hired',
    };
  }

  return {
    eyebrow:'Project record',
    headline:'Keep the project moving from one shared record.',
    body:'FaithBid will surface the next marketplace-critical step from canonical project state.',
    state:'unknown',
  };
}

// 0185 — Hub-only attention ownership. This does not create tasks or change the
// lifecycle; it translates the same persisted project state into "who owns the
// next marketplace-critical step?" for Active Deal Room triage.
function getCanonicalDealRoomAttentionMeta(project = {}, viewerRole = 'church') {
  const status = String(project?.status || '').trim().toLowerCase();
  const roleKey = String(viewerRole || '').trim().toLowerCase();
  const isChurch = roleKey === 'church';
  const isVendor = roleKey === 'vendor';
  const completionRequested = !!project?.completion_requested_at;

  if (status === 'completed') {
    return {
      needsMe:false,
      label:'Complete',
      detail:'Handoff confirmed',
      tone:'complete',
    };
  }

  if (status === 'hired') {
    if (isVendor) {
      return {
        needsMe:true,
        label:'Your action',
        detail:'Start work',
        tone:'action',
      };
    }
    return {
      needsMe:false,
      label:'Waiting on vendor',
      detail:'Vendor can start work',
      tone:'waiting',
    };
  }

  if (status === 'in_progress' && completionRequested) {
    if (isChurch) {
      return {
        needsMe:true,
        label:'Your action',
        detail:'Review submitted work',
        tone:'action',
      };
    }
    return {
      needsMe:false,
      label:'Waiting on church',
      detail:'Church is reviewing',
      tone:'waiting',
    };
  }

  if (status === 'in_progress') {
    if (isVendor) {
      return {
        needsMe:true,
        label:'Your action',
        detail:'Submit work for review',
        tone:'action',
      };
    }
    return {
      needsMe:false,
      label:'Waiting on vendor',
      detail:'Work is in progress',
      tone:'waiting',
    };
  }

  return {
    needsMe:false,
    label:'Project update',
    detail:'Open the Deal Room',
    tone:'muted',
  };
}

// 0172 — canonical Deal Room controls. These are presentation bindings for the
// already-existing marketplace_service_transition_project state machine.
function getCanonicalDealRoomControls(project = {}, viewerRole = 'church') {
  const status = String(project?.status || '').trim().toLowerCase();
  const roleKey = String(viewerRole || '').trim().toLowerCase();
  const isChurch = roleKey === 'church';
  const isVendor = roleKey === 'vendor';
  const completionRequested = !!project?.completion_requested_at;
  const messageControl = { kind:'message', label:isChurch ? 'Message vendor' : 'Message church' };

  if (status === 'completed') {
    return { primary:messageControl, secondary:null };
  }
  if (status === 'hired') {
    return {
      primary:{ kind:'transition', action:'start', label:isVendor ? 'Start work' : 'Confirm work started' },
      secondary:messageControl,
    };
  }
  if (status === 'in_progress' && completionRequested) {
    if (isChurch) {
      return {
        primary:{ kind:'panel', action:'confirm_completion', label:'Accept work' },
        secondary:{ kind:'panel', action:'request_changes', label:'Request changes' },
      };
    }
    if (isVendor) {
      return {
        primary:messageControl,
        secondary:{ kind:'transition', action:'cancel_completion_request', label:'Withdraw review request' },
      };
    }
  }
  if (status === 'in_progress') {
    if (isVendor) {
      return {
        primary:{ kind:'transition', action:'request_completion', label:'Ready for review' },
        secondary:messageControl,
      };
    }
    if (isChurch) return { primary:messageControl, secondary:null };
  }
  return { primary:messageControl, secondary:null };
}

function getCanonicalLifecycleSuccessMessage(action) {
  if (action === 'start') return 'Project moved into progress.';
  if (action === 'request_completion') return 'The church has been notified that the work is ready for review.';
  if (action === 'cancel_completion_request') return 'Review request withdrawn.';
  if (action === 'request_changes') return 'Changes requested. The vendor has been notified.';
  if (action === 'confirm_completion') return 'Project completion confirmed.';
  return 'Project updated.';
}

function getCanonicalAcceptedDealBid(dealMeta = {}) {
  const project = dealMeta?.project || null;
  const hiredVendorId = project?.hired_vendor_id || null;
  const allBids = Array.isArray(dealMeta?.allBids) ? dealMeta.allBids : [];
  const exact = allBids.find(b =>
    String(b?.status || '').toLowerCase() === 'hired' &&
    hiredVendorId && String(b?.vendor_id || '') === String(hiredVendorId)
  );
  if (exact) return exact;
  const linked = dealMeta?.linkedBid || null;
  if (linked && String(linked?.status || '').toLowerCase() === 'hired' && (!hiredVendorId || String(linked?.vendor_id || '') === String(hiredVendorId))) return linked;
  return null;
}


function MessagesThreadView({
  active,
  activeId,
  convos,
  messages,
  pendingMessages,
  loadingMsgs,
  loadingOlderMessages,
  hasMoreMessages,
  dealMeta,
  activeDealState,
  activeSummary,
  activeActionSet,
  primaryDealAction,
  isCanonicalDealRoom,
  canonicalDealRoomStatus,
  canonicalDealRoomNext,
  canonicalDealRoomControls,
  canonicalAcceptedBid,
  dealPanelTab,
  headerMenuOpen,
  headerMenuMode,
  composerAssistOpen,
  peerTyping,
  newMessageNotice,
  uploading,
  sending,
  callDetailsBusy,
  search,
  role,
  currentUser,
  isMobileInbox,
  showCenterPane,
  composerRef,
  streamRef,
  fileInputRef,
  headerMenuRef,
  moneyLabel,
  mutedSet,
  getSnoozedUntil,
  dealOverviewCards,
  executionActionCards,
  workspaceSummary,
  mobileThreadGlancePills,
  failedPending,
  composerSendLabel,
  draft,
  isConversationNearBottom,
  onLoadOlderMessages,
  onSetHeaderMenuOpen,
  onSetHeaderMenuMode,
  onSetDealPanelTab,
  onSetNewMessageNotice,
  onSetArchiveConfirm,
  onSetComposerAssistOpen,
  onSetActiveId,
  onSetToast,
  onSetThreadSnooze,
  onClearThreadSnooze,
  onToggleMuteThread,
  onRestoreConvo,
  onCreateSyncedThreadFromActive,
  onRetryFailedItems,
  onDismissFailedItems,
  onOpenChatAttachment,
  onOpenDealWorkspace,
  onScrollToLatest,
  onPopulateDealPrompt,
  onAttachClick,
  onDraftChange,
  onSendDraft,
  onFileInputChange,
  onComposerKeyDown,
  onBroadcastTyping,
  onShareCallDetails,
  onApproveCurrentMilestone,
  onCanonicalLifecycleAction,
  onExitDealRoom,
  dealRoomSwitcherItems,
  onSwitchDealRoom,
  nav,
}) {
  const [canonicalActionPanel, setCanonicalActionPanel] = useState(null);
  const [canonicalChangesNote, setCanonicalChangesNote] = useState('');
  const [canonicalPendingAction, setCanonicalPendingAction] = useState('');
  const [canonicalActionError, setCanonicalActionError] = useState('');
  const [canonicalProjectSwitcherOpen, setCanonicalProjectSwitcherOpen] = useState(false);
  const [callDraftSeed, setCallDraftSeed] = useState(null);
  const canonicalProjectSwitcherRef = useRef(null);
  const KB_DEAL_ROOM_MESSAGES_COLLAPSE_SESSION_KEY = 'kb_deal_room_messages_collapsed_v1';
  const [canonicalMessagesCollapsed, setCanonicalMessagesCollapsed] = useState(
    () => kbSafeSessionGet(KB_DEAL_ROOM_MESSAGES_COLLAPSE_SESSION_KEY) === '1'
  );

  const setCanonicalMessagesCollapsePreference = (collapsed, { focusComposer = false } = {}) => {
    const next = !!collapsed;
    setCanonicalMessagesCollapsed(next);
    kbSafeSessionSet(KB_DEAL_ROOM_MESSAGES_COLLAPSE_SESSION_KEY, next ? '1' : '0');
    if (!next && focusComposer) {
      try { requestAnimationFrame(()=>composerRef.current?.focus?.()); } catch {}
    }
  };

  useEffect(() => {
    setCanonicalActionPanel(null);
    setCanonicalChangesNote('');
    setCanonicalPendingAction('');
    setCanonicalActionError('');
    setCanonicalProjectSwitcherOpen(false);
    setCallDraftSeed(null);
  }, [activeId, isCanonicalDealRoom]);

  useEffect(() => {
    if (!canonicalProjectSwitcherOpen) return;
    const onPointerDown = (event) => {
      if (canonicalProjectSwitcherRef.current && !canonicalProjectSwitcherRef.current.contains(event.target)) {
        setCanonicalProjectSwitcherOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setCanonicalProjectSwitcherOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [canonicalProjectSwitcherOpen]);

  const runCanonicalLifecycleControl = async (action, note = null) => {
    if (!action || typeof onCanonicalLifecycleAction !== 'function' || canonicalPendingAction) return;
    setCanonicalActionError('');
    setCanonicalPendingAction(action);
    try {
      await onCanonicalLifecycleAction(action, note);
      setCanonicalActionPanel(null);
      setCanonicalChangesNote('');
      onSetToast(getCanonicalLifecycleSuccessMessage(action));
    } catch (error) {
      const message = String(error?.message || error?.details || 'FaithBid could not update the project right now.').trim();
      setCanonicalActionError(message || 'FaithBid could not update the project right now.');
    } finally {
      setCanonicalPendingAction('');
    }
  };

  const handleCanonicalControl = (control) => {
    if (!control || canonicalPendingAction) return;
    setCanonicalActionError('');
    if (control.kind === 'message') {
      openCanonicalConversation();
      return;
    }
    if (control.kind === 'panel') {
      setCanonicalActionPanel(control.action);
      return;
    }
    if (control.kind === 'transition') runCanonicalLifecycleControl(control.action);
  };

  const canonicalDesktopSplit = !!active && isCanonicalDealRoom && !isMobileInbox;
  const canonicalMessagesBadgeCount = Math.max(
    Number(active?.unread || 0) || 0,
    newMessageNotice ? 1 : 0
  );
  const threadIsMessageMode = !!active && (isCanonicalDealRoom ? (!canonicalDesktopSplit && dealPanelTab === 'messages') : dealPanelTab === 'overview');
  const openCanonicalConversation = () => {
    if(canonicalDesktopSplit){
      if (canonicalMessagesCollapsed) {
        setCanonicalMessagesCollapsePreference(false, { focusComposer:true });
      } else {
        try { requestAnimationFrame(()=>composerRef.current?.focus?.()); } catch {}
      }
      return;
    }
    onSetDealPanelTab('messages');
  };
  return (
          <section key={activeId ? `thread-${activeId}` : 'thread-empty'} className={`kbdr2-work${threadIsMessageMode ? ' kbdr2-work-message-mode' : ''}${isCanonicalDealRoom ? ' kbdr2-canonical-dealroom' : ''}${canonicalDesktopSplit ? ' kbdr2-canonical-split' : ''}${canonicalDesktopSplit && canonicalMessagesCollapsed ? ' kbdr2-messages-collapsed' : ''}`} aria-label={isCanonicalDealRoom ? "Deal Room workspace" : "Message workspace"} style={{display: showCenterPane ? undefined : "none"}}>
            {!active ? (
              <div className="kbdr2-work-empty">
                <div className="kbdr2-work-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="kbdr2-work-empty-title">
                  {convos.length === 0 ? 'Your inbox is ready' : 'Select a conversation'}
                </div>
                <div className="kbdr2-work-empty-sub">
                  {convos.length === 0
                    ? role === 'vendor'
                      ? 'Every church conversation, proposal, file, and milestone will live here after you submit a bid.'
                      : 'Every proposal conversation, file, and milestone will live here after you post a project.'
                    : 'Pick a conversation from the left to view messages, proposal details, files, milestones, and the next action in one command center.'}
                </div>
                {convos.length === 0 && (
                  <div style={{marginTop:14,display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
                    <button type="button" className="kbdr2-primary-btn" onClick={()=>nav(role === 'vendor' ? 'projects' : 'projects:post')}>
                      {role === 'vendor' ? 'Find open projects' : 'Post your project'}
                    </button>
                    <button type="button" className="kbdr2-secondary-btn" onClick={()=>nav(role === 'vendor' ? 'profile' : 'profile')}>
                      Complete your profile
                    </button>
                  </div>
                )}
              </div>
            ) : (() => {
              const workInitials = getInitialsSafe(active.name || BRAND.initials, BRAND.initials).slice(0,2).toUpperCase();
              const workColorIdx = (active.id ? String(active.id).charCodeAt(0) : 0) % 6;
              const stateKey = activeDealState || 'inquiry';
              const activeIsSynthetic = !!active?.isSynthetic;
              const activeReadOnly = activeIsSynthetic || !!active?.archived;
              const showingMessages = isCanonicalDealRoom ? (canonicalDesktopSplit || dealPanelTab === 'messages') : dealPanelTab === 'overview';
              const acceptedAgreement = canonicalAcceptedBid || null;
              const acceptedAgreementBody = String(acceptedAgreement?.cover_letter || dealMeta?.project?.scope || dealMeta?.project?.description || '').trim();
              const acceptedTimeline = String(acceptedAgreement?.timeline || dealMeta?.project?.timeline || '').trim();
              const acceptedMilestones = Array.isArray(acceptedAgreement?.milestones) ? acceptedAgreement.milestones : [];
              const hiredAtLabel = dealMeta?.project?.hired_at ? new Date(dealMeta.project.hired_at).toLocaleDateString([], { month:'short', day:'numeric', year:'numeric' }) : null;

              // Informative status line - what's blocking?
              const statusInfo = (() => {
                if(active.archived) return { dot:'#8a9585', label:'Archived' };
                if(isCanonicalDealRoom) {
                  if(canonicalDealRoomStatus?.key === 'completed') return { dot:'#5f775d', label:'Completed' };
                  if(canonicalDealRoomStatus?.key === 'ready_for_review') return { dot:'#b18435', label:'Ready for review' };
                  if(canonicalDealRoomStatus?.key === 'in_progress') return { dot:'#355846', label:'In progress' };
                  if(canonicalDealRoomStatus?.key === 'hired') return { dot:'#9b7432', label:'Hired' };
                  return { dot:'#7d8a77', label:canonicalDealRoomStatus?.label || 'Project' };
                }
                if(stateKey === 'disputed') return { dot:'#c95454', label:`Dispute open${dealMeta?.openDisputes > 1 ? ` · ${dealMeta.openDisputes} items` : ''}` };
                if(stateKey === 'completed' || stateKey === 'resolved') return { dot:'#8a9585', label:'Completed' };
                if(stateKey === 'milestone_pending') {
                  const m = dealMeta?.nextMilestone;
                  return { dot:'#e3a857', label: m?.title ? `Milestone pending · ${m.title}` : 'Milestone pending approval' };
                }
                if(stateKey === 'active') {
                  const m = dealMeta?.nextMilestone;
                  const ms = dealMeta?.milestones || [];
                  const idx = ms.findIndex(x => !x.done);
                  return { dot:'#4ade80', label: m?.title ? `Active · ${m.title}${ms.length ? ` (${idx+1} of ${ms.length})` : ''}` : 'Active · work in progress' };
                }
                if(stateKey === 'hired') return { dot:'#4ade80', label:'Hired · kickoff' };
                if(stateKey === 'bid_placed' || stateKey === 'bid_under_review') {
                  const waiting = active.type === 'church' ? 'your review' : `${active.name || 'the church'}`;
                  return { dot:'#4a6b4a', label: `Proposal sent · waiting on ${waiting}` };
                }
                return { dot:'#7d8a77', label:'New inquiry' };
              })();

              // Primary action - stage-aware, uses activeActionSet
              const primaryAction = (() => {
                if(active.archived) return null;
                if(activeActionSet?.primary?.template) {
                  return {
                    label: activeActionSet.primary.label || 'Respond',
                    onClick: () => { onSetDealPanelTab('overview'); onPopulateDealPrompt(activeActionSet.primary.template); }
                  };
                }
                return null;
              })();

              // Next-action strip (above thread in Messages tab)
              const nextStrip = (() => {
                if(active.archived || stateKey === 'completed' || stateKey === 'resolved') return null;
                if(stateKey === 'disputed') {
                  return { tone:'urgent', eyebrow:'Needs attention', text:`Dispute open on this deal. Review and respond to unblock.`, cta:'Review', onClick:()=>nav('projects') };
                }
                if(stateKey === 'milestone_pending' && dealMeta?.nextMilestone) {
                  const m = dealMeta.nextMilestone;
                  return {
                    tone:'urgent',
                    eyebrow: active.type === 'church' ? 'Approval requested' : 'Awaiting approval',
                    text: `${m.title}${m.amount ? ` · ${moneyLabel(m.amount)}` : ''}`,
                    cta: active.type === 'church' ? 'Review milestone' : 'View milestone',
                    onClick: () => onSetDealPanelTab('milestones')
                  };
                }
                if(activeSummary?.body) {
                  return { tone:'calm', eyebrow: activeSummary.eyebrow || 'Next up', text: activeSummary.body, cta:null };
                }
                return null;
              })();

              // Merge messages
              const allMsgs = [...messages, ...pendingMessages].sort((a,b)=> new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
              const seenMessageFingerprints = new Set();
              const displayMsgs = allMsgs.filter((m)=>{
                if(!m || m.type === 'file' || m.type === 'system' || m.pending || m.failed) return true;
                const text = String(m.text || '').replace(/\s+/g,' ').trim().toLowerCase();
                if(!text) return true;
                const fingerprint = `${m.from || 'unknown'}::${text}`;
                if(seenMessageFingerprints.has(fingerprint)) return false;
                seenMessageFingerprints.add(fingerprint);
                return true;
              });
              const supersededCallIds = new Set(
                displayMsgs.filter(m=>m?.type === 'call_details' && m?.callData?.supersedesMessageId)
                  .map(m=>String(m.callData.supersedesMessageId))
              );
              const currentCallMessage = [...displayMsgs].reverse().find(m =>
                m?.type === 'call_details' &&
                m?.callData?.status !== 'cancelled' &&
                !supersededCallIds.has(String(m?.id || ''))
              ) || null;

              // File count for tab badge
              const fileMessages = displayMsgs.filter(m => m.type === 'file');

              // Milestones
              const msList = Array.isArray(dealMeta?.milestones) ? dealMeta.milestones : [];

              return (
                <>
                  {/* HEADER */}
                  <div className="kbdr2-work-head">
                    <button
                      type="button"
                      className="kbdr2-work-back"
                      aria-label="Back to deals"
                      onClick={()=>{ onSetHeaderMenuOpen(false); onSetComposerAssistOpen(false); if(isCanonicalDealRoom && typeof onExitDealRoom === 'function') onExitDealRoom(); else onSetActiveId(null); }}
                      style={{display:isCanonicalDealRoom?'inline-flex':'none',width:36,height:36,borderRadius:10,background:'#f3f6ef',color:'#1F3A2E',alignItems:'center',justifyContent:'center',flexShrink:0,marginRight:4}}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <div className={`kbdr2-work-avatar kbdr2-avatar-c${workColorIdx}`}>{workInitials}</div>
                    <div className="kbdr2-work-info">
                      <div className="kbdr2-work-eyebrow">{isCanonicalDealRoom ? 'Deal room' : 'Private command center'}</div>
                      <div className="kbdr2-work-title-shell" ref={canonicalProjectSwitcherRef}>
                        {canonicalDesktopSplit && Array.isArray(dealRoomSwitcherItems) && dealRoomSwitcherItems.length > 1 ? (
                          <>
                            <button
                              type="button"
                              className="kbdr2-work-title kbdr2-project-switcher-trigger"
                              aria-haspopup="menu"
                              aria-expanded={canonicalProjectSwitcherOpen}
                              onClick={()=>setCanonicalProjectSwitcherOpen(v=>!v)}
                              title="Switch Deal Room"
                            >
                              <span className="kbdr2-project-switcher-trigger-title">{active.projectTitle || active.name || 'Deal'}</span>
                              <span className="kbdr2-project-switcher-trigger-caret" aria-hidden="true">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6 9 12 15 18 9"/>
                                </svg>
                              </span>
                            </button>
                            {canonicalProjectSwitcherOpen && (
                              <div className="kbdr2-project-switcher-menu" role="menu" aria-label="Switch Deal Room">
                                <div className="kbdr2-project-switcher-head">
                                  <span>YOUR DEAL ROOMS</span>
                                  <small>{dealRoomSwitcherItems.length}</small>
                                </div>
                                {['active','completed'].map(sectionKey => {
                                  const sectionItems = dealRoomSwitcherItems.filter(item =>
                                    sectionKey === 'completed'
                                      ? String(item?.project?.status || '').toLowerCase() === 'completed'
                                      : String(item?.project?.status || '').toLowerCase() !== 'completed'
                                  );
                                  if (!sectionItems.length) return null;
                                  return (
                                    <div key={sectionKey} className="kbdr2-project-switcher-section">
                                      <div className="kbdr2-project-switcher-section-label">{sectionKey === 'completed' ? 'Completed' : 'Active'}</div>
                                      {sectionItems.map(item => {
                                        const convoId = item?.convo?.id;
                                        const isCurrent = String(convoId || '') === String(activeId || '');
                                        return (
                                          <button
                                            type="button"
                                            role="menuitem"
                                            key={String(convoId)}
                                            className={`kbdr2-project-switcher-item${isCurrent ? ' is-current' : ''}`}
                                            onClick={async()=>{
                                              if (isCurrent) { setCanonicalProjectSwitcherOpen(false); return; }
                                              setCanonicalProjectSwitcherOpen(false);
                                              if (typeof onSwitchDealRoom === 'function') await onSwitchDealRoom(item);
                                            }}
                                          >
                                            <span className={`kbdr2-project-switcher-status is-${item?.statusMeta?.tone || 'muted'}`} aria-hidden="true"/>
                                            <span className="kbdr2-project-switcher-copy">
                                              <strong>{item?.project?.title || 'Untitled project'}</strong>
                                              <small>{item?.counterparty || 'Deal Room'} · {item?.statusMeta?.label || 'Project'}</small>
                                            </span>
                                            {Number(item?.unread || 0) > 0 && (
                                              <span className="kbdr2-project-switcher-unread">{Number(item.unread) > 9 ? '9+' : Number(item.unread)}</span>
                                            )}
                                            {isCurrent && <span className="kbdr2-project-switcher-current">Current</span>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="kbdr2-work-title">{active.projectTitle || active.name || 'Deal'}</div>
                        )}
                        {mutedSet.has(String(activeId)) && (
                          <span className="kbdr2-project-switcher-muted" title="Notifications muted" aria-label="Notifications muted">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6.6 4.4"/><path d="M18 8c0 7 3 9 3 9H7"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          </span>
                        )}
                      </div>
                      <div className="kbdr2-work-meta">
                        <span>{active.name}</span>
                        <span style={{opacity:0.4}}>•</span>
                        <span className="kbdr2-work-status">
                          <span className="kbdr2-work-status-dot" style={{background:statusInfo.dot}}/>
                          {statusInfo.label}
                        </span>
                        {dealMeta?.bidValue ? (
                          <>
                            <span style={{opacity:0.4}}>•</span>
                            <span style={{fontWeight:700,color:'#1F3A2E'}}>{moneyLabel(dealMeta.bidValue)}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="kbdr2-work-actions">
                      {active.projectId && (
                        <button type="button" className="kbdr2-secondary-btn" onClick={onOpenDealWorkspace} title="Open linked project">
                          View project
                        </button>
                      )}
                      <div ref={headerMenuRef} style={{position:'relative'}}>
                        <button type="button" className="kbdr2-icon-btn" aria-label="More options" aria-haspopup="menu" aria-expanded={headerMenuOpen} onClick={(event)=>{
                          const rect = event.currentTarget.getBoundingClientRect();
                          const menuAnchor = headerMenuRef.current;
                          if (menuAnchor && typeof window !== 'undefined') {
                            menuAnchor.style.setProperty('--kbdr2-canonical-menu-top', `${Math.round(rect.bottom + 6)}px`);
                            menuAnchor.style.setProperty('--kbdr2-canonical-menu-right', `${Math.max(12, Math.round(window.innerWidth - rect.right))}px`);
                          }
                          onSetHeaderMenuMode('main');
                          onSetHeaderMenuOpen(o=>!o);
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </button>
                        {headerMenuOpen && (() => {
                          const isMuted = mutedSet.has(String(activeId));
                          const snoozedUntilIso = getSnoozedUntil(activeId);
                          const isSnoozed = !!snoozedUntilIso && new Date(snoozedUntilIso).getTime() > Date.now();
                          const formatSnoozeUntil = (iso) => {
                            if (!iso) return '';
                            const target = new Date(iso);
                            const now = new Date();
                            const diffMs = target.getTime() - now.getTime();
                            const mins = Math.round(diffMs / 60000);
                            if (mins < 60) return `${mins}m`;
                            const hours = Math.round(mins / 60);
                            if (hours < 24) return `${hours}h`;
                            // Show day name
                            const sameWeek = (target.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000;
                            return sameWeek
                              ? target.toLocaleDateString([], { weekday:'short' })
                              : target.toLocaleDateString([], { month:'short', day:'numeric' });
                          };
                          const snoozeUntilLabel = isSnoozed ? formatSnoozeUntil(snoozedUntilIso) : '';

                          // Build snooze presets — computed at render time so they stay accurate
                          const buildSnoozePresets = () => {
                            const now = new Date();
                            const oneHour = new Date(now.getTime() + 60 * 60 * 1000);
                            const tomorrow = new Date(now);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(8, 0, 0, 0);
                            const weekend = new Date(now);
                            const dayDiff = (6 - weekend.getDay() + 7) % 7 || 7; // next Saturday
                            weekend.setDate(weekend.getDate() + dayDiff);
                            weekend.setHours(9, 0, 0, 0);
                            const nextWeek = new Date(now);
                            const mondayDiff = ((1 - nextWeek.getDay()) + 7) % 7 || 7; // next Monday
                            nextWeek.setDate(nextWeek.getDate() + mondayDiff);
                            nextWeek.setHours(9, 0, 0, 0);
                            return [
                              { label:'For 1 hour',       sub:oneHour.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}),                                 iso:oneHour.toISOString(),  toast:'Snoozed for 1 hour' },
                              { label:'Until tomorrow',   sub:tomorrow.toLocaleDateString([], {weekday:'short'}) + ', 8:00 AM',                                  iso:tomorrow.toISOString(), toast:'Snoozed until tomorrow' },
                              { label:'This weekend',     sub:weekend.toLocaleDateString([], {weekday:'short'}) + ', 9:00 AM',                                   iso:weekend.toISOString(),  toast:'Snoozed until weekend' },
                              { label:'Next week',        sub:nextWeek.toLocaleDateString([], {weekday:'short', month:'short', day:'numeric'}) + ', 9:00 AM',    iso:nextWeek.toISOString(), toast:'Snoozed until next week' },
                            ];
                          };

                          if (headerMenuMode === 'snooze') {
                            const presets = buildSnoozePresets();
                            return (
                              <div className="kbdr2-header-menu" role="menu" style={{minWidth:248}}>
                                <button type="button" className="kbdr2-header-menu-item" onClick={()=>onSetHeaderMenuMode('main')} style={{fontSize:11.5,fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',color:'#7d8a77',padding:'6px 12px 4px'}}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                  Snooze deal
                                </button>
                                <div className="kbdr2-header-menu-divider"/>
                                {presets.map(p => (
                                  <button key={p.label} type="button" role="menuitem" className="kbdr2-header-menu-item" onClick={()=>{
                                    onSetHeaderMenuOpen(false);
                                    onSetThreadSnooze(activeId, p.iso, p.toast);
                                  }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:1,flex:1}}>
                                      <span>{p.label}</span>
                                      <span style={{fontSize:11,color:'#7d8a77',fontWeight:500}}>{p.sub}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            );
                          }

                          return (
                            <div className="kbdr2-header-menu" role="menu">
                              {active.projectId && (
                                <button type="button" role="menuitem" className="kbdr2-header-menu-item" onClick={()=>{ onSetHeaderMenuOpen(false); onOpenDealWorkspace(); }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                  View on project page
                                </button>
                              )}
                              <button type="button" role="menuitem" className="kbdr2-header-menu-item" onClick={()=>{ onSetHeaderMenuOpen(false); navigator.clipboard?.writeText?.(`${active.projectTitle || 'Deal'} — ${active.name || ''}`).then(()=>onSetToast('Deal info copied'),()=>{}); }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                Copy deal name
                              </button>
                              <div className="kbdr2-header-menu-divider"/>
                              {/* SNOOZE */}
                              {isSnoozed ? (
                                <button type="button" role="menuitem" className="kbdr2-header-menu-item" onClick={()=>{ onSetHeaderMenuOpen(false); onClearThreadSnooze(activeId); }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:1,flex:1}}>
                                    <span>Cancel snooze</span>
                                    <span style={{fontSize:11,color:'#7d8a77',fontWeight:500}}>Snoozed until {snoozeUntilLabel}</span>
                                  </div>
                                </button>
                              ) : (
                                <button type="button" role="menuitem" className="kbdr2-header-menu-item" onClick={()=>onSetHeaderMenuMode('snooze')}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  <span style={{flex:1}}>Snooze deal</span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.5}}><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                              )}
                              {/* MUTE */}
                              <button type="button" role="menuitem" className="kbdr2-header-menu-item" onClick={()=>{ onSetHeaderMenuOpen(false); onToggleMuteThread(activeId); }}>
                                {isMuted ? (
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6.6 4.4"/><path d="M18 8c0 7 3 9 3 9H7"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                ) : (
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                )}
                                {isMuted ? 'Unmute notifications' : 'Mute notifications'}
                              </button>
                              <div className="kbdr2-header-menu-divider"/>
                              {active.archived ? (
                                <button type="button" role="menuitem" className="kbdr2-header-menu-item" onClick={async()=>{
                                  onSetHeaderMenuOpen(false);
                                  await onRestoreConvo(activeId);
                                  onSetToast('Deal restored');
                                }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 7 3 17 21 17 21 7"/><path d="M3 7l9-5 9 5"/><path d="M9 12l3 -3 3 3"/></svg>
                                  Restore deal
                                </button>
                              ) : (
                                <button type="button" role="menuitem" className="kbdr2-header-menu-item danger" onClick={()=>{
                                  onSetHeaderMenuOpen(false);
                                  onSetArchiveConfirm({ convoId: activeId, label: active.projectTitle || active.name || 'Deal' });
                                }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                                  Archive deal
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* ARCHIVED BANNER */}
                  {active.archived && (
                    <div style={{padding:'10px 26px',background:'rgba(20,21,24,0.04)',borderBottom:'1px solid rgba(20,21,24,0.06)',display:'flex',alignItems:'center',gap:10,fontSize:12.5,color:'#4a5547'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                      <span style={{flex:1}}><strong style={{color:'#1F3A2E'}}>Archived.</strong> This deal is read-only context. Restore from the menu to keep working on it.</span>
                      <button type="button" onClick={async()=>{ await onRestoreConvo(activeId); onSetToast('Deal restored'); }} style={{fontSize:12,fontWeight:600,color:'#1F3A2E',padding:'4px 10px',borderRadius:6,background:'#fff',border:'1px solid rgba(31,58,46,0.12)'}}>
                        Restore
                      </button>
                    </div>
                  )}

                  {/* SNOOZED BANNER */}
                  {!active.archived && (() => {
                    const sIso = getSnoozedUntil(activeId);
                    const sActive = !!sIso && new Date(sIso).getTime() > Date.now();
                    if (!sActive) return null;
                    const target = new Date(sIso);
                    const dayLabel = target.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' });
                    const timeLabel = target.toLocaleTimeString([], { hour:'numeric', minute:'2-digit' });
                    return (
                      <div style={{padding:'10px 26px',background:'rgba(31,58,46,0.04)',borderBottom:'1px solid rgba(31,58,46,0.08)',display:'flex',alignItems:'center',gap:10,fontSize:12.5,color:'#4a5547'}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span style={{flex:1}}><strong style={{color:'#1F3A2E'}}>Snoozed.</strong> This deal will surface again {dayLabel} at {timeLabel}.</span>
                        <button type="button" onClick={()=>onClearThreadSnooze(activeId)} style={{fontSize:12,fontWeight:600,color:'#1F3A2E',padding:'4px 10px',borderRadius:6,background:'#fff',border:'1px solid rgba(31,58,46,0.12)'}}>
                          Wake now
                        </button>
                      </div>
                    );
                  })()}

                  {!isCanonicalDealRoom && (<>
                  <div className="kbdr2-deal-snapshot" aria-label="Deal snapshot">
                    <div className="kbdr2-deal-snapshot-grid">
                      {dealOverviewCards.map(card => (
                        <div key={card.key} className="kbdr2-deal-snapshot-card">
                          <span>{card.label}</span>
                          <strong>{card.value}</strong>
                          <em>{card.sub}</em>
                        </div>
                      ))}
                    </div>
                    <div className="kbdr2-deal-snapshot-actions">
                      {(executionActionCards.length ? executionActionCards : [{ key:'workspace', label:primaryDealAction?.label || 'Open workspace', body:workspaceSummary, onClick:primaryDealAction?.onClick || onOpenDealWorkspace }]).slice(0,2).map(action => (
                        <button key={action.key} type="button" className="kbdr2-deal-snapshot-action" onClick={action.onClick}>
                          <span>{action.label}</span>
                          <em>{action.body}</em>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* LIFECYCLE TRACKER — deal arc, always visible */}
                  {(() => {
                    const bid = dealMeta?.linkedBid;
                    const msDone = msList.filter(m => m.done).length;
                    const msTotal = msList.length;

                    // Determine current stage
                    // 0: Inquiry/Chat  1: Proposal  2: Accepted  3: In Progress  4: Delivered  5: Reviewed
                    let currentStage = 0;
                    if (bid) currentStage = 1;
                    if (bid?.status === 'hired') currentStage = 2;
                    if (bid?.status === 'hired' && msTotal > 0 && msDone > 0) currentStage = 3;
                    if (bid?.status === 'hired' && msTotal > 0 && msDone === msTotal) currentStage = 4;
                    if (stateKey === 'completed' || stateKey === 'resolved') currentStage = 5;
                    if (bid?.status === 'declined') currentStage = -1; // special: declined

                    const stages = [
                      { key:'inquiry',  label:'Inquiry' },
                      { key:'proposal', label:'Proposal' },
                      { key:'accepted', label:'Accepted' },
                      { key:'progress', label:'In Progress' },
                      { key:'delivered',label:'Delivered' },
                      { key:'reviewed', label:'Reviewed' },
                    ];

                    if (currentStage === -1) {
                      return (
                        <div className="kbdr2-lifecycle declined">
                          <div className="kbdr2-lifecycle-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            Proposal declined — deal closed
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="kbdr2-lifecycle">
                        {stages.map((s, i) => {
                          const isDone = i < currentStage;
                          const isCurrent = i === currentStage;
                          return (
                            <React.Fragment key={s.key}>
                              <div className={`kbdr2-lifecycle-step${isDone ? ' done' : ''}${isCurrent ? ' current' : ''}`}>
                                <div className="kbdr2-lifecycle-pip">
                                  {isDone ? (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  ) : (i + 1)}
                                </div>
                                <div className="kbdr2-lifecycle-text">{s.label}</div>
                              </div>
                              {i < stages.length - 1 && <div className={`kbdr2-lifecycle-line${isDone ? ' done' : ''}`}/>}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    );
                  })()}
                  </>)}

                  {isCanonicalDealRoom && !canonicalDesktopSplit && (
                    <div className="kbdr2-dealroom-switcher" role="tablist" aria-label="Deal Room sections">
                      {[
                        { key:'overview', label:'Overview' },
                        { key:'messages', label:'Messages', count:Number(active?.unread || 0) || 0 },
                      ].map(item => (
                        <button
                          key={item.key}
                          type="button"
                          role="tab"
                          aria-selected={dealPanelTab === item.key}
                          className={`kbdr2-dealroom-switch${dealPanelTab === item.key ? ' active' : ''}`}
                          onClick={()=>onSetDealPanelTab(item.key)}
                        >
                          <span>{item.label}</span>
                          {item.count > 0 && <span className="kbdr2-dealroom-switch-count">{item.count}</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {isCanonicalDealRoom && (canonicalDesktopSplit || dealPanelTab === 'overview') && (
                    <div className="kbdr2-canonical-overview">
                      <section className={`kbdr2-canonical-next ${canonicalDealRoomNext?.state || 'unknown'}`} aria-label="What happens next">
                        <div className="kbdr2-canonical-next-top">
                          <span className="kbdr2-canonical-kicker">{canonicalDealRoomNext?.eyebrow || 'What happens next'}</span>
                          <span className={`kbdr2-canonical-status ${canonicalDealRoomStatus?.tone || 'muted'}`}>{canonicalDealRoomStatus?.label || 'Project'}</span>
                        </div>
                        <h2>{canonicalDealRoomNext?.headline || 'Keep the project moving.'}</h2>
                        <p>{canonicalDealRoomNext?.body || 'FaithBid will surface the next marketplace-critical step from the project record.'}</p>
                        {(canonicalDealRoomControls?.primary || canonicalDealRoomControls?.secondary) && (
                          <div className="kbdr2-canonical-action-row" aria-label="Deal Room next actions">
                            {canonicalDealRoomControls?.primary && (
                              <button
                                type="button"
                                className="kbdr2-canonical-action-primary"
                                disabled={!!canonicalPendingAction}
                                onClick={()=>handleCanonicalControl(canonicalDealRoomControls.primary)}
                              >
                                {canonicalPendingAction === canonicalDealRoomControls.primary.action ? 'Updating…' : canonicalDealRoomControls.primary.label}
                              </button>
                            )}
                            {canonicalDealRoomControls?.secondary && (
                              <button
                                type="button"
                                className="kbdr2-canonical-action-secondary"
                                disabled={!!canonicalPendingAction}
                                onClick={()=>handleCanonicalControl(canonicalDealRoomControls.secondary)}
                              >
                                {canonicalPendingAction === canonicalDealRoomControls.secondary.action ? 'Updating…' : canonicalDealRoomControls.secondary.label}
                              </button>
                            )}
                          </div>
                        )}
                        {canonicalActionError && <div className="kbdr2-canonical-action-error" role="alert">{canonicalActionError}</div>}
                        {canonicalActionPanel === 'confirm_completion' && (
                          <div className="kbdr2-canonical-action-panel" aria-label="Confirm project completion">
                            <div>
                              <strong>Accept this handoff?</strong>
                              <p>This records the work as accepted and completes the project in FaithBid. A platform admin can reopen a completed project if recovery is ever needed.</p>
                            </div>
                            <div className="kbdr2-canonical-action-panel-buttons">
                              <button type="button" className="kbdr2-canonical-action-primary" disabled={!!canonicalPendingAction} onClick={()=>runCanonicalLifecycleControl('confirm_completion')}>{canonicalPendingAction === 'confirm_completion' ? 'Accepting…' : 'Accept work'}</button>
                              <button type="button" className="kbdr2-canonical-action-secondary" disabled={!!canonicalPendingAction} onClick={()=>setCanonicalActionPanel(null)}>Cancel</button>
                            </div>
                          </div>
                        )}
                        {canonicalActionPanel === 'request_changes' && (
                          <div className="kbdr2-canonical-action-panel" aria-label="Request changes before completion">
                            <div>
                              <strong>What still needs attention?</strong>
                              <p>Give the vendor enough detail to understand what needs to change before you accept the work.</p>
                            </div>
                            <textarea
                              value={canonicalChangesNote}
                              onChange={event=>setCanonicalChangesNote(event.target.value.slice(0,500))}
                              rows={3}
                              maxLength={500}
                              placeholder="Example: Please update the final homepage copy and resend the mobile version."
                              aria-label="Changes requested note"
                            />
                            <div className="kbdr2-canonical-action-panel-footer">
                              <span>{canonicalChangesNote.trim().length < 3 ? 'Add a short note to continue.' : `${canonicalChangesNote.trim().length}/500`}</span>
                              <div className="kbdr2-canonical-action-panel-buttons">
                                <button type="button" className="kbdr2-canonical-action-secondary" disabled={!!canonicalPendingAction} onClick={()=>{ setCanonicalActionPanel(null); setCanonicalChangesNote(''); }}>Cancel</button>
                                <button type="button" className="kbdr2-canonical-action-primary" disabled={!!canonicalPendingAction || canonicalChangesNote.trim().length < 3} onClick={()=>runCanonicalLifecycleControl('request_changes', canonicalChangesNote.trim())}>{canonicalPendingAction === 'request_changes' ? 'Sending…' : 'Request changes'}</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </section>

                      <section className="kbdr2-canonical-agreement" aria-label="Accepted agreement">
                        <div className="kbdr2-canonical-section-head">
                          <div>
                            <span className="kbdr2-canonical-kicker">Accepted agreement</span>
                            <h3>{acceptedAgreement ? 'The accepted proposal is locked in.' : 'Accepted terms'}</h3>
                          </div>
                          <button type="button" className="kbdr2-canonical-text-link" onClick={onOpenDealWorkspace}>View project</button>
                        </div>
                        <div className="kbdr2-canonical-agreement-strip">
                          <div><span>Amount</span><strong>{moneyLabel(acceptedAgreement?.amount || dealMeta?.bidValue || dealMeta?.project?.amount)}</strong></div>
                          <div><span>Timeline</span><strong>{acceptedTimeline || 'Not specified'}</strong></div>
                          <div><span>Milestones</span><strong>{acceptedMilestones.length ? `${acceptedMilestones.length} agreed` : 'None listed'}</strong></div>
                        </div>
                        {acceptedAgreementBody ? <p className="kbdr2-canonical-agreement-copy">{acceptedAgreementBody}</p> : null}
                        {acceptedMilestones.length > 0 && (
                          <div className="kbdr2-canonical-milestone-list" aria-label="Accepted milestones">
                            {acceptedMilestones.map((m,i)=>{
                              const pct = Number(m?.pct ?? m?.percent ?? 0) || 0;
                              const milestoneAmount = Number(m?.amount ?? ((Number(acceptedAgreement?.amount)||0) * pct / 100)) || 0;
                              return (
                                <div key={m?.id || `accepted-m-${i}`} className="kbdr2-canonical-milestone-row">
                                  <span>{m?.label || m?.title || m?.desc || `Milestone ${i+1}`}</span>
                                  <strong>{pct ? `${pct}%` : 'Agreed'}{milestoneAmount ? ` · ${moneyLabel(milestoneAmount)}` : ''}</strong>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>

                      <div className="kbdr2-canonical-support-grid">
                        <section className="kbdr2-canonical-support-card kbdr2-canonical-files-card">
                          <span className="kbdr2-canonical-kicker">Shared files</span>
                          <strong>{fileMessages.length ? `${fileMessages.length} file${fileMessages.length === 1 ? '' : 's'}` : 'No files yet'}</strong>
                          {fileMessages.length ? (
                            <div className="kbdr2-canonical-file-preview" aria-label="Recent shared files">
                              {fileMessages.slice(-2).reverse().map((file,index)=>(
                                <div key={file.id || `${file.fileName || 'file'}-${index}`} className="kbdr2-canonical-file-preview-row">
                                  <span className="kbdr2-canonical-file-icon" aria-hidden="true">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                                      <polyline points="13 2 13 9 20 9"/>
                                    </svg>
                                  </span>
                                  <span>{file.fileName || 'Shared file'}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p>Files shared in Messages will stay attached to this Deal Room record automatically.</p>
                          )}
                          <button type="button" onClick={openCanonicalConversation}>{fileMessages.length ? 'View files in Messages' : 'Open Messages'}</button>
                        </section>
                        <section className="kbdr2-canonical-support-card kbdr2-canonical-activity-card">
                          <span className="kbdr2-canonical-kicker">Activity</span>
                          <strong>Project record</strong>
                          <div className="kbdr2-canonical-activity-list">
                            {(Array.isArray(dealMeta?.activity) ? dealMeta.activity : []).length ? (dealMeta.activity || []).slice(0,5).map(item => (
                              <div key={item.id || `${item.kind}-${item.created_at}`} className="kbdr2-canonical-activity-row">
                                <span className="kbdr2-canonical-activity-dot" aria-hidden="true"/>
                                <span><b>{item.title || String(item.kind || 'Project update').replace(/_/g,' ')}</b><small>{item.created_at ? new Date(item.created_at).toLocaleDateString([], {month:'short',day:'numeric'}) : ''}</small></span>
                              </div>
                            )) : <p className="kbdr2-canonical-activity-empty">Canonical hire and lifecycle events will appear here as the project moves.</p>}
                          </div>
                        </section>
                      </div>

                      <button type="button" className="kbdr2-canonical-conversation-gateway" onClick={openCanonicalConversation}>
                        <span>
                          <small>Conversation</small>
                          <strong>{active.preview || 'Open the project conversation'}</strong>
                        </span>
                        <span className="kbdr2-canonical-conversation-arrow" aria-hidden="true">→</span>
                      </button>
                    </div>
                  )}

                  {activeIsSynthetic && (
                    <div className="kbdr2-next-strip calm" style={{margin:'0 16px 12px'}}>
                      <div className="kbdr2-next-strip-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                      </div>
                      <div className="kbdr2-next-strip-body">
                        <div className="kbdr2-next-strip-eyebrow">Pending conversation</div>
                        <div className="kbdr2-next-strip-text">The project context is linked, but the conversation has not synced yet. Create the thread if both sides are attached, or open the project to connect the missing side.</div>
                      </div>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
                        <button type="button" className="kbdr2-next-strip-action" onClick={onCreateSyncedThreadFromActive}>
                          Create thread
                        </button>
                        <button type="button" className="kbdr2-secondary-btn" style={{height:34,padding:'0 12px'}} onClick={onOpenDealWorkspace}>
                          Open project
                        </button>
                      </div>
                    </div>
                  )}

                  {isMobileInbox && mobileThreadGlancePills.length > 0 && (
                    <div className="kbdr2-mobile-glance" aria-label="Thread summary">
                      {mobileThreadGlancePills.map((pill, i) => (
                        <span key={String(pill) + '-' + i} className="kbdr2-mobile-glance-pill">{pill}</span>
                      ))}
                    </div>
                  )}

                  {/* Inbox tab rail removed: keep the conversation focused on the message thread. */}

                  {/* MESSAGE THREAD — remains the same conversation before and after hire. */}
                  {showingMessages && (
                    <div className={canonicalDesktopSplit ? `kbdr2-canonical-message-rail${canonicalMessagesCollapsed ? ' is-collapsed' : ''}` : 'kbdr2-message-surface'}>
                      {canonicalDesktopSplit && (
                        <div className="kbdr2-message-dock" aria-hidden={!canonicalMessagesCollapsed}>
                          <button
                            type="button"
                            className="kbdr2-message-dock-button"
                            aria-label="Expand messages"
                            title="Expand messages"
                            tabIndex={canonicalMessagesCollapsed ? 0 : -1}
                            onClick={()=>setCanonicalMessagesCollapsePreference(false)}
                          >
                            <span className="kbdr2-message-dock-icon" aria-hidden="true">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                              </svg>
                              {canonicalMessagesBadgeCount > 0 && (
                                <span className="kbdr2-message-dock-badge">
                                  {canonicalMessagesBadgeCount > 9 ? '9+' : canonicalMessagesBadgeCount}
                                </span>
                              )}
                            </span>
                            <span className="kbdr2-message-dock-chevron" aria-hidden="true">
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"/>
                              </svg>
                            </span>
                          </button>
                        </div>
                      )}
                      <div className="kbdr2-thread-command-header" aria-label="Message center header">
                        {canonicalDesktopSplit && (
                          <div className={`kbdr2-thread-participant-avatar kbdr2-avatar-c${workColorIdx}`} aria-hidden="true">{workInitials}</div>
                        )}
                        <div className="kbdr2-thread-command-main">
                          <div className="kbdr2-thread-command-kicker">{canonicalDesktopSplit ? 'Message center' : 'Deal conversation'}</div>
                          <div className="kbdr2-thread-command-title">{canonicalDesktopSplit ? (active.name || 'Project participant') : (active.projectTitle || active.name || 'Deal conversation')}</div>
                          {canonicalDesktopSplit && <small className="kbdr2-thread-command-context">{active.projectTitle || 'Deal Room'} · {statusInfo.label}</small>}
                        </div>
                        {canonicalDesktopSplit && (
                          <div className="kbdr2-thread-command-actions">
                            {currentCallMessage && (
                              <span className="kbdr2-thread-call-status" title="Current call details are available in this conversation">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
                                Call shared
                              </span>
                            )}
                            <button
                              type="button"
                              className="kbdr2-message-collapse-btn"
                              aria-label="Collapse message center"
                              title="Collapse message center"
                              onClick={()=>setCanonicalMessagesCollapsePreference(true)}
                            >
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {failedPending.length > 0 && (
                        <div className="kbdr2-failed-banner" role="status" aria-live="polite">
                          <div className="kbdr2-failed-banner-icon">!</div>
                          <div className="kbdr2-failed-banner-copy">
                            <strong>{failedPending.length} item{failedPending.length === 1 ? '' : 's'} failed to send.</strong>
                            <span>Retry them now or dismiss the local failed copies before continuing the thread.</span>
                          </div>
                          <div className="kbdr2-failed-banner-actions">
                            <button type="button" className="kbdr2-failed-retry" onClick={onRetryFailedItems}>Retry</button>
                            <button type="button" className="kbdr2-failed-dismiss" onClick={onDismissFailedItems}>Dismiss</button>
                          </div>
                        </div>
                      )}

                      <div className="kbdr2-stream" ref={streamRef} onScroll={()=>{ if(isConversationNearBottom(90)) onSetNewMessageNotice(false); }}>
                        {hasMoreMessages && allMsgs.length > 0 && (
                          <div className="kbdr2-load-older-wrap">
                            <button
                              type="button"
                              className="kbdr2-load-older-btn"
                              onClick={onLoadOlderMessages}
                              disabled={loadingOlderMessages}
                            >
                              {loadingOlderMessages ? (canonicalDesktopSplit ? 'Loading earlier messages…' : 'Loading older messages…') : (canonicalDesktopSplit ? '↑ Earlier messages' : 'Load older messages')}
                            </button>
                          </div>
                        )}
                        {loadingMsgs && allMsgs.length === 0 && (
                          <div className="kbdr2-thread-loading" role="status" aria-live="polite">
                            <div className="kbdr2-thread-loading-card">
                              <span className="kbdr2-thread-loading-kicker">Loading conversation</span>
                              <span className="kbdr2-thread-loading-line wide"/>
                              <span className="kbdr2-thread-loading-line mid"/>
                            </div>
                            <div className="kbdr2-thread-loading-card align-right">
                              <span className="kbdr2-thread-loading-line short"/>
                              <span className="kbdr2-thread-loading-line mid"/>
                            </div>
                          </div>
                        )}
                        {!loadingMsgs && allMsgs.length === 0 && (
                          <div className="kbdr2-thread-empty">
                            <div className="kbdr2-thread-empty-icon">
                              <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </div>
                            <div className="kbdr2-thread-empty-title">Start this project conversation.</div>
                            <div className="kbdr2-thread-empty-sub">Keep the first message specific: scope, timing, budget, files, or the next decision needed.</div>
                            {activeActionSet?.secondary?.template && (
                              <button type="button" className="kbdr2-secondary-btn" onClick={()=>onPopulateDealPrompt(activeActionSet.secondary.template)}>
                                Use suggested reply
                              </button>
                            )}
                          </div>
                        )}
                        {displayMsgs.length > 0 && !canonicalDesktopSplit && <div className="kbdr2-day-label">Conversation</div>}
                        {displayMsgs.map((m, idx) => {
                          const isMe = m.from === 'me';
                          const isSystem = m.type === 'system';
                          const prev = displayMsgs[idx-1];
                          const groupedWithPrev = !!prev && prev.from === m.from && prev.type !== 'system' && m.type !== 'system';
                          const showAvatar = !isMe && !isSystem && !groupedWithPrev;
                          const mInitials = isMe ? 'ME' : (getInitialsSafe(active.name || BRAND.initials, BRAND.initials).slice(0,2).toUpperCase());
                          const mColorIdx = isMe ? 0 : ((active.id ? String(active.id).charCodeAt(0) : 0) % 6);
                          if(m.type === 'call_details'){
                            return (
                              <div key={m.id || idx} className="kbdr2-call-event-row" data-msgid={m.id || ''}>
                                <DealRoomCallMessageCard
                                  message={m}
                                  superseded={supersededCallIds.has(String(m.id || ''))}
                                  canManage={isCanonicalDealRoom && !activeReadOnly}
                                  busy={callDetailsBusy}
                                  onUpdate={setCallDraftSeed}
                                  onCancel={(message)=>onShareCallDetails({ ...message.callData, status:'cancelled', supersedesMessageId:message.id })}
                                />
                              </div>
                            );
                          }


                          if(isSystem){
                            return (
                              <div key={m.id || idx} className="kbdr2-msg-row" style={{justifyContent:'center'}}>
                                <div className="kbdr2-bubble system">{m.text || 'Thread update'}</div>
                              </div>
                            );
                          }

                          return (
                            <div key={m.id || idx} data-msgid={m.id || ''} className={`kbdr2-msg-row ${isMe ? 'me' : 'them'}${groupedWithPrev ? ' grouped' : ''}`}>
                              {!isMe && (
                                <div className={`kbdr2-msg-avatar kbdr2-avatar-c${mColorIdx}${showAvatar ? '' : ' invisible'}`}>{mInitials}</div>
                              )}
                              <div className={`kbdr2-bubble ${isMe ? 'me' : 'them'}`}>
                                {m.type === 'file' ? (
                                  <div className="kbdr2-file-card">
                                    <div className="kbdr2-file-icon">{((m.fileName || 'FILE').split('.').pop() || 'FILE').toUpperCase().slice(0,3)}</div>
                                    <div className="kbdr2-file-meta">
                                      <div className="kbdr2-file-name">{m.fileName || 'Attachment'}</div>
                                      <div className="kbdr2-file-size">{m.fileSize || ''}</div>
                                    </div>
                                    {(m.fileUrl || m.filePath) && (
                                      <button type="button" className="kbdr2-file-action" aria-label="Open attachment" onClick={()=>onOpenChatAttachment(m)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{whiteSpace:'pre-wrap'}}>{m.text}</div>
                                )}
                                <div className="kbdr2-bubble-time">
                                  <span>{m.pending ? 'Sending…' : (m.time || '')}</span>
                                  {isMe && !m.pending && <span className="kbdr2-bubble-checks">✓✓</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {peerTyping && (
                          <div className="kbdr2-msg-row them" aria-live="polite">
                            <div className={`kbdr2-msg-avatar kbdr2-avatar-c${workColorIdx}`}>{workInitials}</div>
                            <div className="kbdr2-bubble them kbdr2-typing-bubble" aria-label={`${active.name || 'They'} is typing`}>
                              <span className="kbdr2-typing-dot"/>
                              <span className="kbdr2-typing-dot"/>
                              <span className="kbdr2-typing-dot"/>
                            </div>
                          </div>
                        )}
                        {newMessageNotice && (
                          <button type="button" className="kbdr2-new-message-pill" onClick={()=>{ onSetNewMessageNotice(false); onScrollToLatest('smooth'); }}>
                            New message ↓
                          </button>
                        )}
                      </div>

                      <MemoMessagesComposer
                        active={active}
                        activeId={activeId}
                        activeReadOnly={activeReadOnly}
                        composerSendLabel={composerSendLabel}
                        uploading={uploading}
                        sending={sending}
                        callDetailsBusy={callDetailsBusy}
                        canShareCallDetails={isCanonicalDealRoom}
                        callDraftSeed={callDraftSeed}
                        onClearCallDraftSeed={()=>setCallDraftSeed(null)}
                        onShareCallDetails={onShareCallDetails}
                        draft={draft}
                        composerAssistOpen={composerAssistOpen}
                        fileInputRef={fileInputRef}
                        composerRef={composerRef}
                        onDraftChange={onDraftChange}
                        onSendDraft={onSendDraft}
                        onAttachClick={onAttachClick}
                        onFileInputChange={onFileInputChange}
                        onComposerKeyDown={onComposerKeyDown}
                        onBroadcastTyping={onBroadcastTyping}
                        onSetComposerAssistOpen={onSetComposerAssistOpen}
                      />
                    </div>
                  )}

                  {!isCanonicalDealRoom && <MemoMessagesDealPanel
                    key={activeId}
                    active={active}
                    activeId={activeId}
                    dealPanelTab={dealPanelTab}
                    dealMeta={dealMeta}
                    messages={messages}
                    pendingMessages={pendingMessages}
                    fileMessages={fileMessages}
                    uploading={uploading}
                    role={role}
                    currentUser={currentUser}
                    activeDealState={activeDealState}
                    search={search}
                    composerRef={composerRef}
                    streamRef={streamRef}
                    moneyLabel={moneyLabel}
                    onSetDealPanelTab={onSetDealPanelTab}
                    onPopulateDealPrompt={onPopulateDealPrompt}
                    onAttachClick={onAttachClick}
                    onOpenChatAttachment={onOpenChatAttachment}
                    onApproveCurrentMilestone={onApproveCurrentMilestone}
                    onOpenDealWorkspace={onOpenDealWorkspace}
                    nav={nav}
                  />}
                </>
              );
            })()}
          </section>
  );
}
const MemoMessagesThreadView = React.memo(MessagesThreadView);

function MessagesThreadList({
  convos,
  activeId,
  loadingConvos,
  search,
  searchResults,
  listFilter,
  vendorInviteTotalCount,
  role,
  currentUser,
  orderedFiltered,
  isMobileInbox,
  showThreadListPane,
  starredSet,
  mutedSet,
  resolvedMap,
  pinnedRecordMap,
  lastViewedMap,
  rowActionBusyId,
  loadingMoreConvos,
  hasMoreConvos,
  onSelectConvo,
  onSetListFilter,
  onDeleteConvo,
  onRestoreConvo,
  onLoadMoreConvos,
  onSetRowActionBusyId,
  nav,
  vendorInviteRows,
  loadingVendorInvites,
  vendorInvitesError,
  vendorInvitesTruncated,
  openVendorInviteProject,
  mobileQuickViewItems,
  threadPriorityById,
  getThreadPriorityMeta,
  isSnoozedThread,
  onClearSearch,
  onRequestArchiveConfirm,
}) {
  return (
    <section className="kbdr2-deals" aria-label="Inbox conversations" style={{display: showThreadListPane ? undefined : "none"}}>
      <div className="kbdr2-deals-head">
        <h1 className="kbdr2-deals-title">Inbox</h1>
        <button type="button" className="kbdr2-new-btn" onClick={()=>nav(role === 'vendor' ? 'projects' : 'projects:post')} title={role === 'vendor' ? "Browse marketplace" : "Post a new project"}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {role === 'vendor' ? 'Browse Work' : 'Post Project'}
        </button>
      </div>

      {isMobileInbox && (
        <div className="kbdr2-mobile-quickviews" aria-label="Mobile inbox filters">
          {mobileQuickViewItems.map(item => (
            <button
              key={item.key}
              type="button"
              className={'kbdr2-mobile-quickview' + (listFilter === item.key ? ' active' : '')}
              aria-pressed={listFilter === item.key}
              onClick={()=>onSetListFilter(item.key)}
            >
              <span>{item.label}</span>
              {item.count > 0 && <span className="kbdr2-mobile-quickview-count">{item.count}</span>}
            </button>
          ))}
        </div>
      )}

      {(() => {
        // Compute filtered lists by tab for counts + rendering
        const sourceList = (search && search.trim().length >= 2) ? (searchResults || []) : (orderedFiltered || []);
        const listAll = sourceList.filter(c => !c.archived);
        const listActive = sourceList.filter(c => !c.archived && ['active','hired','milestone_pending','bid_under_review','bid_placed'].includes(c.dealState));
        const listArchived = sourceList.filter(c => c.archived);
        const listAttention = sourceList.filter(c => {
          if(c.archived) return false;
          const state = c.dealState || 'inquiry';
          const unread = Number(c.unread || 0) > 0;
          return state === 'disputed' || state === 'milestone_pending' || (unread && ['active','hired','bid_under_review','bid_placed'].includes(state));
        });
        const isInviteTab = role === 'vendor' && listFilter === 'invites';
        const currentKey = isInviteTab ? 'invites' : ['archived','active','attention'].includes(listFilter) ? listFilter : 'all';
        const listByKey = { all: listAll, attention: listAttention, active: listActive, archived: listArchived };
        const finalList = listByKey[currentKey] || listAll;

        const badgeFor = (c) => {
          if(c.archived) return { cls:'archived', label:'Archived' };
          const state = c.dealState || 'inquiry';
          if(state === 'disputed') return { cls:'disputed', label:'Disputed' };
          if(['bid_placed','bid_under_review','inquiry'].includes(state)) return { cls:'proposal', label:'Proposal' };
          if(['hired','active'].includes(state)) return { cls:'active', label:'Active' };
          if(['milestone_pending'].includes(state)) return { cls:'pending', label:'Pending' };
          if(['completed','resolved'].includes(state)) return { cls:'completed', label:'Completed' };
          return { cls:'proposal', label:'Proposal' };
        };

        // Compute summary counts for the strip above the tabs.
        // 'attention' = unread or disputed or milestone-pending = needs your eyes.
        // 'awaiting'  = milestone_pending specifically (counterparty action needed).
        // 'activeNow' = currently in active/hired execution.
        const visibleConvos = (sourceList || []).filter(c => !c.archived);
        const attentionCount = visibleConvos.filter(c => {
          const state = c.dealState || 'inquiry';
          const unread = Number(c.unread || 0) > 0;
          return state === 'disputed' || state === 'milestone_pending' || (unread && ['active','hired','bid_under_review','bid_placed'].includes(state));
        }).length;
        const awaitingCount = visibleConvos.filter(c => (c.dealState || '') === 'milestone_pending').length;
        const activeNowCount = visibleConvos.filter(c => ['active','hired'].includes(c.dealState || '')).length;
        const hasAnyDeal = visibleConvos.length > 0;

        return (
          <>
            <div className="kbdr2-inbox-stats" aria-label="Deal activity summary">
              {!hasAnyDeal && (
                <span className="kbdr2-inbox-all-clear">No conversations yet — they'll appear here when work starts moving.</span>
              )}
              {hasAnyDeal && attentionCount === 0 && awaitingCount === 0 && activeNowCount === 0 && (
                <span className="kbdr2-inbox-all-clear">All caught up</span>
              )}
              {hasAnyDeal && attentionCount > 0 && (
                <button type="button" className="kbdr2-inbox-stat warn" onClick={()=>onSetListFilter('attention')}>
                  <span className="kbdr2-inbox-stat-dot"/>
                  {attentionCount} need{attentionCount === 1 ? 's' : ''} reply
                </button>
              )}
              {hasAnyDeal && awaitingCount > 0 && (
                <button type="button" className="kbdr2-inbox-stat" onClick={()=>onSetListFilter('attention')}>
                  <span className="kbdr2-inbox-stat-dot"/>
                  {awaitingCount} awaiting approval
                </button>
              )}
              {hasAnyDeal && activeNowCount > 0 && (
                <button type="button" className="kbdr2-inbox-stat" onClick={()=>onSetListFilter('active')}>
                  <span className="kbdr2-inbox-stat-dot"/>
                  {activeNowCount} active
                </button>
              )}
            </div>
            <div className="kbdr2-deals-tabs" role="tablist">
              {[
                {key:'all', label:'All', count: listAll.length},
                ...(role === 'vendor' ? [{key:'invites', label:'Invites', count: vendorInviteTotalCount}] : []),
                {key:'attention', label:'Needs reply', count: listAttention.length},
                {key:'active', label:'Active', count: listActive.length},
                {key:'archived', label:'Archived', count: listArchived.length},
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={currentKey===tab.key}
                  className={`kbdr2-deals-tab${currentKey===tab.key ? ' active':''}`}
                  onClick={()=>onSetListFilter(tab.key)}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && <span className="kbdr2-deals-tab-count">{tab.count}</span>}
                </button>
              ))}
            </div>
            <div className="kbdr2-deals-list">
              {currentKey === 'invites' ? (
                <MemoVendorInviteStation
                  vendorInviteRows={vendorInviteRows}
                  vendorInviteTotalCount={vendorInviteTotalCount}
                  loadingVendorInvites={loadingVendorInvites}
                  vendorInvitesError={vendorInvitesError}
                  vendorInvitesTruncated={vendorInvitesTruncated}
                  role={role}
                  listFilter={listFilter}
                  openVendorInviteProject={openVendorInviteProject}
                />
              ) : loadingConvos && finalList.length === 0 ? (
                <div className="kbdr2-deals-empty">
                  <div className="kbdr2-deals-empty-spinner" aria-hidden="true"/>
                  <div className="kbdr2-deals-empty-title">Loading inbox…</div>
                  <div className="kbdr2-deals-empty-sub">Pulling message threads and deal context. If the database is slow, this will fall back automatically.</div>
                </div>
              ) : finalList.length === 0 ? (
                <div className="kbdr2-deals-empty">
                  <div className="kbdr2-deals-empty-icon" aria-hidden="true">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div className="kbdr2-deals-empty-title">
                    {search ? 'No matches' : currentKey==='archived' ? 'No archived conversations' : currentKey==='active' ? 'No active work yet' : 'No conversations yet'}
                  </div>
                  <div className="kbdr2-deals-empty-sub">
                    {search
                      ? `Nothing matches "${search}". Try a different search.`
                      : currentKey==='archived' ? 'Archived conversations stay here for reference without cluttering active work.'
                      : currentKey==='active' ? 'Accepted proposals and hired work will move here automatically.'
                      : role === 'vendor' ? 'Find an open project, submit a clear proposal, and the conversation thread will live here.'
                      : 'Post your project, compare aligned proposals, and the conversation threads will live here.'}
                  </div>
                  {!search && (
                    <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:8,alignItems:'center'}}>
                      {currentKey === 'all' && (
                        <button type="button" className="kbdr2-primary-btn" onClick={()=>nav(role === 'vendor' ? 'projects' : 'projects:post')}>
                          {role === 'vendor' ? 'Find open projects' : 'Post your project'}
                        </button>
                      )}
                      {currentKey === 'active' && (
                        <button type="button" className="kbdr2-secondary-btn" onClick={()=>onSetListFilter('all')}>
                          View all conversations
                        </button>
                      )}
                      {currentKey === 'archived' && (
                        <button type="button" className="kbdr2-secondary-btn" onClick={()=>onSetListFilter('all')}>
                          Back to all conversations
                        </button>
                      )}
                    </div>
                  )}
                  {search && (
                    <div style={{marginTop:14}}>
                      <button type="button" className="kbdr2-secondary-btn" onClick={()=>onClearSearch()}>
                        Clear search
                      </button>
                    </div>
                  )}
                </div>
              ) : finalList.map((c, idx) => {
                const b = badgeFor(c);
                const initials = getInitialsSafe(c.name || 'Unknown', 'U').slice(0,2).toUpperCase();
                const colorIdx = (c.id ? String(c.id).charCodeAt(0) : idx) % 6;
                const rowMuted = mutedSet.has(String(c.id));
                const rowSnoozed = isSnoozedThread(c);
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    className={`kbdr2-deal-row${String(c.id) === String(activeId) ? ' active' : ''}${rowMuted ? ' muted' : ''}`}
                    onClick={()=>onSelectConvo(c.id)}
                    onKeyDown={(event)=>{ if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); onSelectConvo(c.id); } }}
                  >
                    <div className={`kbdr2-deal-avatar kbdr2-avatar-c${colorIdx}`}>{initials}</div>
                    <div className="kbdr2-deal-body">
                      <div className="kbdr2-deal-line1">
                        <div className="kbdr2-deal-name">
                          {c.projectTitle || c.name || 'Untitled Deal'}
                          {rowMuted && (
                            <span style={{display:'inline-flex',alignItems:'center',marginLeft:6,color:'#a8b3a3',verticalAlign:'middle'}} aria-label="Muted">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6.6 4.4"/><path d="M18 8c0 7 3 9 3 9H7"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            </span>
                          )}
                          {rowSnoozed && (
                            <span style={{display:'inline-flex',alignItems:'center',marginLeft:6,color:'#a8b3a3',verticalAlign:'middle'}} aria-label="Snoozed">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </span>
                          )}
                        </div>
                        <span className={`kbdr2-deal-badge ${b.cls}`}>{b.label}</span>
                      </div>
                      <div className="kbdr2-deal-vendor">{c.name || '—'}</div>
                      <div className="kbdr2-deal-preview">{c.preview || 'No messages yet'}</div>
                      {(() => {
                        const priority = threadPriorityById[String(c.id)] || getThreadPriorityMeta(c);
                        if(!priority?.needsReview && !priority?.hasDraft && !priority?.pinned && !priority?.quiet) return null;
                        return (
                          <div
                            className="kbdr2-priority-line"
                            style={{'--priority-color': priority.tone?.color || '#8A6729','--priority-bg': priority.tone?.bg || 'rgba(176,136,64,0.10)'}}
                          >
                            <span className="kbdr2-priority-dot"/>
                            <span><strong>{priority.label}</strong> · {priority.reason}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="kbdr2-deal-right">
                      <div className="kbdr2-deal-time">{c.time || ''}</div>
                      {(c.unread||0) > 0 && !rowMuted && <div className="kbdr2-deal-unread">{c.unread}</div>}
                      {(c.unread||0) > 0 && rowMuted && <div className="kbdr2-deal-unread muted">{c.unread}</div>}
                      <button
                        type="button"
                        className={`kbdr2-deal-row-action${c.archived ? ' restore' : ''}`}
                        aria-label={c.archived ? 'Restore conversation' : 'Remove conversation from inbox'}
                        title={c.archived ? 'Restore conversation' : 'Remove from inbox'}
                        disabled={rowActionBusyId === c.id}
                        onClick={(event)=>{
                          event.stopPropagation();
                          if(c.archived){ onRestoreConvo(c.id); return; }
                          onRequestArchiveConfirm({ convoId: c.id, label: c.projectTitle || c.name || 'Conversation' });
                        }}
                      >
                        {c.archived ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18v14H3z"/><path d="M3 7l9-4 9 4"/><path d="M9 14l3-3 3 3"/><path d="M12 11v7"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 13h4"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
    </section>
  );
}
const MemoMessagesThreadList = React.memo(MessagesThreadList);

function MessagesDealPanel({
  active,
  activeId,
  dealPanelTab,
  dealMeta,
  messages,
  pendingMessages,
  fileMessages,
  uploading,
  role,
  currentUser,
  activeDealState,
  search,
  composerRef,
  streamRef,
  moneyLabel,
  onSetDealPanelTab,
  onPopulateDealPrompt,
  onAttachClick,
  onOpenChatAttachment,
  onApproveCurrentMilestone,
  onOpenDealWorkspace,
  nav,
}) {
  const [fileSearch, setFileSearch] = useState('');
  const stateKey = activeDealState || 'inquiry';
  const msList = Array.isArray(dealMeta?.milestones) ? dealMeta.milestones : [];

  return (
    <>
      {/* PROPOSAL TAB */}
      {dealPanelTab === 'proposal' && (
        <div className="kbdr2-tab-body">
          {!dealMeta?.linkedBid ? (
            <div className="kbdr2-work-empty" style={{padding:'32px 16px'}}>
              <div className="kbdr2-work-empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="kbdr2-work-empty-title">No proposal yet</div>
              <div className="kbdr2-work-empty-sub">When a vendor submits a bid on this project, the full proposal will appear here with inline actions to accept, counter, or request revisions.</div>
              <button type="button" className="kbdr2-secondary-btn" style={{marginTop:8}} onClick={()=>{ onSetDealPanelTab('overview'); composerRef.current?.focus?.(); }}>Reply in Messages</button>
            </div>
          ) : (
            <>
              {/* PROPOSAL CARD — full details + inline actions */}
              <div className="kbdr2-section">
                <div className="kbdr2-section-head">
                  <div className="kbdr2-section-title">Proposal</div>
                  <span className="kbdr2-section-chip">{dealMeta.linkedBid.status || 'submitted'}</span>
                </div>
                <div className="kbdr2-kv-grid">
                  <div>
                    <div className="kbdr2-kv-label">Bid amount</div>
                    <div className="kbdr2-kv-value big">{moneyLabel(dealMeta.linkedBid.amount)}</div>
                  </div>
                  <div>
                    <div className="kbdr2-kv-label">Timeline</div>
                    <div className="kbdr2-kv-value">{dealMeta.linkedBid.timeline || dealMeta.project?.timeline || 'TBD'}</div>
                  </div>
                  <div>
                    <div className="kbdr2-kv-label">Vendor</div>
                    <div className="kbdr2-kv-value">{dealMeta.linkedBid.vendor_name || active.name || '—'}</div>
                  </div>
                  <div>
                    <div className="kbdr2-kv-label">Project budget</div>
                    <div className="kbdr2-kv-value">{dealMeta.budgetValue ? moneyLabel(dealMeta.budgetValue) : '—'}</div>
                  </div>
                </div>
                {dealMeta.linkedBid.message && (
                  <div className="kbdr2-prop-msg">{dealMeta.linkedBid.message}</div>
                )}

                {/* INLINE ACTIONS — role-aware, all stay in the Deal Room */}
                {role === 'church' && dealMeta.linkedBid.status !== 'hired' && dealMeta.linkedBid.status !== 'declined' && (
                  <div className="kbdr2-prop-cta" style={{flexWrap:'wrap',gap:8}}>
                    <button type="button" className="kbdr2-primary-btn" onClick={()=>{
                      const vendorName = dealMeta.linkedBid.vendor_name || active.name || 'vendor';
                      const amt = moneyLabel(dealMeta.linkedBid.amount);
                      onPopulateDealPrompt(`Hi ${vendorName} — I'm ready to move forward with your proposal at ${amt}. Before I formally accept, a few quick confirmations:\n\n1. Start date you have in mind\n2. Payment schedule (milestone breakdown)\n3. Any dependencies you need from us to kick off\n\nOnce we align on these I'll accept the bid and we can start.`);
                      onSetDealPanelTab('overview');
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Move to accept
                    </button>
                    <button type="button" className="kbdr2-secondary-btn" onClick={()=>{
                      const amt = moneyLabel(dealMeta.linkedBid.amount);
                      onPopulateDealPrompt(`Thanks for the proposal. I'd like to propose a counter — can we align on:\n\n• Revised amount: [your number]\n• Timeline: ${dealMeta.linkedBid.timeline || dealMeta.project?.timeline || 'unchanged'}\n• Scope adjustments: [any changes]\n\nYour current bid is ${amt}. Let me know what works.`);
                      onSetDealPanelTab('overview');
                    }}>
                      Counter offer
                    </button>
                    <button type="button" className="kbdr2-secondary-btn" onClick={()=>{
                      onPopulateDealPrompt(`Thanks for submitting. A few items I'd like revised before we move forward:\n\n• [specific item 1]\n• [specific item 2]\n\nOnce updated, please resubmit and I'll review.`);
                      onSetDealPanelTab('overview');
                    }}>
                      Request revisions
                    </button>
                    <button type="button" className="kbdr2-secondary-btn" style={{color:'#a02020'}} onClick={()=>{
                      onPopulateDealPrompt(`Hi ${dealMeta.linkedBid.vendor_name || active.name || 'there'} — appreciate you taking the time to bid on this. We're going to pass this round, but I'll keep your profile on hand for future projects.\n\nThanks again for the proposal.`);
                      onSetDealPanelTab('overview');
                    }}>
                      Decline
                    </button>
                  </div>
                )}

                {role === 'vendor' && (
                  <div className="kbdr2-prop-cta" style={{flexWrap:'wrap',gap:8}}>
                    <button type="button" className="kbdr2-primary-btn" onClick={()=>{
                      onPopulateDealPrompt(`Hi ${active.name || 'there'} — following up on my proposal. Happy to walk through any part of it or adjust scope, timing, or structure based on what works best for you. Let me know what questions you have.`);
                      onSetDealPanelTab('overview');
                    }}>
                      Follow up
                    </button>
                    <button type="button" className="kbdr2-secondary-btn" onClick={()=>{
                      const amt = moneyLabel(dealMeta.linkedBid.amount);
                      onPopulateDealPrompt(`I'd like to submit a revised proposal:\n\n• Updated amount: [new number — currently ${amt}]\n• Timeline: [updated]\n• Changes from original: [what's different]\n\nLet me know if this works.`);
                      onSetDealPanelTab('overview');
                    }}>
                      Submit revision
                    </button>
                  </div>
                )}

                {dealMeta.linkedBid.status === 'hired' && (
                  <div style={{marginTop:16,padding:'12px 14px',background:'rgba(47,133,90,0.08)',border:'1px solid rgba(47,133,90,0.18)',borderRadius:10,fontSize:13,color:'#1F5137',display:'flex',alignItems:'center',gap:10}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span><strong>Proposal accepted.</strong> This deal is active — track progress in the Milestones tab.</span>
                  </div>
                )}

                {dealMeta.linkedBid.status === 'declined' && (
                  <div style={{marginTop:16,padding:'12px 14px',background:'rgba(160,32,32,0.06)',border:'1px solid rgba(160,32,32,0.18)',borderRadius:10,fontSize:13,color:'#8a2020'}}>
                    <strong>Proposal declined.</strong> This bid was not selected for this project.
                  </div>
                )}
              </div>

              {/* SCOPE */}
              {dealMeta.project?.description && (
                <div className="kbdr2-section">
                  <div className="kbdr2-section-head">
                    <div className="kbdr2-section-title">Scope</div>
                  </div>
                  <div style={{fontSize:14,color:'#1F3A2E',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{dealMeta.project.description}</div>
                </div>
              )}

              {/* OTHER BIDS — church only, subtle */}
              {role === 'church' && Array.isArray(dealMeta.allBids) && dealMeta.allBids.length > 1 && (
                <div className="kbdr2-section">
                  <div className="kbdr2-section-head">
                    <div className="kbdr2-section-title">Other bids</div>
                    <span className="kbdr2-section-chip">{dealMeta.allBids.length - 1}</span>
                  </div>
                  <div style={{fontSize:13,color:'#7d8a77',lineHeight:1.5}}>
                    {dealMeta.allBids.length - 1} other vendor{dealMeta.allBids.length - 1 === 1 ? '' : 's'} submitted bids on this project.
                  </div>
                </div>
              )}

              {/* FINAL HIRE — discreet footer link, not primary */}
              {role === 'church' && active.projectId && dealMeta.linkedBid.status !== 'hired' && dealMeta.linkedBid.status !== 'declined' && (
                <div style={{padding:'14px 2px 4px',borderTop:'1px solid rgba(31,58,46,0.06)',marginTop:4}}>
                  <div style={{fontSize:12,color:'#7d8a77',lineHeight:1.5,marginBottom:6}}>
                    Ready to formally accept? The hire confirmation (including payment setup) happens on the project page.
                  </div>
                  <button type="button" onClick={()=>nav('projects')} style={{background:'none',border:'none',padding:0,color:'#1F3A2E',fontSize:12,fontWeight:600,textDecoration:'underline',cursor:'pointer'}}>
                    Finalize hire on project page →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* FILES TAB */}
      {dealPanelTab === 'files' && (
        <div className="kbdr2-tab-body">
          {/* UPLOAD + SEARCH HEADER */}
          <div className="kbdr2-section">
            <div className="kbdr2-section-head">
              <div className="kbdr2-section-title">Shared files</div>
              <span className="kbdr2-section-chip">{fileMessages.length}</span>
            </div>

            {/* Action bar */}
            <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:fileMessages.length>0?14:0,flexWrap:'wrap'}}>
              <button type="button" className="kbdr2-primary-btn" onClick={onAttachClick} disabled={uploading}>
                {uploading ? (
                  <>
                    <span className="kbdr2-deals-empty-spinner" style={{width:12,height:12,borderWidth:2,margin:0}}/>
                    Uploading…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload file
                  </>
                )}
              </button>
              {fileMessages.length > 4 && (
                <div style={{flex:1,minWidth:180,position:'relative'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#7d8a77',pointerEvents:'none'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text"
                    placeholder="Search files…"
                    value={fileSearch || ''}
                    onChange={(e)=>setFileSearch(e.target.value)}
                    style={{width:'100%',height:36,padding:'0 14px 0 34px',border:'1px solid rgba(31,58,46,0.1)',borderRadius:10,background:'#fff',fontSize:13,color:'#1F3A2E'}}
                  />
                </div>
              )}
            </div>

            {/* Empty state */}
            {fileMessages.length === 0 ? (
              <div style={{padding:'24px 4px',textAlign:'center'}}>
                <div style={{width:56,height:56,margin:'0 auto 12px',borderRadius:'50%',background:'#f3f6ef',display:'flex',alignItems:'center',justifyContent:'center',color:'#1F3A2E'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                </div>
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,fontWeight:700,color:'#1F3A2E',marginBottom:4}}>No files yet</div>
                <div style={{fontSize:13,color:'#7d8a77',lineHeight:1.5,maxWidth:320,margin:'0 auto'}}>
                  Upload contracts, mockups, invoices, and deliverables here. Everything stays linked to this deal.
                </div>
              </div>
            ) : (() => {
              // Filter by search
              const q = (fileSearch || '').trim().toLowerCase();
              const filtered = q
                ? fileMessages.filter(f => (f.fileName || '').toLowerCase().includes(q))
                : fileMessages;

              if (filtered.length === 0) {
                return (
                  <div style={{padding:'20px 4px',textAlign:'center',fontSize:13,color:'#7d8a77'}}>
                    No files match "<span style={{color:'#1F3A2E',fontWeight:600}}>{fileSearch}</span>".
                  </div>
                );
              }

              // Group by recency
              const now = Date.now();
              const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
              const thisWeek = [];
              const earlier = [];
              filtered.slice().reverse().forEach(f => {
                const t = f.createdAt ? new Date(f.createdAt).getTime() : 0;
                if (t >= weekAgo) thisWeek.push(f); else earlier.push(f);
              });

              const renderFile = (f, idx) => {
                const ext = ((f.fileName || '').split('.').pop() || '').toLowerCase();
                const isImage = ['jpg','jpeg','png','gif','webp','svg','heic'].includes(ext);
                const isPdf = ext === 'pdf';
                const isDoc = ['doc','docx','txt','rtf','md'].includes(ext);
                const isSheet = ['xls','xlsx','csv','numbers'].includes(ext);
                const isVideo = ['mp4','mov','avi','webm','mkv'].includes(ext);
                const iconColor = isPdf ? '#c94a4a' : isImage ? '#4a8a5c' : isDoc ? '#4a6a94' : isSheet ? '#2d7a4e' : isVideo ? '#8a4ac9' : '#7d8a77';
                const iconBg = isPdf ? '#fdf2f2' : isImage ? '#f0f8f2' : isDoc ? '#f0f4f9' : isSheet ? '#f0f7f3' : isVideo ? '#f6f0fa' : '#f3f5f1';
                const extLabel = (ext || 'FILE').toUpperCase().slice(0,4);

                const jumpToMessage = () => {
                  if (!f.id) return;
                  onSetDealPanelTab('overview');
                  requestAnimationFrame(() => {
                    const el = streamRef.current?.querySelector(`[data-msgid="${f.id}"]`);
                    if (el) {
                      el.scrollIntoView({behavior:'smooth',block:'center'});
                      el.style.transition = 'background 0.3s';
                      el.style.background = 'rgba(227,168,87,0.15)';
                      setTimeout(()=>{ if (el) el.style.background = ''; }, 1600);
                    }
                  });
                };

                return (
                  <div key={f.id || idx} className="kbdr2-file-row" style={{cursor:'pointer'}} onClick={jumpToMessage} role="button" tabIndex={0} onKeyDown={activateOnKey(jumpToMessage)}>
                    {isImage && f.fileUrl ? (
                      <div style={{width:48,height:48,borderRadius:8,overflow:'hidden',flexShrink:0,background:iconBg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <img src={f.fileUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={(e)=>{ e.currentTarget.style.display='none'; }}/>
                      </div>
                    ) : (
                      <div className="kbdr2-file-icon" style={{background:iconBg,color:iconColor,fontSize:10,fontWeight:800,letterSpacing:'0.04em'}}>
                        {extLabel}
                      </div>
                    )}
                    <div className="kbdr2-file-row-meta">
                      <div className="kbdr2-file-row-name">{f.fileName || 'Attachment'}</div>
                      <div className="kbdr2-file-row-sub">
                        {f.from === 'me' ? 'You' : (active.name || 'Them')} · {f.time || ''}{f.fileSize ? ` · ${(Number(f.fileSize)/1048576).toFixed(1)} MB` : ''}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}} onClick={(e)=>e.stopPropagation()}>
                      <button type="button" className="kbdr2-icon-btn" aria-label="Jump to message" title="Jump to message" onClick={jumpToMessage} style={{width:34,height:34}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </button>
                      {f.fileUrl && (
                        <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="kbdr2-icon-btn" aria-label="Download" title="Download" style={{width:34,height:34,textDecoration:'none'}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </a>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <div className="kbdr2-files-list">
                  {thisWeek.length > 0 && (
                    <>
                      <div style={{fontSize:11,fontWeight:700,color:'#7d8a77',letterSpacing:'0.06em',textTransform:'uppercase',padding:'6px 2px 4px'}}>This week</div>
                      {thisWeek.map(renderFile)}
                    </>
                  )}
                  {earlier.length > 0 && (
                    <>
                      <div style={{fontSize:11,fontWeight:700,color:'#7d8a77',letterSpacing:'0.06em',textTransform:'uppercase',padding:(thisWeek.length > 0 ? '14px' : '6px') + ' 2px 4px'}}>Earlier</div>
                      {earlier.map(renderFile)}
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {/* DELIVERABLES — adjacent project context */}
          {(() => {
            const deliverables = Array.isArray(dealMeta?.workspace?.deliverables) ? dealMeta.workspace.deliverables : [];
            if (deliverables.length === 0) return null;
            const sharedCount = deliverables.filter(d => d.state === 'shared' || d.state === 'approved').length;
            return (
              <div className="kbdr2-section">
                <div className="kbdr2-section-head">
                  <div className="kbdr2-section-title">Deliverables</div>
                  <span className="kbdr2-section-chip">{sharedCount} / {deliverables.length}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {deliverables.map((d, idx) => {
                    const done = d.state === 'approved';
                    const shared = d.state === 'shared';
                    return (
                      <div key={d.id || idx} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:done ? 'rgba(47,133,90,0.06)' : shared ? 'rgba(227,168,87,0.08)' : '#f7f9f5',borderRadius:10,border:`1px solid ${done ? 'rgba(47,133,90,0.15)' : shared ? 'rgba(227,168,87,0.2)' : 'rgba(31,58,46,0.06)'}`}}>
                        <div style={{width:22,height:22,borderRadius:'50%',background:done ? '#2F855A' : shared ? '#e3a857' : '#fff',border:done || shared ? 'none' : '2px solid rgba(31,58,46,0.18)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          {shared && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/></svg>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13.5,fontWeight:600,color:'#1F3A2E'}}>{d.label}</div>
                          <div style={{fontSize:11.5,color:'#7d8a77',textTransform:'capitalize',marginTop:1}}>{done ? 'Approved' : shared ? 'Shared for review' : d.state || 'Planned'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* MILESTONES TAB */}
      {dealPanelTab === 'milestones' && (
        <div className="kbdr2-tab-body">
          <div className="kbdr2-section">
            <div className="kbdr2-section-head">
              <div className="kbdr2-section-title">Milestones</div>
              <span className="kbdr2-section-chip">{msList.filter(m=>m.done).length} / {msList.length} done</span>
            </div>
            {msList.length === 0 ? (
              <div style={{padding:'18px 4px',fontSize:13.5,color:'#7d8a77',lineHeight:1.5}}>
                No milestones set on this deal yet. Milestones are set when a bid is structured with a payment schedule — once a vendor is hired with a milestone breakdown, they'll appear here for inline approval.
                <div style={{marginTop:12}}>
                  <button type="button" className="kbdr2-secondary-btn" onClick={()=>{ onSetDealPanelTab('overview'); onPopulateDealPrompt(role === 'church' ? `Can we break this project into payment milestones? Suggested structure:\n\n1. Kickoff / 25%\n2. Midpoint review / 25%\n3. Delivery / 50%\n\nLet me know what works for the scope.` : `Here's a proposed milestone breakdown for this project:\n\n1. Kickoff / 25% — ${moneyLabel(dealMeta?.budgetValue ? dealMeta.budgetValue * 0.25 : 0)}\n2. Midpoint review / 25%\n3. Delivery / 50%\n\nHappy to adjust.`); }}>
                    Propose milestone structure
                  </button>
                </div>
              </div>
            ) : (
              <div className="kbdr2-ms-list">
                {msList.map((m, idx) => {
                  const cls = m.done ? 'done' : (m.current ? 'current' : '');
                  const isPending = m.current && (m.status === 'current' || m.status === 'pending' || stateKey === 'milestone_pending');
                  return (
                    <div key={m.id || idx} className={`kbdr2-ms-row ${cls}`} style={{flexWrap:'wrap'}}>
                      <div className="kbdr2-ms-pip">
                        {m.done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : (idx+1)}
                      </div>
                      <div className="kbdr2-ms-body">
                        <div className="kbdr2-ms-title">{m.title}</div>
                        <div className="kbdr2-ms-meta">
                          {m.pct ? `${m.pct}% of deal` : ''}
                          {m.pct && m.status ? ' · ' : ''}
                          {m.status === 'done' ? 'Completed' : (m.status === 'current' ? 'In progress' : 'Upcoming')}
                        </div>
                      </div>
                      <div className="kbdr2-ms-amt">{m.amount ? moneyLabel(m.amount) : '—'}</div>

                      {/* INLINE ACTIONS on the current milestone row */}
                      {m.current && !m.done && (
                        <div style={{flexBasis:'100%',display:'flex',gap:8,marginTop:10,paddingTop:10,borderTop:'1px dashed rgba(31,58,46,0.12)',flexWrap:'wrap'}}>
                          {role === 'church' && isPending && (
                            <>
                              <button type="button" className="kbdr2-primary-btn" onClick={onApproveCurrentMilestone}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Approve milestone
                              </button>
                              <button type="button" className="kbdr2-secondary-btn" onClick={()=>{
                                onPopulateDealPrompt(`I've reviewed "${m.title}" and have a few revisions before I can approve:\n\n• [specific feedback 1]\n• [specific feedback 2]\n\nPlease address these and let me know when it's ready for re-review.`);
                                onSetDealPanelTab('overview');
                              }}>
                                Request changes
                              </button>
                            </>
                          )}
                          {role === 'vendor' && !isPending && (
                            <button type="button" className="kbdr2-primary-btn" onClick={()=>{
                              onPopulateDealPrompt(`"${m.title}" is ready for your review. Quick summary of what was delivered:\n\n• [deliverable 1]\n• [deliverable 2]\n\nLet me know if everything looks good or if any revisions are needed.`);
                              onSetDealPanelTab('overview');
                            }}>
                              Submit for approval
                            </button>
                          )}
                          {role === 'vendor' && isPending && (
                            <div style={{fontSize:12,color:'#7d8a77',fontStyle:'italic',padding:'6px 2px'}}>
                              Waiting on approval from {active.name || 'church'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const MemoMessagesDealPanel = React.memo(MessagesDealPanel);

function MessagesComposer({
  active,
  activeId,
  activeReadOnly,
  composerSendLabel,
  uploading,
  sending,
  draft,
  callDetailsBusy,
  canShareCallDetails,
  callDraftSeed,
  onClearCallDraftSeed = () => {},
  composerAssistOpen,
  fileInputRef,
  composerRef,
  onDraftChange = () => {},
  onSendDraft = () => {},
  onAttachClick = () => {},
  onFileInputChange = () => {},
  onComposerKeyDown = () => {},
  onBroadcastTyping = () => {},
  onSetComposerAssistOpen = () => {},
  onShareCallDetails = async () => false,
}) {
  const activeIsSynthetic = !!active?.isSynthetic;
  const currentDraft = String(draft || '');
  return (
    <div className={`kbdr2-composer${activeReadOnly ? ' kbdr2-composer-readonly' : ''}`}>
      <div className="kbdr2-composer-inner">
        <div className="kbdr2-composer-tools">
          <button type="button" className="kbdr2-composer-tool" aria-label="Attach file" onClick={onAttachClick} disabled={uploading || activeReadOnly}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={onFileInputChange}/>
          <button type="button" className="kbdr2-composer-tool" aria-label="Insert emoji" disabled={activeReadOnly} onClick={()=>{ if(activeReadOnly) return; onDraftChange(prev=>`${prev || ''}${prev ? ' ' : ''}🙂`, false); requestAnimationFrame(()=>composerRef.current?.focus?.()); }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </button>
          {canShareCallDetails && (
            <DealRoomCallComposerTool
              disabled={activeReadOnly || uploading || sending}
              busy={callDetailsBusy}
              seed={callDraftSeed}
              onClearSeed={onClearCallDraftSeed}
              onSubmit={onShareCallDetails}
            />
          )}
        </div>
        <textarea
          ref={composerRef}
          value={currentDraft}
          onChange={e=>{ if(activeReadOnly) return; onDraftChange(e.target.value, true); onBroadcastTyping(); }}
          onKeyDown={onComposerKeyDown}
          placeholder={active?.archived ? 'Archived thread — restore this deal before replying.' : activeIsSynthetic ? 'Conversation is still syncing — open the project workspace to start from there.' : `Message ${active?.name || 'this thread'}…`}
          rows={1}
          disabled={activeReadOnly}
          aria-label="Message composer"
        />
        <button
          type="button"
          className="kbdr2-composer-send"
          onClick={onSendDraft}
          disabled={!currentDraft.trim() || uploading || sending || activeReadOnly}
          aria-label={composerSendLabel}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          <span className="kbdr2-composer-send-label">{composerSendLabel}</span>
        </button>
      </div>
      <div className="kbdr2-composer-meta">
        <span>{activeReadOnly ? (active?.archived ? 'Read-only archived deal' : 'Thread is still syncing') : currentDraft.trim() ? `${currentDraft.trim().length} chars · Enter to send` : 'Enter to send · Shift+Enter for a new line'}</span>
        <span>{uploading ? 'Uploading file…' : sending ? 'Sending…' : 'Delivered inside this conversation.'}</span>
      </div>
    </div>
  );
}
const MemoMessagesComposer = React.memo(MessagesComposer);

function VendorInviteStation({
  vendorInviteRows = [],
  vendorInviteTotalCount = 0,
  loadingVendorInvites = false,
  vendorInvitesError = '',
  vendorInvitesTruncated = false,
  role,
  listFilter,
  openVendorInviteProject = () => {},
}) {
  return (
    loadingVendorInvites && vendorInviteRows.length === 0 ? (
      <div className="kbdr2-deals-empty">
        <div className="kbdr2-deals-empty-spinner" aria-hidden="true"/>
        <div className="kbdr2-deals-empty-title">Loading invites…</div>
        <div className="kbdr2-deals-empty-sub">Checking church invitations and current deal state.</div>
      </div>
    ) : vendorInvitesError ? (
      <div className="kbdr2-deals-empty">
        <div className="kbdr2-deals-empty-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div className="kbdr2-deals-empty-title">Invites unavailable</div>
        <div className="kbdr2-deals-empty-sub">{vendorInvitesError}</div>
      </div>
    ) : vendorInviteRows.length === 0 ? (
      <div className="kbdr2-deals-empty">
        <div className="kbdr2-deals-empty-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
        </div>
        <div className="kbdr2-deals-empty-title">No invites yet</div>
        <div className="kbdr2-deals-empty-sub">When a church invites you to bid, the decision item will appear here separately from ordinary conversations.</div>
      </div>
    ) : (
      <>
        {vendorInvitesTruncated && (
          <div className="kbdr2-deals-empty-sub">Showing the 10 most recent invited projects.</div>
        )}
        {vendorInviteRows.map((row, idx) => {
          const initials = getInitialsSafe(row.projectTitle || 'Invite', 'I').slice(0,2).toUpperCase();
          const colorIdx = (row.id ? String(row.id).charCodeAt(0) : idx) % 6;
          const metaLine = [row.churchName, row.city].filter(Boolean).join(' · ');
          return (
            <div
              key={row.id}
              className="kbdr2-deal-row"
              role="button"
              tabIndex={0}
              onClick={()=>openVendorInviteProject(row)}
              onKeyDown={(event)=>{
                if(event.key === 'Enter' || event.key === ' '){
                  event.preventDefault();
                  openVendorInviteProject(row);
                }
              }}
            >
              <div className={`kbdr2-deal-avatar kbdr2-avatar-c${colorIdx}`}>{initials}</div>
              <div className="kbdr2-deal-body">
                <div className="kbdr2-deal-line1">
                  <div className="kbdr2-deal-name">{row.projectTitle || 'Untitled project'}</div>
                  <span className={`kbdr2-deal-badge ${row.statusClass || 'proposal'}`}>{row.statusLabel || 'Invite received'}</span>
                </div>
                <div className="kbdr2-deal-vendor">{metaLine || 'Church invite'}</div>
                <div className="kbdr2-deal-preview">{row.body || 'This church invited you to review the project.'}</div>
              </div>
              <div className="kbdr2-deal-right">
                <div className="kbdr2-deal-time">{row.invitedAtLabel ? `Invited ${row.invitedAtLabel}` : 'Invited'}</div>
                <button
                  type="button"
                  className="kbdr2-secondary-btn"
                  onClick={(event)=>{
                    event.stopPropagation();
                    openVendorInviteProject(row);
                  }}
                >View project</button>
              </div>
            </div>
          );
        })}
      </>
    )
  );
}
const MemoVendorInviteStation = React.memo(VendorInviteStation);


function DealRoomsHub({
  role, activeTab, onTabChange, activeRooms, completedRooms, conversations,
  loadingRooms, roomsError, onOpenRoom, onOpenConversation, hasMoreConvos,
  loadingMoreConvos, onLoadMoreConvos, nav,
}) {
  const [needsMeOnly,setNeedsMeOnly] = useState(false);
  const needsMeCount = activeRooms.filter(item => item?.attentionMeta?.needsMe).length;
  const tabs = [
    { key:'active', label:'Active', count:activeRooms.length },
    { key:'conversations', label:'Conversations', count:conversations.length },
    { key:'completed', label:'Completed', count:completedRooms.length },
  ];
  const roomRows = activeTab === 'completed'
    ? completedRooms
    : (needsMeOnly ? activeRooms.filter(item => item?.attentionMeta?.needsMe) : activeRooms);
  const isVendor = role === 'vendor';
  const statusTone = (key = '') => {
    if (key === 'ready_for_review') return {bg:'#eef4ea',border:'#cbd9c1',color:'#36532d'};
    if (key === 'in_progress') return {bg:'#edf3ee',border:'#cad8cd',color:'#31503a'};
    if (key === 'completed') return {bg:'#f0eee8',border:'#dad4c7',color:'#6d685e'};
    return {bg:'#f8f0dc',border:'#ead8ab',color:'#7e6028'};
  };
  return (
    <section className="kbdr2-hub" aria-label="Deal Rooms">
      <div className="kbdr2-hub-hero">
        <div>
          <div className="kbdr2-hub-kicker">FaithBid workspace</div>
          <h1>Deal Rooms</h1>
          <p>{isVendor
            ? 'Keep awarded work, church conversations, accepted scope, files, and handoff history together.'
            : 'Keep hired vendors, accepted scope, project conversations, files, and handoff history together.'}</p>
        </div>
        <button type="button" className="kbdr2-hub-primary" onClick={()=>nav(role === 'vendor' ? 'my-work' : 'my-projects')}>
          {isVendor ? 'My Work' : 'My Projects'}
        </button>
      </div>

      <div className="kbdr2-hub-controls">
        <div className="kbdr2-hub-tabs" role="tablist" aria-label="Deal Room sections">
          {tabs.map(tab => (
            <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key}
              className={`kbdr2-hub-tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={()=>{
                onTabChange(tab.key);
                if(tab.key !== 'active') setNeedsMeOnly(false);
              }}>
              <span>{tab.label}</span><b>{tab.count}</b>
            </button>
          ))}
        </div>
        {activeTab === 'active' && (
          <button
            type="button"
            className={`kbdr2-hub-needs-me${needsMeOnly ? ' active' : ''}`}
            aria-pressed={needsMeOnly}
            onClick={()=>setNeedsMeOnly(v=>!v)}
          >
            <span className="kbdr2-hub-needs-me-dot" aria-hidden="true"/>
            <span>Needs Me</span>
            <b>{needsMeCount}</b>
          </button>
        )}
      </div>

      <div className="kbdr2-hub-body">
        {activeTab !== 'conversations' ? (
          loadingRooms ? (
            <div className="kbdr2-hub-grid" aria-busy="true">
              {[1,2,3].map(i => <div key={i} className="kbdr2-hub-room-card skeleton"><span/><span/><span/></div>)}
            </div>
          ) : roomsError ? (
            <div className="kbdr2-hub-empty">
              <div className="kbdr2-hub-empty-kicker">Couldn’t load Deal Rooms</div>
              <h2>Your project records are still safe.</h2><p>{roomsError}</p>
            </div>
          ) : roomRows.length ? (
            <div className="kbdr2-hub-grid">
              {roomRows.map(item => {
                const status = item.statusMeta || getCanonicalDealRoomStatus(item.project);
                const next = item.nextMeta || getCanonicalDealRoomNextAction(item.project, role);
                const tone = statusTone(status?.key);
                return (
                  <button
                    type="button"
                    key={String(item.project.id)}
                    className={`kbdr2-hub-room-card${activeTab === 'active' && item?.attentionMeta?.needsMe ? ' needs-attention' : ''}${activeTab === 'active' && item?.attentionMeta && !item.attentionMeta.needsMe ? ' waiting-state' : ''}`}
                    onClick={()=>onOpenRoom(item)}
                  >
                    <div className="kbdr2-hub-room-top">
                      <span className="kbdr2-hub-room-eyebrow">{activeTab === 'completed' ? 'Completed Deal Room' : 'Active Deal Room'}</span>
                      <span className="kbdr2-hub-status" style={{background:tone.bg,borderColor:tone.border,color:tone.color}}>{status?.label || 'Deal Room'}</span>
                    </div>
                    <div className="kbdr2-hub-room-title">{item.project.title || 'Untitled project'}</div>
                    <div className="kbdr2-hub-room-counterparty">{item.counterparty}</div>
                    {activeTab === 'active' && item.attentionMeta && (
                      <div className={`kbdr2-hub-attention is-${item.attentionMeta.tone || 'muted'}`}>
                        <span className="kbdr2-hub-attention-label">{item.attentionMeta.label}</span>
                        <span className="kbdr2-hub-attention-detail">{item.attentionMeta.detail}</span>
                      </div>
                    )}
                    <div className="kbdr2-hub-room-next">{next?.headline || 'Open the project workspace.'}</div>
                    <div className="kbdr2-hub-room-footer">
                      <span>{item.amountLabel || item.project.timeline || 'Project record'}</span>
                      <span className="kbdr2-hub-open-label">{item.unread > 0 ? `${item.unread} unread · ` : ''}Open Deal Room →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="kbdr2-hub-empty">
              <div className="kbdr2-hub-empty-kicker">
                {activeTab === 'completed' ? 'Project history' : needsMeOnly ? 'You’re caught up' : 'Active work'}
              </div>
              <h2>
                {activeTab === 'completed'
                  ? 'No completed Deal Rooms yet.'
                  : needsMeOnly
                    ? 'Nothing needs you right now.'
                    : 'No active Deal Rooms yet.'}
              </h2>
              <p>{activeTab === 'completed'
                ? 'Completed projects will stay here as a clean record of the accepted agreement, files, activity, and conversation.'
                : needsMeOnly
                  ? (isVendor
                      ? 'FaithBid will surface projects here when you need to start work or submit work for church review.'
                      : 'FaithBid will surface projects here when submitted work is ready for your review.')
                  : isVendor
                    ? 'When a church hires you, that project will appear here automatically.'
                    : 'When you hire a vendor, that project will appear here automatically.'}</p>
            </div>
          )
        ) : conversations.length ? (
          <div className="kbdr2-hub-conversation-list">
            {conversations.map(item => (
              <button type="button" key={String(item.id)} className="kbdr2-hub-conversation-row" onClick={()=>onOpenConversation(item)}>
                <div className="kbdr2-hub-conversation-avatar">{getKBAvatarInitials(item.name || item.projectTitle || 'C')}</div>
                <div className="kbdr2-hub-conversation-copy">
                  <div className="kbdr2-hub-conversation-line">
                    <strong>{item.projectTitle || item.name || 'Project conversation'}</strong>
                    {item.unread > 0 && <span>{item.unread} unread</span>}
                  </div>
                  <div className="kbdr2-hub-conversation-person">{item.name || (item.type === 'vendor' ? 'Vendor' : 'Church')}</div>
                  <p>{item.preview || 'No messages yet'}</p>
                </div>
                <span className="kbdr2-hub-conversation-open">Open →</span>
              </button>
            ))}
            {hasMoreConvos && (
              <button type="button" className="kbdr2-hub-load-more" disabled={loadingMoreConvos} onClick={onLoadMoreConvos}>
                {loadingMoreConvos ? 'Loading…' : 'Load more conversations'}
              </button>
            )}
          </div>
        ) : (
          <div className="kbdr2-hub-empty">
            <div className="kbdr2-hub-empty-kicker">Pre-hire communication</div>
            <h2>No open conversations yet.</h2>
            <p>Bid questions, vendor outreach, invitations, and other pre-hire project conversations will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
const MemoDealRoomsHub = React.memo(DealRoomsHub);

function MessagesScreen({role, currentUser, nav, normalizeProjectEntity, mergeProjectWorkspaceSnapshots, isWorkspaceAffectingMessageText, fetchLatestProjectWorkspaceSync, getPendingInboxTarget, clearPendingInboxTarget, setPendingProjectTarget, onClearUnreadBadge}){
  // Clear the global nav badge the moment the inbox mounts — the DB write
  // (updateNotificationsSafe) fires in useInboxThreadState, but the Realtime
  // UPDATE that would re-query unreadMsgs has a network round-trip delay.
  // Calling this immediately makes the badge feel instant.
  useEffect(() => { if (typeof onClearUnreadBadge === 'function') onClearUnreadBadge(); }, []);
  const CONVO_PAGE_SIZE = 50;
  const MESSAGE_PAGE_SIZE = 100;
  const [convos,setConvos]=useState([]);
  const [activeId,setActiveId]=useState(null);
  const [messages,setMessages]=useState([]);
  const [pendingMessages,setPendingMessages]=useState([]);
  const [archiveConfirm, setArchiveConfirm] = useState(null); // {convoId, label} | null
  const [loadingConvos,setLoadingConvos]=useState(true);
  const [loadingMoreConvos,setLoadingMoreConvos]=useState(false);
  const [hasMoreConvos,setHasMoreConvos]=useState(false);
  const [convoPage,setConvoPage]=useState(0);
  const [loadingMsgs,setLoadingMsgs]=useState(false);
  const [loadingOlderMessages,setLoadingOlderMessages]=useState(false);
  const [hasMoreMessages,setHasMoreMessages]=useState(false);
  const [messagePage,setMessagePage]=useState(0);
  const [search,setSearch]=useState("");
  const [listFilter,setListFilter]=useState("all");
  const [dealListCollapsed,setDealListCollapsed]=useState(false);
  const [dealPanelTab,setDealPanelTab]=useState("overview");
  const [peerTyping,setPeerTyping]=useState(false);
  const [headerMenuMode,setHeaderMenuMode]=useState('main');
  const [dealMeta,setDealMeta]=useState(null);
  const [loadingDealMeta,setLoadingDealMeta]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [sending,setSending]=useState(false);
  const [uploadError,setUploadError]=useState("");
  const [callDetailsBusy,setCallDetailsBusy]=useState(false);
  const [searchResults,setSearchResults]=useState([]);
  const [searching,setSearching]=useState(false);
  const [headerMenuOpen,setHeaderMenuOpen]=useState(false);
  const [composerAssistOpen,setComposerAssistOpen]=useState(false);
  const [toast,setToast]=useState("");
  const [newMessageNotice,setNewMessageNotice]=useState(false);
  const [rowActionBusyId,setRowActionBusyId]=useState(null);
  const [vendorInviteRows,setVendorInviteRows]=useState([]);
  const [vendorInviteTotalCount,setVendorInviteTotalCount]=useState(0);
  const [loadingVendorInvites,setLoadingVendorInvites]=useState(false);
  const [vendorInvitesError,setVendorInvitesError]=useState("");
  const [vendorInvitesTruncated,setVendorInvitesTruncated]=useState(false);
  const [inboxSavedProjectIds,setInboxSavedProjectIds]=useState(()=>new Set());
  const [workspaceReturnContext,setWorkspaceReturnContext]=useState(()=>readReturnContext());
  const [dealRoomsHubTab,setDealRoomsHubTab]=useState('active');
  const [dealRoomHubProjects,setDealRoomHubProjects]=useState([]);
  const [loadingDealRoomHubProjects,setLoadingDealRoomHubProjects]=useState(false);
  const [dealRoomHubError,setDealRoomHubError]=useState('');
  const initialInboxTargetRef=useRef(typeof getPendingInboxTarget === 'function' ? getPendingInboxTarget() : null);
  const [dealRoomsHubOpen,setDealRoomsHubOpen]=useState(()=>{
    const pending = initialInboxTargetRef.current;
    if(pending?.mode === 'hub') return true;
    const hasPendingTarget = !!(pending && (pending.conversationId || pending.projectId || pending.projectTitle || pending.vendorId || pending.churchId));
    const hashTarget = typeof window !== 'undefined' && /^#inbox-[^?]+/.test(String(window.location.hash || ''));
    return !(hasPendingTarget || hashTarget);
  });
  const searchInputRef=useRef(null);
  const composerRef=useRef(null);
  const fileInputRef=useRef(null);
  const subRef=useRef(null);
  const typingChanRef=useRef(null);
  const typingSendTsRef=useRef(0);
  const peerTypingClearRef=useRef(null);
  const curRef=useRef(null);
  const cSubRef=useRef(null);
  const mSubRef=useRef(null);
  const activeConvoRef=useRef(null);
  const activeIdRef=useRef(null);
  const convosRef=useRef([]);
  const draftSaveTimerRef=useRef(null);
  const headerMenuRef=useRef(null);
  const composerAssistRef=useRef(null);
  const streamRef=useRef(null);
  const lastMessageCountRef=useRef(0);
  const threadListScrollRef=useRef(null);
  const threadListScrollTopRef=useRef(0);
  // 0174 — explicit Deal Room navigation must outrank the Inbox desktop
  // convenience auto-selection. This ref also lets Back return to the thread
  // list without immediately reopening the first conversation.
  const suppressDesktopAutoSelectRef=useRef(false);
  useEffect(()=>{
    const openHub = ()=>{
      suppressDesktopAutoSelectRef.current = true;
      setHeaderMenuOpen(false); setComposerAssistOpen(false); setDealPanelTab('overview');
      setDealMeta(null); setActiveId(null); setDealRoomsHubOpen(true);
      try { if(typeof clearPendingInboxTarget === 'function') clearPendingInboxTarget(); } catch {}
    };
    try { if(typeof window !== 'undefined') window.addEventListener('kb:dealrooms-hub-open', openHub); } catch {}
    const pending = typeof getPendingInboxTarget === 'function' ? getPendingInboxTarget() : null;
    if(pending?.mode === 'hub') openHub();
    return ()=>{ try { if(typeof window !== 'undefined') window.removeEventListener('kb:dealrooms-hub-open', openHub); } catch {} };
  }, []);
  const viewportWidth = useViewportWidth(1440);
  const isTabletInbox = viewportWidth <= KB_BP_DESKTOP;
  const isMobileInbox = viewportWidth <= KB_BP_TABLET_INBOX;
  const showThreadListPane = !isMobileInbox || !activeId;
  const showCenterPane = !isMobileInbox || !!activeId;
  const showRightRailPane = false; // Option A: context now lives inside workspace tabs, not a cramped third rail.
  const showLeftRailPane = viewportWidth > KB_BP_WIDE;
  // Premium 3-panel desktop layout: viewport preconditions for the deal
  // context rail. The JSX sites additionally gate on the resolved `active`
  // conversation object (not just activeId) so the 3-column layout never
  // appears with a blank/placeholder rail while activeId is stale or the
  // conversation hasn't resolved yet. `active` is declared further down
  // (line ~5906) so we keep this constant viewport-only here and combine
  // it with `active` at the render sites where `active` is in scope.
  // Using the same 1280 threshold as showLeftRailPane for consistency.
  const showInboxRail = false; // 731 Inbox cleanup: remove auto desktop right rail; keep one stable two-pane layout.
  const {
    draft,
    setDraft,
    nextDismissed,
    setNextDismissed,
    starredIds,
    snoozedMap,
    mutedIds,
    assignmentMap,
    resolvedMap,
    pinnedRecordMap,
    lastViewedMap,
    starredSet,
    mutedSet,
    getStoredDraft,
    saveStoredDraft,
    getNextDismissedForConvo,
    setNextDismissedForConvo,
    getSnoozedUntil,
    isSnoozedThread,
    getAssignmentForConvo,
    isResolvedThread,
    getPinnedRecordForConvo,
    getLastViewedLabel,
    setThreadAssignment,
    setThreadSnooze,
    clearThreadSnooze,
    toggleMuteThread,
    toggleResolvedThread,
    pinMessageToRecord,
    clearPinnedRecord,
    markThreadViewed,
    toggleStarThread,
  } = useInboxThreadState({
    activeId,
    activeConvoRef,
    onToast: setToast,
    onMenuClose: () => setHeaderMenuOpen(false),
  });

  useEffect(()=>{
    activeConvoRef.current = convos.find(c=>String(c.id)===String(activeId)) || null;
    activeIdRef.current = activeId;
    convosRef.current = convos;
  }, [convos, activeId]);

  useEffect(()=>{
    setDealPanelTab("overview");
    setHeaderMenuMode('main');
  }, [activeId]);

  useEffect(()=>{
    if(!toast) return;
    const timer = setTimeout(()=>setToast(""), 3500);
    return ()=>clearTimeout(timer);
  }, [toast]);

  const loadInboxSavedProjectIds = useCallback(async()=>{
    if(!currentUser?.id){
      setInboxSavedProjectIds(new Set());
      return;
    }
    try{
      const { data, error } = await supabase
        .from('saved_projects')
        .select('project_id')
        .eq('user_id', currentUser.id)
        .eq('is_saved', true);
      if(error) throw error;
      setInboxSavedProjectIds(new Set((Array.isArray(data) ? data : []).map(row=>String(row?.project_id || '')).filter(Boolean)));
    }catch(err){
      logError('inbox-saved-projects-load', err, { userId:currentUser?.id || null });
    }
  }, [currentUser?.id]);

  useEffect(()=>{
    loadInboxSavedProjectIds();
  }, [loadInboxSavedProjectIds]);

  useEffect(()=>{
    const syncReturnContext = (event)=>{
      if (event?.type === __KB_STORAGE_SYNC_EVENT && event?.detail?.key && event.detail.key !== KB_RETURN_CONTEXT_KEY) return;
      setWorkspaceReturnContext(readReturnContext());
    };
    window.addEventListener('storage', syncReturnContext);
    window.addEventListener(__KB_STORAGE_SYNC_EVENT, syncReturnContext);
    return ()=>{
      window.removeEventListener('storage', syncReturnContext);
      window.removeEventListener(__KB_STORAGE_SYNC_EVENT, syncReturnContext);
    };
  }, []);

  useEffect(()=>{
    if(!headerMenuOpen) { setHeaderMenuMode('main'); return; }
    const onDown = (event)=>{
      if(headerMenuRef.current && !headerMenuRef.current.contains(event.target)) setHeaderMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return ()=>document.removeEventListener('mousedown', onDown);
  }, [headerMenuOpen]);

  useEffect(()=>{
    if(!composerAssistOpen) return;
    const onDown = (event)=>{
      if(composerAssistRef.current && !composerAssistRef.current.contains(event.target)) setComposerAssistOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return ()=>document.removeEventListener('mousedown', onDown);
  }, [composerAssistOpen]);

  useEffect(()=>{
    const inboxMeta = { starredSet, mutedSet, snoozedMap, assignmentMap, resolvedMap, pinnedRecordMap, lastViewedMap };
    const hydrateMeta = c => hydrateInboxConversationMeta(c, inboxMeta);
    setConvos(prev=>prev.map(hydrateMeta));
    setSearchResults(prev=>prev.map(hydrateMeta));
  }, [starredSet, mutedSet, snoozedMap, assignmentMap, resolvedMap, pinnedRecordMap, lastViewedMap]);

  const mapConversationRow = (c, uid, unreadMap = {})=>{
    const viewerRole = uid===c.church_id?"church":"vendor";
    const convoModel = { archived: !!c.archived, status: c.status || "open" };
    const dealState = deriveCanonicalDealState({ project: { status: c.status || "draft", bids: 0 }, conversation: convoModel, role: viewerRole });
    return hydrateInboxConversationMeta({
      id:c.id,
      name:uid===c.church_id?(c.vendor_name||"Vendor"):(c.church_name||"Church"),
      type:uid===c.church_id?"vendor":"church",
      projectTitle:c.project_title||"",
      projectId:c.project_id||null,
      status:c.status||"open",
      archived:!!c.archived,
      dealState,
      unread:unreadMap[c.id]||0,
      time:c.last_message_at?new Date(c.last_message_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):"",
      preview:c.last_message||"No messages yet",
      vendorId:c.vendor_id||null,
      churchId:c.church_id||null,
      lastMessageAt:c.last_message_at||null
    }, { starredSet, mutedSet, snoozedMap, assignmentMap, resolvedMap, pinnedRecordMap, lastViewedMap });
  };

  const mergeConversationRows = (prev, incoming)=>{
    const byId = new Map(prev.map(item=>[String(item.id), item]));
    incoming.forEach(item=>{
      const key = String(item.id);
      const existing = byId.get(key) || {};
      // Defensive merge: don't overwrite a known unread count with the default-zero
      // that comes from realtime conversation upserts (which don't carry unread state).
      // Only the dedicated unread updaters (active-thread subscription, all-message
      // listener, mark-as-read calls) are allowed to change unread.
      const merged = { ...existing, ...item };
      if (item && (item.unread === 0 || item.unread === undefined) && existing && typeof existing.unread === 'number' && existing.unread > 0) {
        merged.unread = existing.unread;
      }
      byId.set(key, merged);
    });
    return Array.from(byId.values()).sort((a,b)=> new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
  };

  const runInboxRequestWithTimeout = (promise, label = 'Inbox request', ms = 15000) => {
    let timer = null;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const request = controller && typeof promise?.abortSignal === 'function'
      ? promise.abortSignal(controller.signal)
      : promise;
    return Promise.race([
      Promise.resolve(request).finally(() => { if (timer) clearTimeout(timer); }),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const err = new Error(`${label} timed out`);
          err.code = 'KB_INBOX_TIMEOUT';
          reject(err);
          try { controller?.abort(); } catch { /* Request may already be settled. */ }
        }, ms);
      }),
    ]);
  };

    const fetchDealRoomHubProjects = useCallback(async()=>{
    if(!currentUser?.id){ setDealRoomHubProjects([]); setDealRoomHubError(''); return; }
    setLoadingDealRoomHubProjects(true); setDealRoomHubError('');
    try{
      // 0180: select only columns that actually exist on public.projects.
      // Hired-vendor display name + accepted amount/timeline live on the hired bid,
      // so enrich them from public.bids instead of pretending they are project columns.
      let query = supabase.from('projects')
        .select('id,title,status,church_id,church_name,hired_vendor_id,hired_at,work_started_at,completion_requested_at,completed_at,budget,budget_min,budget_max,timeline')
        .in('status',['hired','in_progress','completed']);
      query = role === 'vendor' ? query.eq('hired_vendor_id', currentUser.id) : query.eq('church_id', currentUser.id);
      const { data, error } = await runInboxRequestWithTimeout(query, 'Deal Rooms', 15000);
      if(error) throw error;
      const rows=(Array.isArray(data)?data:[])
        .filter(p=>p?.hired_vendor_id && ['hired','in_progress','completed'].includes(String(p?.status||'').toLowerCase()))
        .sort((a,b)=>new Date(b.completed_at||b.work_started_at||b.hired_at||0)-new Date(a.completed_at||a.work_started_at||a.hired_at||0));

      let hiredBidRows = [];
      let canonicalConversationRows = [];
      const projectIds = rows.map(p=>p?.id).filter(Boolean);
      if(projectIds.length){
        try{
          const conversationResult = await runInboxRequestWithTimeout(
            selectConversationsSafe(query => {
              let scoped = query.in('project_id', projectIds);
              scoped = role === 'vendor'
                ? scoped.eq('vendor_id', currentUser.id)
                : scoped.eq('church_id', currentUser.id);
              return scoped;
            }),
            'Deal Room conversations',
            15000
          );
          if(conversationResult?.error) throw conversationResult.error;
          const projectById = new Map(rows.map(project => [String(project?.id || ''), project]));
          canonicalConversationRows = (Array.isArray(conversationResult?.data) ? conversationResult.data : []).filter(convo => {
            const project = projectById.get(String(convo?.project_id || ''));
            if(!project?.hired_vendor_id) return false;
            return String(convo?.vendor_id || '') === String(project.hired_vendor_id) &&
              (!project.church_id || !convo?.church_id || String(convo.church_id) === String(project.church_id));
          });
          if(canonicalConversationRows.length){
            const unreadMap = await fetchUnreadConversationCountsSafe(
              canonicalConversationRows.map(row=>row?.id).filter(Boolean),
              currentUser.id
            );
            const mappedCanonicalConvos = canonicalConversationRows.map(row=>mapConversationRow(row,currentUser.id,unreadMap));
            setConvos(prev=>mergeConversationRows(prev.filter(c=>!c?.isSynthetic),mappedCanonicalConvos));
          }
        }catch(conversationErr){
          logError('deal-room-switcher-conversations', conversationErr, {
            role,
            userId:currentUser?.id || null,
            projectCount:projectIds.length,
          });
        }

        try{
          const { data:bidData, error:bidError } = await runInboxRequestWithTimeout(
            supabase.from('bids')
              .select('project_id,vendor_id,vendor_name,amount,timeline,status')
              .in('project_id', projectIds)
              .eq('status','hired'),
            'Deal Room accepted bids',
            15000
          );
          if(bidError) throw bidError;
          hiredBidRows = Array.isArray(bidData) ? bidData : [];
        }catch(bidErr){
          // The room list is still useful without enrichment; don't hide canonical
          // projects because a secondary accepted-bid read failed.
          logError('deal-rooms-hub-hired-bids', bidErr, { role, userId:currentUser?.id || null, projectCount:projectIds.length });
        }
      }

      const bidByProjectVendor = new Map();
      hiredBidRows.forEach(bid=>{
        const key = `${String(bid?.project_id || '')}:${String(bid?.vendor_id || '')}`;
        if(key !== ':') bidByProjectVendor.set(key, bid);
      });

      const enriched = rows.map(project=>{
        const key = `${String(project?.id || '')}:${String(project?.hired_vendor_id || '')}`;
        const hiredBid = bidByProjectVendor.get(key) || null;
        return {
          ...project,
          hired_vendor_name:hiredBid?.vendor_name || null,
          hired_bid_amount:hiredBid?.amount ?? null,
          hired_bid_timeline:hiredBid?.timeline || null,
        };
      });
      setDealRoomHubProjects(enriched);
    }catch(err){
      logError('deal-rooms-hub-projects',err,{role,userId:currentUser?.id||null});
      setDealRoomHubProjects([]); setDealRoomHubError("We couldn't load your Deal Rooms. Try reopening this tab.");
    }finally{ setLoadingDealRoomHubProjects(false); }
  },[currentUser?.id,role]);

  useEffect(()=>{
    if((dealRoomsHubOpen || activeId) && dealRoomHubProjects.length === 0) fetchDealRoomHubProjects();
  },[dealRoomsHubOpen,activeId,dealRoomHubProjects.length,fetchDealRoomHubProjects]);

  useEffect(()=>{
    if(role !== 'vendor' || !currentUser?.id){
      setVendorInviteRows([]);
      setVendorInviteTotalCount(0);
      setLoadingVendorInvites(false);
      setVendorInvitesError("");
      setVendorInvitesTruncated(false);
      return;
    }
    let cancelled = false;
    const vendorIdentity = String(currentUser.id || '').trim();
    const formatInviteDate = (value)=>{
      if(!value) return '';
      try {
        return new Date(value).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
      } catch {
        return '';
      }
    };
    const inviteStatusClass = (state)=>{
      if(state === 'declined' || state === 'disputed') return 'disputed';
      if(state === 'hired' || state === 'active') return 'active';
      if(state === 'milestone_pending' || state === 'no_response') return 'pending';
      if(state === 'completed' || state === 'archived') return 'completed';
      return 'proposal';
    };
    const convoTitleFallback = (projectId)=>{
      const target = String(projectId || '').trim();
      if(!target) return '';
      const match = safeArray(convosRef.current).find(c => String(c?.projectId || c?.project_id || '').trim() === target);
      return String(match?.projectTitle || match?.project_title || '').trim();
    };
    const sourceTimeMs = (value)=>{
      const time = new Date(value || 0).getTime();
      return Number.isFinite(time) ? time : 0;
    };
    const fetchVendorInviteStation = async()=>{
      setLoadingVendorInvites(true);
      setVendorInvitesError("");
      try{
        const [inviteResult, linkResult, convoResult] = await runInboxRequestWithTimeout(
          Promise.all([
            supabase
              .from('vendor_invites')
              .select('id,project_id,church_id,vendor_id,vendor_user_id,status,match_snapshot_id,invited_at,no_response_after_at,created_at', { count:'exact' })
              .or(`vendor_user_id.eq.${vendorIdentity},vendor_id.eq.${vendorIdentity}`)
              .order('created_at', { ascending:false })
              .limit(50),
            supabase
              .from('project_vendor_links')
              .select('id,project_id,church_id,vendor_user_id,vendor_id,stage,source,last_activity_at,invited_at,created_at')
              .or(`vendor_user_id.eq.${vendorIdentity},vendor_id.eq.${vendorIdentity}`)
              .eq('stage', 'invited')
              .order('last_activity_at', { ascending:false })
              .limit(50),
            selectConversationsSafe(query => query
              .eq('vendor_id', vendorIdentity)
              .not('project_id', 'is', null)
              .order('last_message_at', { ascending:false })
              .limit(50)
            ),
          ]),
          'Vendor invite station discovery',
          7500
        );
        if(cancelled) return;

        const discoveryErrors = [
          ['vendor_invites', inviteResult?.error],
          ['project_vendor_links', linkResult?.error],
          ['conversations', convoResult?.error],
        ].filter(([, error]) => !!error);
        discoveryErrors.forEach(([source, error]) => logError('vendor-invite-station-discovery', error, { userId: vendorIdentity, source }));
        if(discoveryErrors.length >= 3) throw discoveryErrors[0][1];

        const conversationTitleByProject = new Map();
        const candidatesByProject = new Map();
        const upsertCandidate = (candidate = {})=>{
          const projectId = String(candidate.projectId || '').trim();
          if(!projectId) return;
          const nextTime = sourceTimeMs(candidate.sourceTimestamp);
          const existing = candidatesByProject.get(projectId);
          if(existing && existing.sourceTimeMs >= nextTime) return;
          candidatesByProject.set(projectId, {
            ...candidate,
            projectId,
            sourceTimeMs: nextTime,
          });
        };

        safeArray(inviteResult?.data).forEach((row, index)=>{
          upsertCandidate({
            projectId: row?.project_id,
            sourceType: 'vendor_invites',
            sourceId: firstNonEmpty(row?.id, `vendor_invites:${row?.project_id || index}`),
            sourceTimestamp: firstNonEmpty(row?.invited_at, row?.created_at, ''),
            sourceRow: row,
          });
        });

        safeArray(linkResult?.data).forEach((row, index)=>{
          upsertCandidate({
            projectId: row?.project_id,
            sourceType: 'project_vendor_links',
            sourceId: firstNonEmpty(row?.id, `project_vendor_links:${row?.project_id || index}`),
            sourceTimestamp: firstNonEmpty(row?.invited_at, row?.last_activity_at, row?.created_at, ''),
            sourceRow: row,
          });
        });

        safeArray(convoResult?.data).forEach((row, index)=>{
          const projectId = String(row?.project_id || '').trim();
          if(projectId){
            const title = String(row?.project_title || '').trim();
            if(title && !conversationTitleByProject.has(projectId)) conversationTitleByProject.set(projectId, title);
          }
          upsertCandidate({
            projectId,
            sourceType: 'conversations',
            sourceId: firstNonEmpty(row?.id, `conversations:${projectId || index}`),
            sourceTimestamp: firstNonEmpty(row?.last_message_at, ''),
            sourceRow: row,
          });
        });

        const uniqueCandidates = Array.from(candidatesByProject.values()).sort((a,b)=>(b?.sourceTimeMs || 0) - (a?.sourceTimeMs || 0));
        const trueTotal = uniqueCandidates.length;
        const cappedCandidates = uniqueCandidates.slice(0, 10);
        const uniqueProjectIds = cappedCandidates.map(candidate => String(candidate?.projectId || '').trim()).filter(Boolean);
        const isTruncated = uniqueCandidates.length > cappedCandidates.length;

        let projectRows = [];
        if(uniqueProjectIds.length){
          const projectResult = await runInboxRequestWithTimeout(
            supabase
              .from('projects')
              .select('id,title,church_name,city,status')
              .in('id', uniqueProjectIds),
            'Vendor invite project titles',
            6500
          );
          if(cancelled) return;
          if(projectResult?.error) logError('vendor-invite-station-projects', projectResult.error, { userId: vendorIdentity, projectCount: uniqueProjectIds.length });
          projectRows = safeArray(projectResult?.data);
        }
        const projectById = new Map(projectRows.map(project => [String(project?.id || '').trim(), project]).filter(([id]) => !!id));

        const signalEntries = await Promise.all(uniqueProjectIds.map(async(projectId)=>{
          try{
            const maps = await fetchVendorPairSignalMaps({ projectId, churchId: null });
            return [String(projectId), maps || makeEmptyVendorPairSignalMaps()];
          } catch(err){
            logError('vendor-invite-station-signals', err, { userId: vendorIdentity, projectId });
            return [String(projectId), makeEmptyVendorPairSignalMaps()];
          }
        }));
        if(cancelled) return;
        const mapsByProjectId = new Map(signalEntries);
        const now = new Date().toISOString();
        const rows = cappedCandidates.map((candidate, index)=>{
          const projectId = String(candidate?.projectId || '').trim();
          const sourceRow = candidate?.sourceRow || {};
          const projectRow = projectById.get(projectId) || {};
          const projectTitle = String(firstNonEmpty(projectRow?.title, conversationTitleByProject.get(projectId), convoTitleFallback(projectId), 'Untitled project')).trim() || 'Untitled project';
          const project = {
            ...projectRow,
            id: projectId,
            title: projectTitle,
            status: firstNonEmpty(projectRow?.status, 'draft'),
          };
          const vendorId = vendorIdentity;
          const vendorUserId = vendorIdentity;
          const maps = mapsByProjectId.get(projectId) || makeEmptyVendorPairSignalMaps();
          const engineBucket = buildVendorPairSignals({
            vendorId,
            vendorUserId,
            project,
            maps,
            role:'vendor',
            now,
          });
          const engineDealState = deriveCanonicalDealState(engineBucket);
          const linkedBid = engineBucket?.linkedBid || getVendorPairSignalMapEntry(maps?.bidsByVendor, vendorUserId, vendorId);
          const dealSummary = getDealStateSummary(engineDealState, { role:'vendor', linkedBid });
          const invitedAt = firstNonEmpty(candidate?.sourceTimestamp, '');
          return {
            id: String(firstNonEmpty(candidate?.sourceId, `${projectId}:${candidate?.sourceType || 'invite'}:${index}`)),
            projectId,
            projectTitle,
            churchName: String(firstNonEmpty(projectRow?.church_name, sourceRow?.church_name, '')).trim(),
            city: String(projectRow?.city || '').trim(),
            invitedAt,
            invitedAtLabel: formatInviteDate(invitedAt),
            state: engineDealState,
            statusLabel: dealSummary?.statusLabel || 'Invite received',
            statusClass: inviteStatusClass(engineDealState),
            body: dealSummary?.body || 'This church invited you to review the project and decide whether to pursue it.',
          };
        });
        setVendorInviteRows(rows);
        setVendorInviteTotalCount(trueTotal);
        setVendorInvitesTruncated(isTruncated);
        setVendorInvitesError("");
      } catch(err){
        if(cancelled) return;
        logError('vendor-invite-station-fetch', err, { userId: vendorIdentity });
        setVendorInviteRows([]);
        setVendorInviteTotalCount(0);
        setVendorInvitesTruncated(false);
        setVendorInvitesError('Unable to load invites right now.');
      } finally {
        if(!cancelled) setLoadingVendorInvites(false);
      }
    };
    fetchVendorInviteStation();
    return ()=>{ cancelled = true; };
  }, [role, currentUser?.id]);

  const buildPendingInboxFallbackConvo = (target = {}, uid = currentUser?.id) => {
    const cleanTitle = String(target?.projectTitle || target?.title || '').trim();
    const cleanProjectId = target?.projectId || target?.project_id || null;
    const viewerIsVendor = role === 'vendor';
    const fallbackName = viewerIsVendor
      ? (target?.churchName || target?.church_name || cleanTitle || 'Church')
      : (target?.vendorName || target?.vendor_name || 'Vendor');
    const fallbackId = target?.conversationId || cleanProjectId || cleanTitle || `${uid || 'user'}-${Date.now()}`;
    return hydrateInboxConversationMeta({
      id: `pending-${String(fallbackId).replace(/[^a-zA-Z0-9_-]/g, '-')}`,
      name: fallbackName,
      type: viewerIsVendor ? 'church' : 'vendor',
      projectTitle: cleanTitle || 'Pending conversation',
      projectId: cleanProjectId,
      status: target?.status || 'open',
      archived: false,
      dealState: 'inquiry',
      unread: 0,
      time: 'Pending',
      preview: 'Deal room context is ready. The conversation record has not synced yet.',
      vendorId: target?.vendorId || target?.vendor_id || (viewerIsVendor ? uid : null),
      churchId: target?.churchId || target?.church_id || (!viewerIsVendor ? uid : null),
      lastMessageAt: new Date().toISOString(),
      isSynthetic: true,
      pendingTarget: target,
    }, { starredSet, mutedSet, snoozedMap, assignmentMap, resolvedMap, pinnedRecordMap, lastViewedMap });
  };

  const fetchConversationRowsForUser = async(uid, from = 0, to = CONVO_PAGE_SIZE - 1) => {
    const [churchRes, vendorRes] = await Promise.all([
      selectConversationsSafe(query => query.eq('church_id', uid).order('last_message_at', { ascending:false }).range(from, to)),
      selectConversationsSafe(query => query.eq('vendor_id', uid).order('last_message_at', { ascending:false }).range(from, to)),
    ]);

    const errors = [churchRes?.error, vendorRes?.error].filter(Boolean);
    const rows = [...(churchRes?.data || []), ...(vendorRes?.data || [])];
    const deduped = [];
    const seen = new Set();
    rows.forEach(row => {
      if(!row?.id) return;
      const key = String(row.id);
      if(seen.has(key)) return;
      seen.add(key);
      deduped.push(row);
    });
    deduped.sort((a,b)=> {
      const aUnread = Number(a.unread || 0);
      const bUnread = Number(b.unread || 0);
      if (aUnread > 0 && bUnread === 0) return -1;
      if (bUnread > 0 && aUnread === 0) return 1;
      return new Date(b.last_message_at || b.lastMessageAt || 0).getTime() - new Date(a.last_message_at || a.lastMessageAt || 0).getTime();
    });
    return { data: deduped.slice(0, CONVO_PAGE_SIZE), error: errors[0] || null };
  };

  useEffect(()=>{
    curRef.current=currentUser;
    if(!currentUser?.id) {
      setLoadingConvos(false);
      setLoadingMoreConvos(false);
      setConvos([]);
      setActiveId(null);
      return;
    }
    setConvoPage(0);
    let disposed = false;
    let markReadTimer = null;
    const initialConversationLoad = fetchConvos(currentUser.id, { append:false, page:0 });
    // Keep this housekeeping write behind the initial conversation read. On a
    // cold authenticated boot, racing it against every workspace query can
    // strand the PATCH in the browser queue. Cleanup also suppresses React
    // Strict Mode's throwaway first-effect write.
    Promise.resolve(initialConversationLoad).finally(() => {
      if(disposed) return;
      markReadTimer = setTimeout(() => {
        if(disposed) return;
        updateNotificationsSafe(query => query.update({read:true}).eq("user_id",currentUser.id).eq("type","new_message").eq("read",false))
          .then(() => { /* Realtime UPDATE listener in App() will call loadUnread() */ })
          .catch(err => logError('inbox-mark-all-read', err));
      }, 250);
    });
    if(cSubRef.current) cSubRef.current.unsubscribe();
    if(mSubRef.current) mSubRef.current.unsubscribe();
    const upsertRealtimeConversation = payload => {
      const row = payload?.new;
      if(!row) return;
      const mapped = mapConversationRow(row, currentUser.id);
      setConvos(prev => mergeConversationRows(prev, [mapped]));
    };
    cSubRef.current=kbTrackChannel(supabase.channel(`cl_${currentUser.id}`))
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"conversations",filter:`church_id=eq.${currentUser.id}`},upsertRealtimeConversation)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"conversations",filter:`vendor_id=eq.${currentUser.id}`},upsertRealtimeConversation)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"conversations",filter:`church_id=eq.${currentUser.id}`},upsertRealtimeConversation)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"conversations",filter:`vendor_id=eq.${currentUser.id}`},upsertRealtimeConversation)
      .subscribe();

    // Cross-thread message listener: bumps unread + updates preview/sort on
    // non-active conversations when a new message arrives anywhere. RLS limits
    // visible rows to conversations this user is part of, so we don't filter
    // server-side. Active-thread messages are skipped here (the per-thread
    // subscription handles them) and own-sends are skipped too.
    mSubRef.current=kbTrackChannel(supabase.channel(`m_all_${currentUser.id}`))
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages" }, payload => {
        const m = payload?.new;
        if (!m || !m.conversation_id) return;
        const cid = m.conversation_id;
        // Skip the active thread — its dedicated subscription handles it
        if (String(activeIdRef.current) === String(cid)) return;
        // Skip own sends (we already updated optimistically)
        if (m.sender_id === currentUser.id) return;
        // Only update if the conversation is in our list (RLS should already
        // ensure this, but defensive)
        const known = convosRef.current.some(c => String(c.id) === String(cid));
        if (!known) return;

        const previewText = m.text || (m.file_name ? `📎 ${m.file_name}` : 'New message');
        const createdAt = m.created_at || new Date().toISOString();
        setConvos(cs => {
          const updated = cs.map(c => {
            if (String(c.id) !== String(cid)) return c;
            return {
              ...c,
              unread: Number(c.unread || 0) + 1,
              preview: previewText,
              time: 'Just now',
              lastMessageAt: createdAt,
            };
          });
          // Re-sort so the bumped thread floats up
          return updated.sort((a,b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
        });
      })
      .subscribe();

    return()=>{
      disposed = true;
      if(markReadTimer) clearTimeout(markReadTimer);
      if(subRef.current) subRef.current.unsubscribe();
      if(cSubRef.current) cSubRef.current.unsubscribe();
      if(mSubRef.current) mSubRef.current.unsubscribe();
    };
    // Depend on user id only — currentUser is recreated on auth-state events,
    // and tearing down this channel rebuilds the entire inbox subscription.
  },[currentUser?.id]);

  useEffect(()=>{
    if(!currentUser) return;
    const query = String(search || '').trim();
    if(query.length < 2){
      setSearching(false);
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async()=>{
      setSearching(true);
      try{
        // Strip commas, parens, colons, dots, percent, and other PostgREST
        // meta-characters so user input cannot break out of the .or(...)
        // filter expression. RLS is the real boundary; this is defense
        // in depth. See audit blocker #4.
        const escaped = sanitizePostgrestTerm(query);
        if(!escaped){
          if(!cancelled) { setSearchResults([]); setSearching(false); }
          return;
        }
        const convoColumns = 'id,church_id,vendor_id,church_name,vendor_name,project_id,project_title,last_message,last_message_at,status,archived';
        const [churchHits, vendorHits, messageHits] = await Promise.all([
          selectConversationsSafe(query => query.eq('church_id', currentUser.id).or(`vendor_name.ilike.%${escaped}%,church_name.ilike.%${escaped}%,project_title.ilike.%${escaped}%,last_message.ilike.%${escaped}%`).limit(80)),
          selectConversationsSafe(query => query.eq('vendor_id', currentUser.id).or(`vendor_name.ilike.%${escaped}%,church_name.ilike.%${escaped}%,project_title.ilike.%${escaped}%,last_message.ilike.%${escaped}%`).limit(80)),
          runSupabaseWithFallback(
            () => supabase.from('messages').select('conversation_id,text').ilike('text', `%${escaped}%`).limit(80),
            () => supabase.from('messages').select('conversation_id,body').ilike('body', `%${escaped}%`).limit(80)
          ),
        ]);
        const messageIds = Array.from(new Set((messageHits.data || []).map(row=>row.conversation_id).filter(Boolean)));
        let messageConversations = [];
        if(messageIds.length){
          const [churchMsgConvos, vendorMsgConvos] = await Promise.all([
            selectConversationsSafe(query => query.eq('church_id', currentUser.id).in('id', messageIds)),
            selectConversationsSafe(query => query.eq('vendor_id', currentUser.id).in('id', messageIds)),
          ]);
          messageConversations = [...(churchMsgConvos.data || []), ...(vendorMsgConvos.data || [])];
        }
        const mergedRows = [];
        const seen = new Set();
        [...(churchHits.data || []), ...(vendorHits.data || []), ...messageConversations].forEach(row=>{
          const key = String(row.id);
          if(seen.has(key)) return;
          seen.add(key);
          mergedRows.push(row);
        });
        const unreadMap = await fetchUnreadConversationCountsSafe(mergedRows.map(r=>r.id), currentUser.id);
        const mapped = mergedRows.map(row=>mapConversationRow(row, currentUser.id, unreadMap));
        if(!cancelled) setSearchResults(mapped);
      } catch (err) {
        logError("inbox-search", err, { query: String(query).slice(0, 40) });
        if(!cancelled) setSearchResults([]);
      } finally {
        if(!cancelled) setSearching(false);
      }
    }, 220);
    return ()=>{ cancelled = true; clearTimeout(timer); };
  }, [search, currentUser?.id]);

  useEffect(()=>{
    if(!activeId) return;
    setMessagePage(0);
    fetchMessages(activeId, { append:false, page:0 });
    if(subRef.current) subRef.current.unsubscribe();
    if(typingChanRef.current) typingChanRef.current.unsubscribe();
    setPeerTyping(false);
    if(peerTypingClearRef.current){ clearTimeout(peerTypingClearRef.current); peerTypingClearRef.current = null; }

    subRef.current=kbTrackChannel(supabase.channel(`m:${activeId}`))
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`conversation_id=eq.${activeId}`},p=>{
        const m=p.new;
        const activeConvo = activeConvoRef.current;
        const callEvent = hydrateDealRoomCallEvent(m, curRef.current?.id);
        const systemEvent = callEvent ? null : hydrateDealSystemEvent(m, { projectTitle: activeConvo?.projectTitle || '' });
        const normalized = (callEvent || systemEvent || {id:m.id,from:m.sender_id===curRef.current?.id?"me":"them",type:(m.file_url||m.file_path)?"file":"text",text:m.text,fileName:m.file_name||null,fileSize:m.file_size||null,fileUrl:m.file_url||null,filePath:m.file_path||null,time:new Date(m.created_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}),createdAt:m.created_at||null});
        setPendingMessages(prev=>prev.filter(pm=>{
          const sameType = pm.type === normalized.type;
          const sameBody = normalized.type === 'file' ? pm.fileName === normalized.fileName : pm.text === normalized.text;
          const sameAuthor = pm.from === 'me' && normalized.from === 'me';
          const ageOk = Math.abs(new Date(pm.createdAt || 0).getTime() - new Date(normalized.createdAt || 0).getTime()) < 120000;
          return !(sameType && sameBody && sameAuthor && ageOk);
        }));
        setMessages(prev=> prev.some(existing=>String(existing.id)===String(normalized.id)) ? prev : [...prev, normalized]);
        // A real message arriving from peer means they stopped typing
        if (normalized.from === 'them') {
          setPeerTyping(false);
          if (peerTypingClearRef.current) { clearTimeout(peerTypingClearRef.current); peerTypingClearRef.current = null; }
        }
        const previewText = callEvent ? buildDealRoomCallPreview(callEvent.callData) : (systemEvent?.systemData?.eyebrow || m.text || (m.file_name ? `📎 ${m.file_name}` : "Update"));
        const newCreatedAt = m.created_at || new Date().toISOString();
        setConvos(cs => {
          const updated = cs.map(c => String(c.id) === String(activeId) ? {...c, preview:previewText, time:"Just now", lastMessageAt:newCreatedAt} : c);
          return updated.sort((a,b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
        });
        if ((m.file_url || isWorkspaceAffectingMessageText(m.text)) && activeConvo?.projectId) fetchDealMeta(activeConvo);
      }).subscribe();

    // Typing broadcast channel — peer sends "typing" pings, we set/refresh
    // a 4-second auto-expiring "peer is typing" flag. Cheap (no DB writes).
    typingChanRef.current = supabase.channel(`typing:${activeId}`, { config:{ broadcast:{ self:false } } })
      .on('broadcast', { event:'typing' }, (payload)=>{
        const fromUserId = payload?.payload?.user_id;
        const myId = curRef.current?.id;
        if (!fromUserId || !myId) return;
        if (String(fromUserId) === String(myId)) return; // ignore own broadcasts
        setPeerTyping(true);
        if (peerTypingClearRef.current) clearTimeout(peerTypingClearRef.current);
        peerTypingClearRef.current = setTimeout(()=>{
          setPeerTyping(false);
          peerTypingClearRef.current = null;
        }, 4000);
      })
      .subscribe();

    return ()=>{
      if(subRef.current) subRef.current.unsubscribe();
      if(typingChanRef.current) typingChanRef.current.unsubscribe();
      if(peerTypingClearRef.current){ clearTimeout(peerTypingClearRef.current); peerTypingClearRef.current = null; }
      setPeerTyping(false);
    };
  },[activeId]);

  const fetchConvos=async(uid, opts={})=>{
    const append = !!opts.append;
    const page = Number(opts.page || 0);
    if(!append) setLoadingConvos(true); else setLoadingMoreConvos(true);
    try{
      const from = page * CONVO_PAGE_SIZE;
      const to = from + CONVO_PAGE_SIZE - 1;
      const result = await runInboxRequestWithTimeout(
        fetchConversationRowsForUser(uid, from, to),
        'Conversation list',
        3500
      );
      const data = Array.isArray(result?.data) ? result.data : [];
      if(result?.error){
        logError('fetchConvos-query', result.error, { uid, page });
        if(!append) setConvos([]);
        setHasMoreConvos(false);
        return;
      }

      let unreadMap = {};
      if(data.length){
        try{
          const ids = data.map(c=>c.id).filter(Boolean);
          unreadMap = await runInboxRequestWithTimeout(fetchUnreadConversationCountsSafe(ids, uid), 'Unread-count lookup', 4500);
        }catch(unreadErr){
          logError('fetchConvos-unread-timeout', unreadErr, { uid, count:data.length });
          unreadMap = {};
        }
      }

      const mapped = data.map(c=>mapConversationRow(c, uid, unreadMap));
      if(!append && mapped.length === 0){
        const pending = typeof getPendingInboxTarget === 'function' ? getPendingInboxTarget() : null;
        const pendingHasContext = pending && (pending.conversationId || pending.projectId || pending.projectTitle || pending.vendorId || pending.churchId);
        setConvos(pendingHasContext ? [buildPendingInboxFallbackConvo(pending, uid)] : []);
      } else {
        setConvos(prev=> append ? mergeConversationRows(prev, mapped) : mapped);
      }
      setHasMoreConvos(data.length === CONVO_PAGE_SIZE);
    }catch(err){
      if (err?.code !== 'KB_INBOX_TIMEOUT') logError('fetchConvos', err, { uid, page, append });
      if(!append){
        const pending = typeof getPendingInboxTarget === 'function' ? getPendingInboxTarget() : null;
        const pendingHasContext = pending && (pending.conversationId || pending.projectId || pending.projectTitle || pending.vendorId || pending.churchId);
        setConvos(pendingHasContext ? [buildPendingInboxFallbackConvo(pending, uid)] : []);
        setHasMoreConvos(false);
      }
    }finally{
      if(!append) setLoadingConvos(false); else setLoadingMoreConvos(false);
    }
  };

  const fetchMessages=async(cid, opts={})=>{
    const append = !!opts.append;
    const page = Number(opts.page || 0);
    const targetConvo = convosRef.current.find(c => String(c.id) === String(cid));
    if(targetConvo?.isSynthetic){
      if(!append){
        setMessages([]);
        setPendingMessages([]);
        setHasMoreMessages(false);
      }
      setLoadingMsgs(false);
      setLoadingOlderMessages(false);
      return;
    }
    if(!append) setLoadingMsgs(true); else setLoadingOlderMessages(true);
    try{
      const from = page * MESSAGE_PAGE_SIZE;
      const to = from + MESSAGE_PAGE_SIZE - 1;
      const { data, error } = await runInboxRequestWithTimeout(
        runSupabaseWithFallback(
          () => supabase.from("messages").select("id,conversation_id,sender_id,text,file_url,file_path,file_name,file_size,message_type,event_data,scheduled_for,supersedes_message_id,created_at").eq("conversation_id",cid).order("created_at",{ascending:false}).range(from,to),
          () => supabase.from("messages").select("id,conversation_id,sender_id,body,created_at").eq("conversation_id",cid).order("created_at",{ascending:false}).range(from,to)
        ),
        'Message list',
        8500
      );
      // Race guard: if the user switched threads while this request was in
      // flight, drop the result so we don't overwrite the new thread's
      // messages with stale data from the old thread.
      if (String(activeConvoRef.current?.id ?? "") !== String(cid)) {
        return;
      }
      if(error){
        logError('fetchMessages-query', error, { cid, page });
        if(!append) setMessages([]);
        setHasMoreMessages(false);
        return;
      }
      if(data) {
        const mapped = (data||[]).slice().reverse().map(m=>{
          const callEvent = hydrateDealRoomCallEvent(m, currentUser?.id);
          if (callEvent) return callEvent;
          const systemEvent = hydrateDealSystemEvent(m, { projectTitle: activeConvoRef.current?.projectTitle || '' });
          if (systemEvent) return systemEvent;
          return {id:m.id,from:m.sender_id===currentUser?.id?"me":"them",type:(m.file_url||m.file_path)?"file":"text",text:m.text ?? m.body ?? "",fileName:m.file_name||null,fileSize:m.file_size||null,fileUrl:m.file_url||null,filePath:m.file_path||null,time:new Date(m.created_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}),createdAt:m.created_at||null};
        });
        setMessages(prev=>{
          if(!append) return mapped;
          const known = new Set(prev.map(item=>String(item.id)));
          return [...mapped.filter(item=>!known.has(String(item.id))), ...prev];
        });
        if(!append) setPendingMessages([]);
        setHasMoreMessages((data||[]).length === MESSAGE_PAGE_SIZE);
      }
    }catch(err){ logError('fetchMessages', err); }finally{ if(!append) setLoadingMsgs(false); else setLoadingOlderMessages(false); }
  };

  const fetchDealMeta=async(convo)=>{
    if(!convo?.projectId){ setDealMeta(null); return; }
    setLoadingDealMeta(true);
    try{
      const [{data:projectData},{data:bidRows},{count:openDisputes},{data:activityRows}] = await runInboxRequestWithTimeout(Promise.all([
        runSupabaseWithFallback(
          () => supabase.from("projects").select("*").eq("id", convo.projectId).maybeSingle(),
          () => supabase.from("projects").select("id,church_id,title,description,church_name,city,project_city,project_state,project_place_id,hired_at,work_started_at,work_started_by,completion_requested_at,completion_requested_by,completed_at,completed_by,category,primary_category,category_tags,budget,budget_min,budget_max,delivery_preference,timeline,status,posted_at,urgent,scope,hired_vendor_id,hired_vendor_name,hired_bid_id,amount").eq("id", convo.projectId).maybeSingle()
        ),
        runSupabaseWithFallback(
          () => supabase.from("bids").select("id,project_id,vendor_id,vendor_name,amount,timeline,status,milestones,created_at,cover_letter").eq("project_id", convo.projectId).order("created_at",{ascending:true}).limit(200),
          () => supabase.from("bids").select("id,project_id,vendor_id,vendor_name,amount,timeline,status,created_at").eq("project_id", convo.projectId).order("created_at",{ascending:true}).limit(200)
        ),
        countOpenDisputesSafe(convo.projectId),
        supabase.from('project_activity_feed').select('id,kind,title,body,created_at,meta').eq('project_id', convo.projectId).order('created_at',{ascending:false}).limit(24),
      ]), 'Deal metadata', 9000);
      const project = normalizeProjectEntity(projectData || { id: convo.projectId, title: convo.projectTitle || "", status: convo.status || "draft", hired_vendor_id: convo.vendorId || null, hired_vendor_name: convo.type === "vendor" ? convo.name : "" });
      const allBids = Array.isArray(bidRows) ? bidRows : [];
      const preferredVendorId = convo.vendorId || (convo.type === "church" ? currentUser?.id : null) || project?.hired_vendor_id || null;
      const linkedBid = allBids.find(b => preferredVendorId && String(b.vendor_id ?? "") === String(preferredVendorId))
        || allBids.find(b => String(b.id ?? "") === String(project?.hired_bid_id ?? ""))
        || allBids.find(b => String(b.status || "") === "hired")
        || allBids[0]
        || null;
      const rawMilestones = Array.isArray(linkedBid?.milestones) ? linkedBid.milestones : [];
      const milestones = rawMilestones.map((m,i)=>{
        const pct = Number(m?.pct ?? m?.percent ?? 0) || 0;
        const amount = Number(m?.amount ?? ((Number(linkedBid?.amount)||0) * pct / 100)) || 0;
        const status = m?.status || (i===0 && String(project?.status||"")=="hired" ? "current" : "pending");
        return { id: m?.id || `${linkedBid?.id || convo.projectId}-m-${i}`, title: m?.title || `Milestone ${i+1}`, pct, amount, status, done: status === "done", current: status === "current" || (status !== "done" && !rawMilestones.slice(0,i).some(x => (x?.status||"") !== "done")) };
      });
      const remoteWorkspaceBundle = await fetchLatestProjectWorkspaceSync(convo.projectId);
      const workspace = mergeProjectWorkspaceSnapshots(loadProjectWorkspace(project || { id: convo.projectId, status: convo.status }), remoteWorkspaceBundle?.workspace || {}, project || { id: convo.projectId, status: convo.status });
      if (project?.id) saveProjectWorkspace(project.id, workspace);
      const nextMilestone = milestones.find(m => !m.done) || null;
      const budgetValue = Number(project?.budget || 0) || 0;
      const bidValue = Number(linkedBid?.amount || project?.amount || 0) || 0;
      const canonicalDealState = deriveCanonicalDealState({ project, linkedBid, workspace, openDisputes, conversation: convo, role: convo?.type || role });
      const canonicalActivityKinds = new Set(['vendor_hired','project_started','completion_requested','completion_request_cancelled','completion_requested_cancelled','completion_changes_requested','project_completed','project_reopened']);
      const activity = (Array.isArray(activityRows) ? activityRows : []).filter(row=>canonicalActivityKinds.has(String(row?.kind || '').trim().toLowerCase())).slice(0,8);
      // Hydrate sparse confirm_hire-created conversation rows from canonical
      // project/bid truth so a brand-new Deal Room never renders as just "Vendor".
      setConvos(cs=>cs.map(c=>String(c.id)===String(convo.id)?{
        ...c,
        dealState: canonicalDealState,
        status: project?.status || c.status,
        projectTitle: project?.title || c.projectTitle || '',
        name: c.type === 'vendor'
          ? (linkedBid?.vendor_name || project?.hired_vendor_name || c.name || 'Hired vendor')
          : (project?.church_name || c.name || 'Church'),
      }:c));
      // Race guard for dealMeta only: if the user navigated to a different
      // conversation mid-fetch, don't overwrite the new thread's dealMeta.
      if (String(activeConvoRef.current?.id ?? "") !== String(convo?.id ?? "")) {
        return;
      }
      setDealMeta({ project, linkedBid, allBids, milestones, nextMilestone, workspace, budgetValue, bidValue, activity, openDisputes: Number(openDisputes||0) || 0, dealState: canonicalDealState });
    }catch(err){
      logError('fetch-deal-meta', err, { convoId: convo?.id });
      setDealMeta(null);
    }finally{
      setLoadingDealMeta(false);
    }
  };

  const insertSystemMessage = async(systemText, preview='Deal event')=>{
    const clean = String(systemText || '').trim();
    const targetConvoId = activeId;
    const targetConvo = activeConvoRef.current;
    if(!clean || !targetConvoId || !currentUser) return false;
    const createdAt = new Date().toISOString();
    try{
      const { data, error } = await runSupabaseWithFallback(
        () => supabase
          .from("messages")
          .insert({ conversation_id:targetConvoId, sender_id:currentUser.id, text:clean })
          .select("id,sender_id,text,file_name,file_size,file_url,file_path,created_at")
          .maybeSingle(),
        () => supabase
          .from("messages")
          .insert({ conversation_id:targetConvoId, sender_id:currentUser.id, body:clean })
          .select("id,sender_id,body,created_at")
          .maybeSingle()
      );
      if(error) throw error;
      await updateConversationSafe(targetConvoId, { last_message:preview, last_message_at:createdAt });
      const normalized = hydrateDealSystemEvent(data ? {...data, text: data?.text ?? data?.body ?? clean} : {
        id:`sys-${Date.now()}`,
        sender_id: currentUser.id,
        text: clean,
        created_at: createdAt,
      }, { projectTitle: targetConvo?.projectTitle || '' }) || {
        id:data?.id || `sys-${Date.now()}`,
        from:'me',
        type:'system',
        text:clean,
        time:new Date(createdAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),
        createdAt,
      };
      if(String(activeConvoRef.current?.id ?? '') === String(targetConvoId)){
        setMessages(prev => prev.some(existing=>String(existing.id)===String(normalized.id)) ? prev : [...prev, normalized]);
      }
      return true;
    }catch(err){
      logError('insert-system-message', err, { activeId: targetConvoId, preview });
      setToast('Could not record deal action');
      return false;
    }
  };
  const requestApproval = async()=>{
    const summary = dealMeta?.nextMilestone?.title ? `${dealMeta.nextMilestone.title}${dealMeta.nextMilestone.amount ? ` · ${moneyLabel(dealMeta.nextMilestone.amount)}` : ''}` : (dealMeta?.workspace?.nextAction || activeSummary?.body || 'Review requested');
    const ok = await insertSystemMessage(`Approval requested
${summary}`, 'Approval requested');
    if(ok) setToast('Approval requested');
  };

  const markCloseoutReadyFromThread = async()=>{
    const projectId = active?.projectId || dealMeta?.project?.id || null;
    const projectModel = dealMeta?.project || { id: projectId, title: active?.projectTitle || '', status: active?.status || 'draft', budget: dealMeta?.budgetValue || 0 };
    if(projectId){
      try{
        saveProjectOpsState(projectId, prev => ({
          ...prev,
          closeout: {
            ...(prev.closeout || {}),
            status:'ready',
          },
        }), projectModel);
        pushProjectInteropSignal(projectId, { text:'Closeout ready', tone:'gold', attention:'Project closeout is ready for final review and archive' });
      } catch(e) { logError("project-closeout-signal", e); }
    }
    const summary = dealMeta?.nextMilestone?.title
      ? `${dealMeta.nextMilestone.title}${dealMeta.nextMilestone.amount ? ` · ${moneyLabel(dealMeta.nextMilestone.amount)}` : ''}`
      : (threadProject || active?.projectTitle || 'Final handoff and review are ready');
    const ok = await insertSystemMessage(`Closeout ready
${summary}`, 'Closeout ready');
    if(ok) setToast('Closeout marked ready');
  };
  const focusStageLane = ()=>{
    if(!activeDealState){ setListFilter('all'); setToast('Showing all threads'); return; }
    if(activeDealState === 'inquiry') setListFilter('inquiry');
    else if(activeDealState === 'bid_placed' || activeDealState === 'bid_under_review') setListFilter('bid');
    else if(activeDealState === 'hired') setListFilter('hired');
    else if(['active','milestone_pending','disputed'].includes(activeDealState)) setListFilter('active');
    else if(activeDealState === 'completed') setListFilter('completed');
    setToast(`${stageLabel(activeDealState)} lane focused`);
  };
  const toggleSaveProxy = async()=>{
    const projectId = active?.projectId || dealMeta?.project?.id || null;
    if(!projectId){
      setToast('No project is attached to this conversation.');
      return;
    }
    if(!currentUser?.id){
      setToast('Sign in to save this project.');
      return;
    }
    const key = String(projectId);
    const shouldSave = !inboxSavedProjectIds.has(key);
    await persistSavedProjectRecord(projectId, shouldSave, currentUser.id);
    try{
      const { data, error } = await supabase
        .from('saved_projects')
        .select('project_id,is_saved')
        .eq('user_id', currentUser.id)
        .eq('project_id', projectId)
        .maybeSingle();
      if(error) throw error;
      const persistedSaved = data?.is_saved === true;
      setInboxSavedProjectIds(prev=>{
        const next = new Set(prev);
        if(persistedSaved) next.add(key);
        else next.delete(key);
        return next;
      });
      if(persistedSaved === shouldSave){
        setToast(persistedSaved ? 'Project saved' : 'Removed from saved projects');
      }else{
        setToast(shouldSave ? 'Could not save project' : 'Could not remove saved project');
      }
    }catch(err){
      logError('inbox-save-project-verify', err, { projectId, userId:currentUser.id, shouldSave });
      await loadInboxSavedProjectIds();
      setToast('Could not verify the saved-project state');
    }
  };
  const retryFailedItems = async()=>{
    const failed = pendingMessages.filter(m=>m.failed && m.retryPayload);
    if(!failed.length) return;
    const succeededIds = new Set();
    for(const item of failed){
      let ok = false;
      if(item.retryPayload.kind === 'file' && item.retryPayload.file) ok = await handleSendFile(item.retryPayload.file, { retryPendingId:item.id });
      if(item.retryPayload.kind === 'text' && item.retryPayload.text) ok = await handleSend(item.retryPayload.text, { retryPendingId:item.id });
      if(ok) succeededIds.add(item.id);
    }
    if(succeededIds.size) setPendingMessages(prev=>prev.filter(m=>!succeededIds.has(m.id)));
  };
  const dismissFailedItems = ()=> setPendingMessages(prev=>prev.filter(m=>!m.failed));
  const restoreThreadListScroll = ()=>{
    const node = threadListScrollRef.current;
    if(!node) return;
    try { node.scrollTop = threadListScrollTopRef.current || 0; } catch {}
  };
  const closeActiveThreadToList = ()=>{
    suppressDesktopAutoSelectRef.current = true;
    setHeaderMenuOpen(false); setComposerAssistOpen(false); setDealPanelTab('overview');
    setDealMeta(null); setActiveId(null); setDealRoomsHubOpen(true);
  };
  const selectRelativeThread = (direction = 1)=>{
    if(!orderedFiltered.length) return;
    const idx = orderedFiltered.findIndex(c=>String(c.id)===String(activeId));
    const nextIdx = idx === -1 ? 0 : Math.min(Math.max(idx + direction, 0), orderedFiltered.length - 1);
    const target = orderedFiltered[nextIdx];
    if(target) handleSelect(target.id);
  };
  const handleShareCallDetails=async(input={})=>{
    const targetConvoId = activeId;
    const targetConvo = activeConvoRef.current;
    const safeUrl = normalizeDealRoomCallUrl(input?.url);
    const status = ['shared','updated','cancelled'].includes(String(input?.status || '').toLowerCase()) ? String(input.status).toLowerCase() : 'shared';
    if(!targetConvoId || !currentUser?.id){ setToast('Open a signed-in Deal Room before sharing call details.'); return false; }
    if(!isCanonicalDealRoom){ setToast('Call details are available after a vendor is hired and the Deal Room is active.'); return false; }
    if(targetConvo?.isSynthetic || targetConvo?.archived){ setToast('This Deal Room is read-only right now.'); return false; }
    if(!safeUrl){ setToast('Use a complete HTTPS call link.'); return false; }
    if(callDetailsBusy) return false;
    const scheduledFor = input?.scheduledFor && Number.isFinite(new Date(input.scheduledFor).getTime()) ? new Date(input.scheduledFor).toISOString() : null;
    const callData = {
      status,
      url:safeUrl,
      label:String(input?.label || '').trim().slice(0,120),
      note:String(input?.note || '').trim().slice(0,500),
      timezone:String(input?.timezone || '').trim().slice(0,100),
      scheduledFor,
    };
    const preview = buildDealRoomCallPreview(callData);
    const createdAt = new Date().toISOString();
    setCallDetailsBusy(true);
    try{
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id:targetConvoId,
          sender_id:currentUser.id,
          text:preview,
          message_type:'call_details',
          event_data:{
            schema_version:1,
            status,
            url:safeUrl,
            label:callData.label,
            note:callData.note,
            timezone:callData.timezone,
          },
          scheduled_for:scheduledFor,
          supersedes_message_id:input?.supersedesMessageId || null,
        })
        .select('id,conversation_id,sender_id,text,message_type,event_data,scheduled_for,supersedes_message_id,created_at')
        .maybeSingle();
      if(error) throw error;
      await updateConversationSafe(targetConvoId, { last_message:preview, last_message_at:createdAt });
      const normalized = hydrateDealRoomCallEvent(data || {
        id:`call-${Date.now()}`,
        conversation_id:targetConvoId,
        sender_id:currentUser.id,
        text:preview,
        message_type:'call_details',
        event_data:{ status, url:safeUrl, label:callData.label, note:callData.note, timezone:callData.timezone },
        scheduled_for:scheduledFor,
        supersedes_message_id:input?.supersedesMessageId || null,
        created_at:createdAt,
      }, currentUser.id);
      if(normalized && String(activeConvoRef.current?.id ?? '') === String(targetConvoId)){
        setMessages(prev=>prev.some(existing=>String(existing.id)===String(normalized.id)) ? prev : [...prev, normalized]);
      }
      setConvos(prev=>prev.map(convo=>String(convo.id)===String(targetConvoId)?{...convo,preview,time:'Now',lastMessageAt:data?.created_at || createdAt}:convo));
      if(data?.id){
        try{
          const { error:notificationError } = await createTrustedNotificationSafe('message_sent', data.id);
          if(notificationError) throw notificationError;
        }catch(notificationError){ logError('call-details-notification', notificationError, { messageId:data.id }); }
      }
      setToast(status === 'cancelled' ? 'Call cancelled in the Deal Room' : status === 'updated' ? 'Updated call details shared' : 'Call details shared');
      return true;
    }catch(error){
      logError('deal-room-call-details', error, { activeId:targetConvoId, status });
      setToast('Call details could not be shared. Check the link and try again.');
      return false;
    }finally{
      setCallDetailsBusy(false);
    }
  };

  const handleSend=async(text, options={})=>{
    const clean = String(text || '').trim();
    const targetConvoId = activeId;
    const targetConvo = activeConvoRef.current;
    if(!clean) return false;
    if(!targetConvoId){
      setToast('No conversation selected — pick a thread first.');
      return false;
    }
    if(!currentUser){
      setToast('You need to be signed in to send messages.');
      return false;
    }
    if(sending) return false;
    if(targetConvo?.isSynthetic){
      setToast('This deal room is not synced yet. Open the project workspace or start the vendor conversation first.');
      return false;
    }
    if(targetConvo?.archived){
      setToast('Restore this deal before sending a new message.');
      return false;
    }
    const retryPendingId = options?.retryPendingId || null;
    const optimisticId = retryPendingId || `temp-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const pendingPayload = {id:optimisticId,from:'me',type:'text',text:clean,time:'Sending…',createdAt,pending:true,failed:false,retryPayload:{kind:'text',text:clean}};
    setPendingMessages(prev=> retryPendingId
      ? prev.map(m=>String(m.id)===String(retryPendingId)?{...m,...pendingPayload}:m)
      : [...prev,pendingPayload]
    );
    setConvos(cs=>cs.map(c=>c.id===targetConvoId?{...c,preview:clean,time:'Now',lastMessageAt:createdAt}:c));
    setSending(true);
    try{
      const { data, error } = await runSupabaseWithFallback(
        () => supabase
          .from("messages")
          .insert({conversation_id:targetConvoId,sender_id:currentUser.id,text:clean})
          .select("id,sender_id,text,file_name,file_size,file_url,file_path,created_at")
          .maybeSingle(),
        () => supabase
          .from("messages")
          .insert({conversation_id:targetConvoId,sender_id:currentUser.id,body:clean})
          .select("id,sender_id,body,created_at")
          .maybeSingle()
      );
      if(error) throw error;
      await updateConversationSafe(targetConvoId, {last_message:clean,last_message_at:createdAt});
      const normalized = {
        id:data?.id || `sent-${Date.now()}`,
        from:'me',
        type:'text',
        text:clean,
        fileName:null,
        fileSize:null,
        fileUrl:null,
        filePath:null,
        time:new Date(data?.created_at || createdAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),
        createdAt:data?.created_at || createdAt,
      };
      setPendingMessages(prev=>prev.filter(m=>m.id!==optimisticId));
      if(String(activeConvoRef.current?.id ?? '') === String(targetConvoId)){
        setMessages(prev => prev.some(existing=>String(existing.id)===String(normalized.id)) ? prev : [...prev, normalized]);
      }
      if(data?.id){
        try{
          const { error: notificationError } = await createTrustedNotificationSafe("message_sent", data.id);
          if (notificationError) throw notificationError;
        }catch(err){
          logError("message-notification-insert",err, { messageId: data.id });
        }
      }
      return true;
    }catch(err){
      logError("message-send",err, { activeId: targetConvoId });
      setPendingMessages(prev=>prev.map(m=>m.id===optimisticId?{...m,pending:false,failed:true,time:'Failed'}:m));
      setToast('Message could not be sent — tap Retry or check your connection.');
      return false;
    }finally{
      setSending(false);
    }
  };

  const formatUploadSize = (size=0)=>{
    const n = Number(size) || 0;
    if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    if (n >= 1024) return `${Math.round(n / 1024)} KB`;
    return `${n} B`;
  };

  // Opens a chat attachment. Prefers a short-lived signed URL for private
  // bucket paths; falls back to legacy public URL for old messages. See
  // audit blocker #2.
  const openChatAttachment = useCallback(async (msg) => {
    if (!msg) return;
    try {
      if (msg.filePath) {
        const url = await getSignedChatFileUrl(msg.filePath, 300);
        if (url) { window.open(url, '_blank', 'noopener,noreferrer'); return; }
      }
      if (msg.fileUrl) {
        window.open(msg.fileUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      setToast("Could not open attachment.");
    } catch (err) {
      logError("open-attachment", err, { msgId: msg.id });
      setToast("Could not open attachment.");
    }
  }, [setToast]);

  const handleSendFile=async(file, options={})=>{
    const targetConvoId = activeId;
    const targetConvo = activeConvoRef.current;
    if(!file) return false;
    if(!targetConvoId){
      setToast('No conversation selected — pick a thread first.');
      return false;
    }
    if(!currentUser){
      setToast('You need to be signed in to attach files.');
      return false;
    }
    if(uploading) return false;
    if(targetConvo?.isSynthetic){
      setToast('This deal room is not synced yet. Open the project workspace or start the vendor conversation first.');
      return false;
    }
    if(targetConvo?.archived){
      setToast('Restore this deal before attaching a file.');
      if(fileInputRef.current) fileInputRef.current.value="";
      return false;
    }
    const validationError = validateAppUploadFile(file);
    if(validationError){ setUploadError(validationError); if(fileInputRef.current) fileInputRef.current.value=""; return false; }
    setUploadError("");
    setUploading(true);
    const fileName = file.name || 'Attachment';
    const createdAt = new Date().toISOString();
    const retryPendingId = options?.retryPendingId || null;
    const optimisticId = retryPendingId || `temp-file-${Date.now()}`;
    const pendingPayload = {id:optimisticId,from:'me',type:'file',text:null,fileName,fileSize:formatUploadSize(file.size),fileUrl:null,filePath:null,time:'Uploading…',createdAt,pending:true,failed:false,retryPayload:{kind:'file',file}};
    setPendingMessages(prev=> retryPendingId
      ? prev.map(m=>String(m.id)===String(retryPendingId)?{...m,...pendingPayload}:m)
      : [...prev,pendingPayload]
    );
    setConvos(cs=>cs.map(c=>c.id===targetConvoId?{...c,preview:`📎 ${fileName}`,time:'Now',lastMessageAt:createdAt}:c));
    try{
      const safeName = String(file.name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_');
      const uploadPath = `chat/${targetConvoId}/${Date.now()}_${safeName}`;
      const { error: uploadErr } = await supabase.storage.from("chat-files").upload(uploadPath, file, { cacheControl:"3600", upsert:false });
      if (uploadErr) throw uploadErr;
      // Bucket is private. Store the path only; sign URLs on demand when
      // the UI renders the attachment. See audit blocker #2.
      const fileSize = formatUploadSize(file.size);
      const { data, error } = await runSupabaseWithFallback(
        () => supabase
          .from("messages")
          .insert({
            conversation_id: targetConvoId,
            sender_id:       currentUser.id,
            text:            null,
            file_name:       fileName,
            file_size:       fileSize,
            file_path:       uploadPath,
            file_url:        null,
          })
          .select("id,sender_id,text,file_name,file_size,file_url,file_path,created_at")
          .maybeSingle(),
        () => supabase
          .from("messages")
          .insert({
            conversation_id: targetConvoId,
            sender_id:       currentUser.id,
            body:            `Attachment uploaded: ${fileName}`,
          })
          .select("id,sender_id,body,created_at")
          .maybeSingle()
      );
      if (error) throw error;
      await updateConversationSafe(targetConvoId, {last_message:`📎 ${fileName}`,last_message_at:createdAt});
      const normalized = {
        id:data?.id || `sent-file-${Date.now()}`,
        from:'me',
        type:'file',
        text:null,
        fileName:fileName,
        fileSize:fileSize,
        fileUrl:data?.file_url || null,
        filePath:data?.file_path || uploadPath,
        time:new Date(data?.created_at || createdAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),
        createdAt:data?.created_at || createdAt,
      };
      setPendingMessages(prev=>prev.filter(m=>m.id!==optimisticId));
      if(String(activeConvoRef.current?.id ?? '') === String(targetConvoId)){
        setMessages(prev => prev.some(existing=>String(existing.id)===String(normalized.id)) ? prev : [...prev, normalized]);
      }
      if(data?.id){
        try{
          const { error: notificationError } = await createTrustedNotificationSafe("message_sent", data.id);
          if (notificationError) throw notificationError;
        }catch(notifErr){ logError("chat-file-notify", notifErr, { messageId: data.id }); }
      }
      return true;
    }catch(error){
      logError("chat-file-send", error, { activeId: targetConvoId });
      setUploadError(getUploadFailureMessage(error));
      setPendingMessages(prev=>prev.map(m=>m.id===optimisticId?{...m,pending:false,failed:true,time:'Failed'}:m));
      return false;
    }finally{
      setUploading(false);
      if(fileInputRef.current) fileInputRef.current.value="";
    }
  };

  const handleSelect=useCallback(async(id)=>{
    const nextId = id == null ? null : id;
    if(nextId != null){ suppressDesktopAutoSelectRef.current = false; setDealRoomsHubOpen(false); }
    const changed = String(activeId ?? '') !== String(nextId ?? '');
    if(changed){
      threadListScrollTopRef.current = threadListScrollRef.current?.scrollTop || 0;
      // Immediate UI acknowledgement: clear stale right-pane content while the
      // selected thread hydrates, so a click visibly registers even on a slow DB.
      setMessages([]);
      setPendingMessages([]);
      setDealMeta(null);
      setMessagePage(0);
      setHasMoreMessages(false);
      setPeerTyping(false);
      setLoadingMsgs(true);
      setDealPanelTab('overview');
    }
    setHeaderMenuOpen(false);
    setComposerAssistOpen(false);
    markThreadViewed(nextId);
    setActiveId(nextId);
    const selectedConvo = convosRef.current.find(c => String(c.id) === String(nextId));
    setConvos(cs=>cs.map(c=>String(c.id)===String(nextId)?{...c,unread:0}:c));
    if(currentUser && !selectedConvo?.isSynthetic){try{await markConversationReadSafe(nextId, currentUser.id);}catch(err){ logError('markConversationRead', err, { id: nextId }); }}
  }, [activeId, currentUser?.id, markThreadViewed]);

  useEffect(()=>{
    if(dealRoomsHubOpen || !currentUser?.id || loadingConvos || activeId || convos.length > 0) return;
    const pending = typeof getPendingInboxTarget === 'function' ? getPendingInboxTarget() : null;
    const pendingHasContext = pending && (pending.conversationId || pending.projectId || pending.projectTitle || pending.vendorId || pending.churchId);
    if(pendingHasContext) setConvos([buildPendingInboxFallbackConvo(pending, currentUser.id)]);
  }, [dealRoomsHubOpen, loadingConvos, convos.length, activeId, currentUser?.id]);

  useEffect(()=>{
    if(!currentUser || activeId || convos.length===0) return;
    const pending = getPendingInboxTarget();
    if(pending?.mode === 'hub'){
      suppressDesktopAutoSelectRef.current = true; setDealRoomsHubOpen(true);
      try { clearPendingInboxTarget(); } catch {}
      return;
    }
    const hashTarget = typeof window !== 'undefined'
      ? (()=>{
          const raw = String(window.location.hash || '');
          const match = raw.match(/^#inbox-([^?]+)/);
          return match ? decodeURIComponent(match[1]) : null;
        })()
      : null;
    if(!pending && !hashTarget) return;
    const match = convos.find(c =>
      (hashTarget && String(c.id) === String(hashTarget)) ||
      (pending?.conversationId && String(c.id) === String(pending.conversationId)) ||
      (pending?.projectId && String(c.projectId ?? "") === String(pending.projectId) && (!pending.vendorId || String(c.vendorId ?? "") === String(pending.vendorId)) && (!pending.churchId || String(c.churchId ?? "") === String(pending.churchId))) ||
      (!pending?.projectId && pending?.projectTitle && (c.projectTitle || "") === pending.projectTitle && (!pending.vendorId || String(c.vendorId ?? "") === String(pending.vendorId)))
    );
    if(match){
      suppressDesktopAutoSelectRef.current = false; setDealRoomsHubOpen(false);
      // Keep the explicit target alive through this effect cycle. The desktop
      // auto-select effect runs later and previously overwrote this selection
      // with the first visible Inbox thread after "Open deal room".
      Promise.resolve(handleSelect(match.id)).finally(()=>{
        if(pending) {
          try { clearPendingInboxTarget(); } catch {}
        }
      });
    }
  }, [convos, activeId, currentUser]);

  const active=convos.find(c=>String(c.id)===String(activeId));

  useEffect(()=>{
    if(!active){ setDealMeta(null); return; }
    fetchDealMeta(active);
  }, [activeId, active?.projectId, currentUser?.id]);

  useEffect(()=>{
    setUploadError("");
    setPendingMessages([]);
    setHeaderMenuOpen(false);
    if(activeId === null) requestAnimationFrame(()=>restoreThreadListScroll());
  }, [activeId]);

  useEffect(()=>{
    if(draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    if(!activeId) return;
    draftSaveTimerRef.current = setTimeout(()=>saveStoredDraft(activeId, String(draft || '').trim()), 200);
    return ()=>{ if(draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current); };
  }, [draft, activeId]);
  useEffect(()=>{
    if(!activeId) return;
    const onKeyDown = (event)=>{
      if(event.key === 'Escape'){
        if(composerAssistOpen){ event.preventDefault(); setComposerAssistOpen(false); return; }
        if(headerMenuOpen){ event.preventDefault(); setHeaderMenuOpen(false); return; }
      }
      const tag = String(event.target?.tagName || '').toLowerCase();
      const inField = tag === 'input' || tag === 'textarea' || event.target?.isContentEditable;
      if(inField && !event.altKey) return;
      if(event.altKey && event.key === 'ArrowDown'){ event.preventDefault(); selectRelativeThread(1); }
      if(event.altKey && event.key === 'ArrowUp'){ event.preventDefault(); selectRelativeThread(-1); }
      if(event.altKey && event.key.toLowerCase() === 's'){ event.preventDefault(); toggleStarThread(activeId); }
      if(event.altKey && event.key.toLowerCase() === 'e'){ event.preventDefault(); active?.archived ? restoreConvo(activeId) : deleteConvo(activeId); }
      if(event.altKey && event.key.toLowerCase() === 'm'){ event.preventDefault(); toggleMuteThread(activeId); }
      if(event.altKey && event.key.toLowerCase() === 'r'){ event.preventDefault(); toggleResolvedThread(activeId); }
    };
    document.addEventListener('keydown', onKeyDown);
    return ()=>document.removeEventListener('keydown', onKeyDown);
  }, [activeId, active?.archived, composerAssistOpen, headerMenuOpen, listFilter, search, convos.length, searchResults.length, starredIds.length, mutedIds.length, Object.keys(resolvedMap || {}).length]);

  // Keep thread selection tied to the same filtered list the UI is actually rendering.
  // This avoids selection thrash between legacy filter logic and the newer operator views.

  const deleteConvo=useCallback(async(id)=>{
    if(!id) return;
    const target = convosRef.current.find(c => String(c.id) === String(id));
    setRowActionBusyId(id);
    if(target?.isSynthetic){
      setConvos(prev=>prev.filter(c=>String(c.id)!==String(id)));
      if(activeId===id) setActiveId(null);
      try { if(typeof clearPendingInboxTarget === 'function') clearPendingInboxTarget(); } catch {}
      setToast('Pending conversation removed');
      setRowActionBusyId(null);
      return;
    }
    setConvos(prev=>prev.map(c=>c.id===id?{...c,archived:true}:c));
    if(activeId===id && listFilter!=="archived") setActiveId(null);
    try{await updateConversationSafe(id, {archived:true});}catch(err){ logError('archiveConvo', err, { id }); }
    finally{ setRowActionBusyId(null); }
  }, [activeId, clearPendingInboxTarget, listFilter, setToast]);

  const restoreConvo=useCallback(async(id)=>{
    if(!id) return;
    const target = convosRef.current.find(c => String(c.id) === String(id));
    setRowActionBusyId(id);
    if(target?.isSynthetic){
      setConvos(prev=>prev.map(c=>c.id===id?{...c,archived:false}:c));
      setToast('Pending conversation restored locally');
      setRowActionBusyId(null);
      return;
    }
    setConvos(prev=>prev.map(c=>c.id===id?{...c,archived:false}:c));
    try{await updateConversationSafe(id, {archived:false});}catch(err){ logError('restoreConvo', err, { id }); }
    finally{ setRowActionBusyId(null); }
    setListFilter('all');
    setActiveId(id);
  }, [setToast]);

  const loadMoreConvos=useCallback(async()=>{
    if(!currentUser || loadingMoreConvos || !hasMoreConvos) return;
    const nextPage = convoPage + 1;
    setConvoPage(nextPage);
    await fetchConvos(currentUser.id, { append:true, page:nextPage });
  }, [currentUser?.id, loadingMoreConvos, hasMoreConvos, convoPage, fetchConvos]);

  const loadOlderMessages=useCallback(async()=>{
    if(!activeId || loadingOlderMessages || !hasMoreMessages) return;
    const nextPage = messagePage + 1;
    setMessagePage(nextPage);
    await fetchMessages(activeId, { append:true, page:nextPage });
  }, [activeId, loadingOlderMessages, hasMoreMessages, messagePage, fetchMessages]);

  // Routed through the global formatMoney so cents/dollar display stays consistent
  // with bid amounts, fees, and milestone totals everywhere else in the app.
  const moneyLabel = (value)=>{ const n = Number(value||0); return Number.isFinite(n) && n>0 ? formatMoney(n) : "—"; };
  const exactStage = c => (isResolvedThread(c?.id) ? 'resolved' : (deriveCanonicalDealState({ project: { status: c.status || "draft" }, conversation: { ...c, archived: !!c.archived }, role: c.type }) || c.dealState || "inquiry"));
  const activeDealState = active ? (dealMeta?.dealState || exactStage(active)) : null;
  const activeSummary = active && activeDealState ? getDealStateSummary(activeDealState, { moneyLabel, nextMilestone: dealMeta?.nextMilestone || null, linkedBid: dealMeta?.linkedBid || null, role: active.type }) : null;
  const activeActionSet = active && activeDealState ? getDealRoomActionSet(activeDealState, { role: active.type, moneyLabel, nextMilestone: dealMeta?.nextMilestone || null, linkedBid: dealMeta?.linkedBid || null }) : null;
  const canonicalProject = dealMeta?.project || null;
  const canonicalProjectStatus = String(canonicalProject?.status || '').trim().toLowerCase();
  const canonicalHiredVendorId = canonicalProject?.hired_vendor_id || null;
  // A project can have multiple pre-hire vendor conversations. Only the
  // conversation with the actually hired vendor receives Deal Room chrome.
  const isCanonicalDealRoom = Boolean(
    active?.projectId &&
    canonicalProject?.id &&
    canonicalHiredVendorId &&
    active?.vendorId &&
    String(active.vendorId) === String(canonicalHiredVendorId) &&
    ['hired','in_progress','completed'].includes(canonicalProjectStatus)
  );
  const canonicalDealRoomStatus = isCanonicalDealRoom ? getCanonicalDealRoomStatus(canonicalProject) : null;
  const canonicalDealRoomNext = isCanonicalDealRoom ? getCanonicalDealRoomNextAction(canonicalProject, role) : null;
  const canonicalDealRoomControls = isCanonicalDealRoom ? getCanonicalDealRoomControls(canonicalProject, role) : null;
  const canonicalAcceptedBid = isCanonicalDealRoom ? getCanonicalAcceptedDealBid(dealMeta) : null;
  const runCanonicalDealRoomLifecycle = async (action, note = null) => {
    const targetProjectId = canonicalProject?.id || active?.projectId || null;
    if (!isCanonicalDealRoom || !targetProjectId) throw new Error('This conversation is not connected to an active Deal Room.');
    const updated = await transitionProjectLifecycleSafe(targetProjectId, action, note);
    setDealMeta(prev => {
      if (!prev?.project || String(prev.project.id) !== String(targetProjectId)) return prev;
      const nextProject = normalizeProjectEntity({ ...prev.project, ...(updated || {}) });
      return { ...prev, project:nextProject };
    });
    if (updated?.status) {
      setConvos(prev=>prev.map(convo=>String(convo.id)===String(activeId)?{...convo,status:updated.status}:convo));
    }
    const currentConvo = activeConvoRef.current;
    if (currentConvo && String(currentConvo.id) === String(activeId)) await fetchDealMeta(currentConvo);
    return updated;
  };
  const nextLabel = activeSummary?.nextActionLabel || 'Next up';
  const nextText = dealMeta?.nextMilestone?.title ? `${dealMeta.nextMilestone.title}${dealMeta.nextMilestone.amount ? ` · ${moneyLabel(dealMeta.nextMilestone.amount)}` : ''}` : (dealMeta?.workspace?.nextAction || activeSummary?.body || 'Review the latest thread activity and keep the deal moving.');
  const stageChip = (state)=> getDealStateBadge(state || 'inquiry');
  const populateDealPrompt = useCallback((template = '')=> {
    const nextTemplate = String(template || '').trim();
    if(!nextTemplate) return;
    setNextDismissed(false);
    setNextDismissedForConvo(activeId, false);
    setDraft(nextTemplate);
    requestAnimationFrame(()=>composerRef.current?.focus());
  }, [activeId, composerRef, setDraft, setNextDismissed]);
  const approveCurrentMilestone = useCallback(async()=>{
    const summary = dealMeta?.nextMilestone?.title ? `${dealMeta.nextMilestone.title}${dealMeta.nextMilestone.amount ? ` · ${moneyLabel(dealMeta.nextMilestone.amount)}` : ''}` : (dealMeta?.workspace?.nextAction || activeSummary?.body || 'Approval confirmed');
    const ok = await insertSystemMessage(`Milestone approved
${summary}`, 'Milestone approved');
    if(ok) setToast('Approval confirmed');
  }, [activeSummary?.body, dealMeta, insertSystemMessage, moneyLabel, setToast]);
  const handleQuickPrompt = ()=> {
    populateDealPrompt(activeActionSet?.primary?.template || activeSummary?.nextActionTemplate || '');
  };
  const getActiveProjectTarget = () => {
    const projectId = active?.projectId || dealMeta?.project?.id || null;
    const projectTitle = active?.projectTitle || dealMeta?.project?.title || null;
    return { projectId, projectTitle: String(projectTitle || '').trim() || null };
  };
  const hasActiveProjectTarget = () => {
    const target = getActiveProjectTarget();
    return Boolean(target.projectId || target.projectId === 0 || target.projectTitle);
  };
  const buildActiveThreadReturnContext = ()=> active ? ({
    scope:'inbox-thread',
    source:'inbox-thread',
    screen:'inbox',
    conversationId: active.id || null,
    projectId: getActiveProjectTarget().projectId,
    linkedProjectId: getActiveProjectTarget().projectId,
    projectTitle: getActiveProjectTarget().projectTitle,
    vendorId: active.vendorId || dealMeta?.linkedBid?.vendor_id || dealMeta?.project?.hired_vendor_id || null,
    churchId: active.churchId || dealMeta?.project?.church_id || null,
    tab: active?.type === 'vendor' ? 'vendors' : 'overview',
  }) : null;
  const openVendorInviteProject=useCallback((row)=>{
    if(!row) return;
    if(!nav){ setToast('Navigation unavailable — try reloading.'); return; }
    queueProjectNavigation(nav, {
      projectId: row.projectId,
      projectTitle: row.projectTitle,
      screen: KB_NAV_SCREENS.projects,
      tab:'overview',
      returnContext: {
        scope:'vendor-invite-station',
        source:'vendor-invite-station',
        screen:'inbox',
        projectId: row.projectId,
        linkedProjectId: row.projectId,
        projectTitle: row.projectTitle,
        vendorId: currentUser?.id || null,
        vendorUserId: currentUser?.id || null,
        churchName: row.churchName || null,
        tab:'overview',
      },
    });
    setToast('Opening project…');
  }, [currentUser?.id, nav, setToast]);
  const openDealWorkspace=useCallback(()=>{
    if(!active){ setToast('Open a conversation first to see its workspace.'); return; }
    if(!nav){ setToast('Navigation unavailable — try reloading.'); return; }
    const nextScreen = active.type==="church"?"my-work":"my-projects";
    const { projectId, projectTitle } = getActiveProjectTarget();
    if((projectId || projectId === 0) || projectTitle){
      queueProjectNavigation(nav, { projectId, projectTitle, screen: nextScreen, tab: active?.type === 'vendor' ? 'vendors' : 'overview', returnContext: buildActiveThreadReturnContext() });
      setToast('Opening linked workspace…');
      return;
    }
    nav(nextScreen);
    setToast('No linked project yet — opened your workspace list.');
  }, [active, buildActiveThreadReturnContext, getActiveProjectTarget, nav, setToast]);
  const openLatestFile = useCallback(async ()=>{
    if(!active){ setToast('Open a conversation to see its files.'); return; }
    const fileMsg = [...messages, ...pendingMessages]
      .filter(m=>m.type==='file' && (m.filePath || m.fileUrl) && !m.failed)
      .sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0))[0];
    if(fileMsg){
      await openChatAttachment(fileMsg);
    } else if(hasActiveProjectTarget()) {
      openDealWorkspace();
      setToast('No linked file yet — opened workspace');
    } else {
      setToast('No linked files yet. Attach a file from the composer.');
      composerRef.current?.focus?.();
    }
  }, [active, messages, pendingMessages, openChatAttachment, hasActiveProjectTarget, openDealWorkspace, setToast]);
  const openCounterpartyProfile = useCallback(()=>{
    if(!active){ setToast('Open a conversation to view the other side.'); return; }
    if(!nav){ setToast('Navigation unavailable — try reloading.'); return; }
    const returnContext = buildActiveThreadReturnContext();
    if(active?.type === 'vendor'){
      const vendorId = active.vendorId || dealMeta?.linkedBid?.vendor_id || dealMeta?.project?.hired_vendor_id || null;
      if(vendorId){
        queueVendorNavigation(nav, { id:vendorId, user_id:vendorId, vendorId, name:active.name || dealMeta?.linkedBid?.vendor_name || null, projectId: getActiveProjectTarget().projectId, projectTitle: getActiveProjectTarget().projectTitle, screen:'vendors', source:'inbox-thread' }, { returnContext });
        setToast('Opened vendor profile');
      } else {
        queueVendorNavigation(nav, { name:active.name || 'Vendor', projectId: getActiveProjectTarget().projectId, projectTitle: getActiveProjectTarget().projectTitle, screen:'vendors', source:'inbox-thread' }, { returnContext });
        setToast('Vendor identity missing — opened vendor directory');
      }
      return;
    }
    const { projectId, projectTitle } = getActiveProjectTarget();
    if(projectId || projectId === 0 || projectTitle){
      queueProjectNavigation(nav, { projectId, projectTitle, screen:'projects', tab:'overview', returnContext });
      setToast('Opened project brief');
    } else {
      nav('projects');
      setToast('No linked project — opened marketplace');
    }
  }, [active, buildActiveThreadReturnContext, dealMeta, getActiveProjectTarget, nav, setToast]);
  const openActivityForThread = useCallback(()=>{
    if(!active){ setToast('Open a conversation to view its activity.'); return; }
    if(!nav){ setToast('Navigation unavailable — try reloading.'); return; }
    const { projectId, projectTitle } = getActiveProjectTarget();
    if((projectId || projectId === 0) || projectTitle){
      queueProjectNavigation(nav, { projectId, projectTitle, screen: KB_NAV_SCREENS.activity, returnContext: buildActiveThreadReturnContext() });
      setToast('Opening project activity…');
      return;
    }
    nav(KB_NAV_SCREENS.activity);
    setToast('No linked project yet — opened activity.');
  }, [active, buildActiveThreadReturnContext, getActiveProjectTarget, nav, setToast]);
  const createSyncedThreadFromActive = async()=>{
    if(!active?.isSynthetic){
      composerRef.current?.focus?.();
      return;
    }
    if(!currentUser?.id){
      setToast('Sign in again to create this thread.');
      nav && nav('auth');
      return;
    }
    const pending = active.pendingTarget || (typeof getPendingInboxTarget === 'function' ? getPendingInboxTarget() : null) || {};
    const { projectId, projectTitle } = getActiveProjectTarget();
    const target = {
      ...pending,
      projectId: pending.projectId || projectId || null,
      projectTitle: pending.projectTitle || projectTitle || active.projectTitle || null,
      vendorId: pending.vendorId || active.vendorId || null,
      vendorName: pending.vendorName || (active.type === 'vendor' ? active.name : null) || null,
      churchId: pending.churchId || active.churchId || null,
      churchName: pending.churchName || (active.type === 'church' ? active.name : null) || null,
      viewerRole: role === 'vendor' ? 'vendor' : 'church',
      createIfMissing: true,
      initialMessage: pending.initialMessage || 'Conversation started',
    };
    if(!canCreateInboxConversation(target, target.viewerRole)){
      setToast(target.viewerRole === 'vendor' ? 'This deal needs a church contact before a thread can be created.' : 'Pick or attach a vendor before creating the thread.');
      openDealWorkspace();
      return;
    }
    try{
      setLoadingConvos(true);
      const created = await ensureInboxConversation(currentUser, target);
      if(created?.id){
        const mapped = mapConversationRow(created, currentUser.id, {});
        setConvos(prev => mergeConversationRows(prev.filter(c=>!c.isSynthetic), [mapped]));
        try { if(typeof clearPendingInboxTarget === 'function') clearPendingInboxTarget(); } catch (e) { if (kbIsDevRuntime()) console.warn('[kb] createSyncedThreadFromActive: clear pending inbox target failed', e); }
        setActiveId(created.id);
        setToast('Deal room thread created');
        return;
      }
      setToast('Could not create the thread yet. Check the project/vendor link.');
    }catch(err){
      logError('inbox-create-synced-thread', err, { activeId: active?.id || null });
      setToast('Could not create the thread yet');
    }finally{
      setLoadingConvos(false);
    }
  };

  const openReviewForThread = ()=>{
    if(!nav){ setToast('Navigation unavailable — try reloading.'); return; }
    const { projectId, projectTitle } = getActiveProjectTarget();
    if(projectId || projectId === 0 || projectTitle){
      queueProjectNavigation(nav, { projectId, projectTitle, screen: KB_NAV_SCREENS.activity, returnContext: buildActiveThreadReturnContext() });
      setToast('Opening project activity…');
      return;
    }
    openDealWorkspace();
  };
  const markThreadUnread = useCallback(async(id)=>{
    if(!id) return;
    setConvos(prev=>prev.map(c=>c.id===id?{...c, unread:Math.max(1, Number(c.unread||0))}:c));
    setHeaderMenuOpen(false);
    setToast('Marked unread');
  }, [setToast]);
  const copyThreadLink = useCallback(async(id)=>{
    if(!id || typeof window === 'undefined') return;
    try {
      const url = `${window.location.origin}${window.location.pathname}#inbox-${id}`;
      if(typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) await navigator.clipboard.writeText(url);
      setToast('Thread link copied');
    } catch {
      setToast('Could not copy link');
    } finally {
      setHeaderMenuOpen(false);
    }
  }, [setToast]);
  const dismissNextStrip = ()=>{
    setNextDismissed(true);
    setNextDismissedForConvo(activeId, true);
  };
  const eventActionFor = (event)=>{
    if(!event) return null;
    if(['workspace_sync','project_update','milestone_approved','approval_requested','dispute_opened'].includes(event.kind)) return { label:'Open workspace', onClick:openDealWorkspace };
    return null;
  };
  const handleAttachClick = useCallback(()=>{ if(!uploading) fileInputRef.current?.click(); }, [uploading]);
  const handleFileInputChange = useCallback(async(e)=>{ const file = e.target.files?.[0]; if(file) await handleSendFile(file); }, [handleSendFile]);
  const handleInboxSearchChange = (value = '')=>{
    const next = String(value || '');
    setSearch(next);
    if(next.trim().length < 2){
      setSearchResults([]);
      setSearching(false);
    }
  };

  const searchActive = String(search || '').trim().length >= 2;
  const resetInboxView = () => {
    try {
      setSearch('');
      setSearchResults([]);
      setSearching(false);
      setListFilter('all');
      setHeaderMenuOpen(false);
      setToast('Showing all inbox threads');
    } catch (err) {
      logError('inbox-reset-view', err);
    }
  };
  const sourceConvos = searchActive ? searchResults : convos;
  const visibleConvos=sourceConvos.filter(c=>{
    const q = search.toLowerCase();
    const matches = !q || ((c.name||"").toLowerCase().includes(q) || (c.projectTitle||"").toLowerCase().includes(q) || (c.preview||"").toLowerCase().includes(q));
    if(!matches) return false;
    if(listFilter === "archived") return !!c.archived;
    if(listFilter === "snoozed") return isSnoozedThread(c);
    if(listFilter === "muted") return mutedSet.has(String(c.id));
    // Default All threads should actually show every open/non-archived conversation.
    // Muted and snoozed threads still carry their quiet indicators, but they no
    // longer disappear when the Inbox tab first opens.
    return !c.archived;
  });
  const countsBase=convos.filter(c=>!c.archived);
  function getThreadTimestamp(value){
    const ts = new Date(value || 0).getTime();
    return Number.isFinite(ts) ? ts : 0;
  }
  const nowTs = Date.now();
  const stageCounts = countsBase.reduce((acc,c)=>{
    const state = exactStage(c);
    acc.all += 1;
    if (starredSet.has(String(c.id))) acc.starred += 1;
    if ((c.unread||0)>0) acc.unread += 1;
    if (mutedSet.has(String(c.id))) acc.muted += 1;
    if (isSnoozedThread(c)) acc.snoozed += 1;
    if (state === "resolved") acc.resolved += 1;
    if (state === "inquiry") acc.inquiry += 1;
    if (state === "bid_placed" || state === "bid_under_review") acc.bid += 1;
    if (state === "hired") acc.hired += 1;
    if (["active","milestone_pending","disputed"].includes(state)) acc.active += 1;
    if (state === "completed") acc.completed += 1;
    return acc;
  }, {all:0, starred:0, unread:0, muted:0, snoozed:0, resolved:0, inquiry:0, bid:0, hired:0, active:0, completed:0});
  stageCounts.archived = convos.filter(c=>!!c.archived).length;
  stageCounts.attention = countsBase.filter(c=>{
    const state = exactStage(c);
    return state === 'disputed' || state === 'milestone_pending' || ((Number(c.unread || 0) || 0) > 0 && ['active','hired','bid_under_review','bid_placed'].includes(state));
  }).length;
  stageCounts.approval = countsBase.filter(c=> exactStage(c) === 'milestone_pending').length;
  stageCounts.quiet = countsBase.filter(c=>{
    const state = exactStage(c);
    if(!['active','milestone_pending','hired'].includes(state)) return false;
    const ts = getThreadTimestamp(c.lastMessageAt);
    if(!ts) return false;
    const idleHours = (nowTs - ts) / 36e5;
    return idleHours >= 96;
  }).length;
  stageCounts.assigned = countsBase.filter(c=> !!getAssignmentForConvo(c.id)).length;
  stageCounts.drafted = countsBase.filter(c=> !!getStoredDraft(c.id)).length;
  stageCounts.pinned = countsBase.filter(c=> !!getPinnedRecordForConvo(c.id)).length;

  const filtered=visibleConvos.filter(c=>{
    const state = exactStage(c);
    const unread = Number(c.unread || 0) || 0;
    const hasAssignment = !!getAssignmentForConvo(c.id);
    const hasDraft = !!getStoredDraft(c.id);
    const hasPinned = !!getPinnedRecordForConvo(c.id);
    const lastTs = getThreadTimestamp(c.lastMessageAt);
    const idleHours = lastTs ? ((nowTs - lastTs) / 36e5) : null;
    if(listFilter==="archived") return !!c.archived;
    if(listFilter==="starred") return starredSet.has(String(c.id));
    if(listFilter==="unread") return unread>0;
    if(listFilter==="snoozed") return isSnoozedThread(c);
    if(listFilter==="muted") return mutedSet.has(String(c.id));
    if(listFilter==="resolved") return state === "resolved";
    if(listFilter==="attention") return state === 'disputed' || state === 'milestone_pending' || (unread > 0 && ['active','hired','bid_under_review','bid_placed'].includes(state));
    if(listFilter==="approval") return state === 'milestone_pending';
    if(listFilter==="quiet") return ['active','milestone_pending','hired'].includes(state) && idleHours !== null && idleHours >= 96;
    if(listFilter==="assigned") return hasAssignment;
    if(listFilter==="drafted") return hasDraft;
    if(listFilter==="pinned") return hasPinned;
    if(listFilter==="inquiry") return state === "inquiry";
    if(listFilter==="bid") return state === "bid_placed" || state === "bid_under_review";
    if(listFilter==="hired") return state === "hired";
    if(listFilter==="active") return ["active","milestone_pending","disputed"].includes(state);
    if(listFilter==="completed") return state === "completed";
    return true;
  });
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayTs = todayStart.getTime();
  const yesterdayTs = todayTs - 86400000;
  const weekTs = todayTs - (86400000 * 6);

  const getThreadPriorityMeta = (c = {})=>{
    const state = exactStage(c);
    const unread = Number(c?.unread || 0) || 0;
    const starred = starredSet.has(String(c?.id));
    const hasDraft = !!getStoredDraft(c?.id);
    const pinned = !!getPinnedRecordForConvo(c?.id);
    const assigned = !!getAssignmentForConvo(c?.id);
    const lastTs = getThreadTimestamp(c?.lastMessageAt);
    const idleHours = lastTs ? ((nowTs - lastTs) / 36e5) : null;
    const staleActive = ['active','milestone_pending','hired','bid_under_review','bid_placed'].includes(state) && idleHours !== null && idleHours >= 72;
    const quiet = ['active','milestone_pending','hired'].includes(state) && idleHours !== null && idleHours >= 96;
    let score = 0;
    let label = 'Open thread';
    let reason = 'Keep the conversation moving when the next decision is clear.';
    let tone = { bg:'rgba(20,21,24,0.045)', border:'rgba(20,21,24,0.08)', color:'#3a3c44' };
    if(state === 'disputed'){
      score = 96;
      label = 'At risk';
      reason = 'An open issue needs follow-through in the deal room.';
      tone = { bg:'rgba(197,48,48,0.08)', border:'rgba(197,48,48,0.14)', color:'#C53030' };
    } else if(state === 'milestone_pending'){
      score = 90;
      label = 'Approval due';
      reason = 'A milestone is waiting on a clean decision or response.';
      tone = { bg:'rgba(43,108,176,0.08)', border:'rgba(43,108,176,0.14)', color:'#2B6CB0' };
    } else if(unread > 0 && ['active','hired','bid_under_review','bid_placed'].includes(state)){
      score = 84;
      label = 'Needs reply';
      reason = `${unread} unread update${unread === 1 ? '' : 's'} on a live deal thread.`;
      tone = { bg:'rgba(176,136,64,0.1)', border:'rgba(176,136,64,0.16)', color:'#8A6729' };
    } else if(hasDraft){
      score = 76;
      label = 'Draft in progress';
      reason = 'A draft is already started here — finish the follow-through.';
      tone = { bg:'rgba(176,136,64,0.1)', border:'rgba(176,136,64,0.16)', color:'#8A6729' };
    } else if(staleActive){
      score = 72;
      label = 'Needs follow-up';
      reason = 'This deal has gone quiet and should get a clear next-step note.';
      tone = { bg:'rgba(15,23,42,0.05)', border:'rgba(15,23,42,0.09)', color:'#334155' };
    } else if(starred || pinned){
      score = 64;
      label = 'Priority';
      reason = pinned ? 'A record item is pinned here for follow-through.' : 'Starred to stay visible while the decision stays open.';
      tone = { bg:'rgba(176,136,64,0.1)', border:'rgba(176,136,64,0.16)', color:'#8A6729' };
    } else if(state === 'bid_under_review' || state === 'bid_placed'){
      score = 58;
      label = 'Review pending';
      reason = 'A proposal thread is still open and should stay crisp.';
      tone = { bg:'rgba(43,108,176,0.08)', border:'rgba(43,108,176,0.14)', color:'#2B6CB0' };
    } else if(unread > 0){
      score = 54;
      label = 'Unread';
      reason = `${unread} unread message${unread === 1 ? '' : 's'} waiting in this thread.`;
      tone = { bg:'rgba(20,21,24,0.045)', border:'rgba(20,21,24,0.08)', color:'#3a3c44' };
    } else if(lastTs >= yesterdayTs){
      score = 26;
      label = 'Recently active';
      reason = 'Recent activity is already on record here.';
      tone = { bg:'rgba(20,21,24,0.04)', border:'rgba(20,21,24,0.07)', color:'#3a3c44' };
    }
    if(starred) score += 4;
    if(pinned) score += 3;
    if(assigned) score += 2;
    if(unread >= 3) score += 3;
    return {
      score,
      label,
      reason,
      tone,
      quiet,
      starred,
      pinned,
      hasDraft,
      unread,
      assigned,
      staleActive,
      needsAttention: score >= 70,
      needsReview: score >= 58,
    };
  };

  const getThreadPriorityScore = (c = {})=> getThreadPriorityMeta(c).score;
  const orderedFiltered = [...filtered].sort((a,b)=>{
    const priorityDelta = getThreadPriorityScore(b) - getThreadPriorityScore(a);
    if(priorityDelta !== 0) return priorityDelta;
    const starDelta = Number(starredSet.has(String(b.id))) - Number(starredSet.has(String(a.id)));
    if(starDelta !== 0) return starDelta;
    return new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime();
  });

  const threadPriorityById = orderedFiltered.reduce((acc, c)=>{
    acc[String(c.id)] = getThreadPriorityMeta(c);
    return acc;
  }, {});

  const orderedFilteredIds = orderedFiltered.map(c=>String(c.id)).join('|');

  useEffect(()=>{
    if(loadingConvos || dealRoomsHubOpen) return;
    const nextVisibleId = orderedFiltered[0]?.id ?? null;
    const activeStillVisible = activeId != null && orderedFiltered.some(c=>String(c.id)===String(activeId));

    // Mobile must behave like a real inbox: start on the conversation list,
    // open a thread only after the user taps it, and stay on the list after
    // Back. The previous desktop auto-select behavior immediately reopened
    // the first visible conversation after Back set activeId(null).
    if(isMobileInbox){
      if(activeId == null) return;
      if(activeStillVisible) return;
      setActiveId(null);
      return;
    }

    // Desktop keeps the old split-pane convenience behavior only when there
    // is no explicit navigation target and the user has not intentionally
    // returned to the Inbox list.
    if(activeId == null){
      const pending = typeof getPendingInboxTarget === 'function' ? getPendingInboxTarget() : null;
      const pendingHasContext = pending && (pending.conversationId || pending.projectId || pending.projectTitle || pending.vendorId || pending.churchId);
      if(pendingHasContext || suppressDesktopAutoSelectRef.current) return;
      if(nextVisibleId != null){
        setActiveId(prev => String(prev ?? '') === String(nextVisibleId ?? '') ? prev : nextVisibleId);
      }
      return;
    }
    if(activeStillVisible) return;
    setActiveId(prev => {
      const normalizedNext = nextVisibleId ?? null;
      return String(prev ?? '') === String(normalizedNext ?? '') ? prev : normalizedNext;
    });
  }, [loadingConvos, activeId, orderedFilteredIds, isMobileInbox, dealRoomsHubOpen]);

  const groupedThreads = (()=>{
    const sections = [
      { label:'Needs attention', items:[] },
      { label:'Today', items:[] },
      { label:'Yesterday', items:[] },
      { label:'Earlier this week', items:[] },
      { label:'Earlier', items:[] },
    ];
    orderedFiltered.forEach(c=>{
      const priority = threadPriorityById[String(c.id)] || getThreadPriorityMeta(c);
      const ts = getThreadTimestamp(c.lastMessageAt);
      if(priority.needsAttention) sections[0].items.push(c);
      else if(ts >= todayTs) sections[1].items.push(c);
      else if(ts >= yesterdayTs) sections[2].items.push(c);
      else if(ts >= weekTs) sections[3].items.push(c);
      else sections[4].items.push(c);
    });
    return sections.filter(section => section.items.length > 0);
  })();

  const threadTriageCards = [
    { key:'attention', label:'Needs attention', value:orderedFiltered.filter(c => (threadPriorityById[String(c.id)] || {}).needsAttention).length, sub:'Reply, approve, or resolve now.' },
    { key:'unread', label:'Unread updates', value:orderedFiltered.reduce((sum, c) => sum + (Number(c.unread || 0) || 0), 0), sub:'Messages still waiting in open threads.' },
    { key:'quiet', label:'Quiet deals', value:orderedFiltered.filter(c => (threadPriorityById[String(c.id)] || {}).quiet).length, sub:'Active work that has gone quiet.' },
  ];
  const dealRoomHubItems=useMemo(()=>dealRoomHubProjects.map(project=>{
    const canonicalConvo=convos.find(c=>String(c.projectId??'')===String(project.id??'') &&
      String(c.vendorId??'')===String(project.hired_vendor_id??'') &&
      (!project.church_id || !c.churchId || String(c.churchId)===String(project.church_id)))||null;
    const acceptedAmount=Number(project.hired_bid_amount||0)||0;
    const acceptedTimeline=project.hired_bid_timeline||project.timeline||'';
    return {project,convo:canonicalConvo,
      counterparty:role==='vendor'?(project.church_name||canonicalConvo?.name||'Church'):(project.hired_vendor_name||canonicalConvo?.name||'Hired vendor'),
      unread:Number(canonicalConvo?.unread||0)||0,
      amountLabel:acceptedAmount>0?formatMoney(acceptedAmount):(project.budget||acceptedTimeline||'Project record'),
      acceptedTimeline,
      statusMeta:getCanonicalDealRoomStatus(project),
      nextMeta:getCanonicalDealRoomNextAction(project,role),
      attentionMeta:getCanonicalDealRoomAttentionMeta(project,role)};
  }),[dealRoomHubProjects,convos,role]);
  const activeDealRoomHubItems=useMemo(()=>dealRoomHubItems.filter(i=>['hired','in_progress'].includes(String(i.project?.status||'').toLowerCase())),[dealRoomHubItems]);
  const completedDealRoomHubItems=useMemo(()=>dealRoomHubItems.filter(i=>String(i.project?.status||'').toLowerCase()==='completed'),[dealRoomHubItems]);
  const dealRoomSwitcherItems=useMemo(()=>[
    ...activeDealRoomHubItems.filter(item=>item?.convo?.id),
    ...completedDealRoomHubItems.filter(item=>item?.convo?.id),
  ],[activeDealRoomHubItems,completedDealRoomHubItems]);
  const switchExactDealRoom=useCallback(async(item)=>{
    const exactConversationId=item?.convo?.id;
    if(!exactConversationId)return;
    await handleSelect(exactConversationId);
  },[handleSelect]);
  const canonicalHubConversationIds=useMemo(()=>new Set(dealRoomHubItems.map(i=>i.convo?.id).filter(Boolean).map(String)),[dealRoomHubItems]);
  const preHireHubConversations=useMemo(()=>orderedFiltered.filter(c=>!c.archived&&!canonicalHubConversationIds.has(String(c.id))),[orderedFilteredIds,canonicalHubConversationIds]);

  const openHubRoom=useCallback(async(item)=>{
    const project=item?.project;
    if(!project?.id||!currentUser?.id)return;
    if(item?.convo?.id){ await handleSelect(item.convo.id); return; }
    const target={projectId:project.id,projectTitle:project.title||null,churchId:project.church_id||null,churchName:project.church_name||null,
      vendorId:project.hired_vendor_id||null,vendorName:project.hired_vendor_name||null,viewerRole:role==='vendor'?'vendor':'church',
      createIfMissing:true,initialMessage:'Conversation started'};
    if(!canCreateInboxConversation(target,target.viewerRole)){ setToast('This Deal Room is missing a participant link. Open the project record to review it.'); return; }
    try{
      setLoadingConvos(true);
      const created=await ensureInboxConversation(currentUser,target);
      if(!created?.id)throw new Error('conversation not created');
      const mapped=mapConversationRow(created,currentUser.id,{});
      setConvos(prev=>mergeConversationRows(prev.filter(c=>!c.isSynthetic),[mapped]));
      setDealRoomsHubOpen(false); await handleSelect(created.id);
    }catch(err){ logError('deal-rooms-hub-open-room',err,{projectId:project.id}); setToast('Could not open this Deal Room yet.'); }
    finally{ setLoadingConvos(false); }
  },[currentUser?.id,role,handleSelect]);
  const openHubConversation=useCallback(async(convo)=>{ if(convo?.id)await handleSelect(convo.id); },[handleSelect]);


  const inboxFilterLabel = (filter)=>{
    if(filter==='all') return 'All threads';
    if(filter==='starred') return 'Starred';
    if(filter==='unread') return 'Unread';
    if(filter==='attention') return 'Needs attention';
    if(filter==='approval') return 'Approval due';
    if(filter==='quiet') return 'Quiet deals';
    if(filter==='assigned') return 'Assigned to me';
    if(filter==='drafted') return 'Drafts in progress';
    if(filter==='pinned') return 'Pinned record';
    if(filter==='archived') return 'Archived';
    if(filter==='snoozed') return 'Snoozed';
    if(filter==='muted') return 'Muted';
    if(filter==='resolved') return 'Resolved';
    if(filter==='bid') return 'Bid placed';
    return filter.charAt(0).toUpperCase()+filter.slice(1);
  };

  const railFocusCards = [
    { key:'attention', eyebrow:'Needs attention', value:stageCounts.attention, sub:'Reply, approve, or resolve.', accent:'#8A6729' },
    { key:'quiet', eyebrow:'Quiet deals', value:stageCounts.quiet, sub:'Active work that has gone quiet.', accent:'#334155' },
    { key:'assigned', eyebrow:'Assigned to me', value:stageCounts.assigned, sub:'Threads with a named owner.', accent:'#2B6CB0' },
    { key:'drafted', eyebrow:'Drafts in progress', value:stageCounts.drafted, sub:'Threads where follow-through started.', accent:'#8A6729' },
  ];

  const operatorViewItems = [
    {k:'attention', label:'Needs attention', count:stageCounts.attention, color:'#8A6729'},
    {k:'approval', label:'Approval due', count:stageCounts.approval, color:'#2B6CB0'},
    {k:'quiet', label:'Quiet deals', count:stageCounts.quiet, color:'#334155'},
    {k:'assigned', label:'Assigned to me', count:stageCounts.assigned, color:'#2B6CB0'},
    {k:'drafted', label:'Drafts in progress', count:stageCounts.drafted, color:'#b08840'},
    {k:'pinned', label:'Pinned record', count:stageCounts.pinned, color:'#1C2814'},
  ];

  const primaryViewItems = [
    {k:'all', label:'All threads', count:stageCounts.all, color:'#1C2814'},
    {k:'starred', label:'Starred', count:stageCounts.starred, color:'#b08840'},
    {k:'unread', label:'Unread', count:stageCounts.unread, color:'#b08840'},
    {k:'snoozed', label:'Snoozed', count:stageCounts.snoozed, color:'#b7791f'},
    {k:'muted', label:'Muted', count:stageCounts.muted, color:'#858792'},
    {k:'archived', label:'Archived', count:stageCounts.archived, color:'#b5b7bf'}
  ];

  const stageViewItems = [
    {k:'inquiry', label:'Inquiry', count:stageCounts.inquiry, color:'#b7791f'},
    {k:'bid', label:'Bid placed', count:stageCounts.bid, color:'#2b6cb0'},
    {k:'hired', label:'Hired', count:stageCounts.hired, color:'#b08840'},
    {k:'active', label:'Active', count:stageCounts.active, color:'#2f855a'},
    {k:'completed', label:'Completed', count:stageCounts.completed, color:'#b5b7bf'},
    {k:'resolved', label:'Resolved', count:stageCounts.resolved, color:'#b5b7bf'}
  ];

  const activeRailNote = listFilter === 'attention'
    ? 'Use this to clear the threads that are most likely to stall work or delay a decision.'
    : listFilter === 'approval'
      ? 'Milestone approvals should stay crisp so the deal room keeps moving forward.'
      : listFilter === 'quiet'
        ? 'Quiet active deals need a short, decisive next-step note before momentum slips.'
        : listFilter === 'assigned'
          ? 'These are the conversations with an owner already attached for follow-through.'
          : listFilter === 'drafted'
            ? 'Finish these first — the draft signal usually means the thinking is already done.'
            : listFilter === 'pinned'
              ? 'Pinned records are usually the threads with the strongest memory or decision context.'
              : 'Switch between views, urgency buckets, and deal stages without losing your place.';

  const mobileQuickViewItems = [
    { key:'attention', label:'Attention', count:stageCounts.attention },
    { key:'all', label:'All', count:stageCounts.all },
    { key:'assigned', label:'Assigned', count:stageCounts.assigned },
    { key:'unread', label:'Unread', count:stageCounts.unread },
    { key:'quiet', label:'Quiet', count:stageCounts.quiet },
  ];

  const stageColor = (state)=>{
    if(state === "inquiry") return '#b7791f';
    if(state === "bid_placed" || state === "bid_under_review") return '#2b6cb0';
    if(state === "hired") return '#b08840';
    if(["active","milestone_pending","disputed"].includes(state)) return '#2f855a';
    if(state === 'resolved') return '#b5b7bf';
    return '#b5b7bf';
  };
  const stageLabel = getDealStageLabel;

  const threadBudget = (c)=>{
    if(active && c.id===active.id && dealMeta?.bidValue) return moneyLabel(dealMeta.bidValue);
    if(active && c.id===active.id && dealMeta?.budgetValue) return moneyLabel(dealMeta.budgetValue);
    const fallbackAmount = Number(c?.amount || c?.budget || 0) || 0;
    return fallbackAmount ? moneyLabel(fallbackAmount) : '—';
  };

  const threadProject = active && active.projectId ? (dealMeta?.project?.title || active.projectTitle || '') : (active?.projectTitle || '');
  const threadChurch = active && active.type === 'vendor' ? (dealMeta?.project?.church_name || active.name) : active?.name;
  const threadSub = active ? `${threadChurch || 'Church'}${dealMeta?.project?.city ? ` · ${dealMeta.project.city}` : ''}` : '';
  const pinnedRecord = active ? getPinnedRecordForConvo(active.id) : null;
  const failedPending = pendingMessages.filter(m=>m.failed);
  const assignmentLabel = active ? getAssignmentForConvo(active.id) : '';
  const activeProjectSaveId = active?.projectId || dealMeta?.project?.id || null;
  const activeProjectIsSaved = activeProjectSaveId ? inboxSavedProjectIds.has(String(activeProjectSaveId)) : false;
  const continuityActions = active ? [
    { label:'Project', onClick:openDealWorkspace },
    { label:'Activity', onClick:openActivityForThread },
    { label:'Files', onClick:openLatestFile },
    { label: active?.type === 'vendor' ? 'Vendor profile' : 'Project board', onClick:openCounterpartyProfile },
    { label:`Stage · ${stageLabel(activeDealState)}`, onClick:focusStageLane },
    { label: activeProjectIsSaved ? 'Saved' : 'Save deal', onClick:toggleSaveProxy, active:activeProjectIsSaved },
  ] : [];
  const deliverableCount = Array.isArray(dealMeta?.workspace?.deliverables) ? dealMeta.workspace.deliverables.length : 0;
  const milestoneCount = Array.isArray(dealMeta?.milestones) ? dealMeta.milestones.length : 0;
  const completedMilestoneCount = Array.isArray(dealMeta?.milestones) ? dealMeta.milestones.filter(item => item?.done).length : 0;
  const workspacePhaseLabel = PROJECT_PHASES.find(item => item.key === dealMeta?.workspace?.phase)?.label || 'Kickoff';
  const workspaceSummary = dealMeta?.workspace?.nextAction || activeSummary?.body || 'Use the inbox command center to move the next decision forward.';
  const openDisputesCount = Number(dealMeta?.openDisputes || 0) || 0;
  const quickActionChips = useMemo(()=>{
    const source = [activeActionSet?.primary, activeActionSet?.secondary, ...(activeActionSet?.workflow || [])].filter(Boolean);
    const seen = new Set();
    return source.filter(item=>{
      const key = `${item?.label || ''}::${item?.template || ''}`;
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0,5);
  }, [activeActionSet]);
  const sharedFileCount = messages.filter(m=>m.type==='file').length + pendingMessages.filter(m=>m.type==='file').length;
  const latestSharedFile = [...messages, ...pendingMessages].filter(m=>m.type==='file').slice(-1)[0] || null;
  const mobileThreadGlancePills = active ? [
    stageLabel(activeDealState),
    threadBudget(active),
    dealMeta?.project?.timeline ? `Timeline · ${dealMeta.project.timeline}` : null,
    dealMeta?.nextMilestone?.title ? `Milestone · ${dealMeta.nextMilestone.title}` : null,
    sharedFileCount ? `${sharedFileCount} file${sharedFileCount === 1 ? '' : 's'}` : null,
  ].filter(Boolean).slice(0,5) : [];
  const workspaceReturnTarget = getReturnNavigationTarget(workspaceReturnContext, 'projects');
  const relatedProjectId = active?.projectId || dealMeta?.project?.id || null;
  const workspaceResumeActions = active ? [
    { key:'workspace', label:'Open workspace', onClick: openDealWorkspace },
    { key:'activity', label:'Activity', onClick: openActivityForThread },
    { key:'files', label:'Files', onClick: openLatestFile },
    { key:'profile', label: active?.type === 'vendor' ? 'Vendor profile' : 'Project board', onClick: openCounterpartyProfile },
  ] : [];
  const workspaceResumeCopy = activeDealState === 'milestone_pending'
    ? 'Use the inbox command center to approve the current milestone and keep execution moving.'
    : activeDealState === 'completed'
      ? 'Use the inbox command center as the final record for closeout, files, and handoff.'
      : 'Use the inbox as the operating center for the current conversation.';
  const dealOverviewCards = active ? [
    { key:'proposal', label:'Proposal', value: moneyLabel(dealMeta?.bidValue || dealMeta?.budgetValue), sub: dealMeta?.linkedBid?.timeline || dealMeta?.project?.timeline || 'Timing TBD' },
    { key:'stage', label:'Stage', value: stageLabel(activeDealState), sub: activeSummary?.eyebrow || 'Deal state' },
    { key:'workspace', label:'Workspace', value: workspacePhaseLabel, sub: dealMeta?.workspace?.nextAction ? 'Next step captured' : 'No next step saved yet' },
    { key:'files', label:'Files', value: sharedFileCount ? `${sharedFileCount}` : '0', sub: latestSharedFile?.fileName || 'No files shared yet' },
  ] : [];
  const closeoutStatusLabel = activeSummary?.body || 'Keep the next decision moving through the inbox command center.';
  const snoozedUntil = active ? getSnoozedUntil(active.id) : '';
  const primaryDealAction = active ? (() => {
    if (activeDealState === 'milestone_pending' && dealMeta?.nextMilestone) {
      return { label: 'Approve milestone', onClick: approveCurrentMilestone, tone: 'success' };
    }
    if (activeActionSet?.primary?.template || activeSummary?.nextActionTemplate) {
      return { label: activeActionSet?.primary?.label || activeSummary?.nextActionLabel || 'Use prompt', onClick: handleQuickPrompt, tone: 'navy' };
    }
    return { label: activeSummary?.nextActionLabel || 'Open workspace', onClick: openDealWorkspace, tone: 'muted' };
  })() : null;
  const threadUtilitySections = active ? [
    {
      key:'execution',
      title:'Execution snapshot',
      rows:[
        { label:'Next move', value: primaryDealAction?.label || nextLabel },
        { label:'Milestones', value: milestoneCount ? `${completedMilestoneCount}/${milestoneCount} complete` : 'Not mapped yet' },
        { label:'Approvals / disputes', value: openDisputesCount ? `${openDisputesCount} open` : (activeDealState === 'milestone_pending' ? 'Approval due' : 'Clear') },
        { label:'Deliverables', value: deliverableCount ? `${deliverableCount} tracked` : 'No deliverables yet' },
      ],
    },
    {
      key:'continuity',
      title:'Continuity',
      rows:[
        { label:'Pinned record', value: pinnedRecord?.text ? pinnedRecord.text : 'Nothing pinned yet' },
        { label:'Owner', value: assignmentLabel || 'Unassigned' },
        { label:'Last viewed', value: getLastViewedLabel(active.id) },
        snoozedUntil ? { label:'Snoozed until', value: new Date(snoozedUntil).toLocaleString([], { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }) } : null,
      ].filter(Boolean),
    },
  ] : [];
  const threadUtilityControls = active ? [
    { key:'activity', label:'Open activity', onClick: openActivityForThread },
    { key:'reply', label:'Reply', onClick: () => {
      if (active?.archived) { setToast('Restore this deal before replying.'); return; }
      if (active?.isSynthetic) { setToast('Create the thread before replying.'); return; }
      composerRef.current?.focus();
    } },
  ] : [];
  const executionActionCards = active ? quickActionChips.slice(0,3).map((item, idx) => ({
    key:`${item?.label || 'action'}-${idx}`,
    label:item?.label || 'Use prompt',
    body:item?.template || 'Open a guided response prompt for this stage.',
    onClick:() => {
      if (item?.template) populateDealPrompt(item.template);
      else openDealWorkspace();
    },
  })) : [];
  const dealPanelSummaryChips = active ? [
    active?.type === 'vendor' ? 'Vendor thread' : 'Church thread',
    relatedProjectId ? `Project #${String(relatedProjectId).slice(0,8)}` : null,
    threadSub || null,
  ].filter(Boolean).slice(0,3) : [];
  const dealPanelTabs = [];
  const dealPanelPrimaryLabel = active ? 'Reply' : '';
  const headerPrimaryAction = active ? { label: 'Reply', onClick: () => composerRef.current?.focus(), tone: 'navy' } : null;
  const composerAssistOptions = [];
  const emptyThreadModel = {
    title: active?.isSynthetic ? 'Pending conversation' : 'No messages yet',
    body: active?.isSynthetic
      ? 'This deal is linked to project context, but the real conversation has not synced yet.'
      : active?.projectId ? 'Start the conversation here and keep the next step tied to the deal.' : 'Start the conversation here. This thread is not linked to a project workspace yet, so keep the first message specific.',
    actions: [
      active?.isSynthetic ? { key:'create-thread', label:'Create thread', tone:'primary', onClick:createSyncedThreadFromActive } : { key: 'reply', label: 'Write first message', tone: 'primary', onClick: () => { try { composerRef.current?.focus?.(); } catch {} } },
      active?.projectId ? { key: 'project', label: 'Open workspace', tone: 'secondary', onClick: openDealWorkspace } : null,
      !active?.projectId ? { key: 'projects', label: 'Open my projects', tone: 'secondary', onClick: () => { try { nav(role === 'vendor' ? 'my-work' : 'my-projects'); } catch (err) { logError('inbox-empty-open-projects', err); } } } : null,
    ].filter(Boolean),
  };
  const threadRoleGuidance = active ? (()=>{
    const viewerIsVendor = role === 'vendor';
    const state = activeDealState || 'inquiry';
    if(active?.archived){
      return {
        eyebrow:'Read-only record',
        title:'Restore this deal before replying.',
        body:'Archived conversations stay available for context, but messages and files are locked until the conversation is restored.',
        primaryLabel:'Restore deal',
        primaryAction:async()=>{ await restoreConvo(active.id); setToast('Deal restored'); },
        secondaryLabel:'Open activity',
        secondaryAction:openActivityForThread,
      };
    }
    if(state === 'milestone_pending'){
      return viewerIsVendor
        ? { eyebrow:'Waiting on approval', title:'Keep the approval easy to act on.', body:'The best next move is a short note that confirms what was delivered and what decision is needed.', primaryLabel:'Draft approval note', primaryAction:handleQuickPrompt, secondaryLabel:'Milestones', secondaryAction:()=>setDealPanelTab('milestones') }
        : { eyebrow:'Approval needed', title:'Review the milestone and respond clearly.', body:'Approve, ask for a revision, or leave a precise note so the vendor knows the next step.', primaryLabel:'Review milestone', primaryAction:()=>setDealPanelTab('milestones'), secondaryLabel:'Draft reply', secondaryAction:handleQuickPrompt };
    }
    if(state === 'bid_placed' || state === 'bid_under_review'){
      return viewerIsVendor
        ? { eyebrow:'Proposal live', title:'Follow up without burying the bid.', body:'Use a concise scope or timing note to keep the church moving toward a decision.', primaryLabel:'Draft follow-up', primaryAction:handleQuickPrompt, secondaryLabel:'View proposal', secondaryAction:()=>setDealPanelTab('proposal') }
        : { eyebrow:'Proposal review', title:'Compare the proposal, then reply with a decision path.', body:'Ask one clear question, request a revision, or move the bid toward hire/decline.', primaryLabel:'View proposal', primaryAction:()=>setDealPanelTab('proposal'), secondaryLabel:'Draft question', secondaryAction:handleQuickPrompt };
    }
    if(['hired','active'].includes(state)){
      return viewerIsVendor
        ? { eyebrow:'Execution thread', title:'Send progress that creates confidence.', body:'Anchor each update around what changed, what is ready, and what you need from the church.', primaryLabel:'Draft progress update', primaryAction:handleQuickPrompt, secondaryLabel:'Open workspace', secondaryAction:openDealWorkspace }
        : { eyebrow:'Execution thread', title:'Keep the project moving with one clear next step.', body:'Use the thread for approvals, file requests, timing changes, and vendor decisions.', primaryLabel:'Draft next step', primaryAction:handleQuickPrompt, secondaryLabel:'Open workspace', secondaryAction:openDealWorkspace };
    }
    if(state === 'completed' || state === 'resolved'){
      return { eyebrow:'Closeout record', title:'This thread is now the final project memory.', body:'Use it to review files, final notes, and handoff context without reopening unnecessary work.', primaryLabel:'Open files', primaryAction:openLatestFile, secondaryLabel:'Open activity', secondaryAction:openActivityForThread };
    }
    return viewerIsVendor
      ? { eyebrow:'New church thread', title:'Clarify scope before you over-send.', body:'Ask for the missing details that affect price, timeline, or fit before pushing too hard.', primaryLabel:'Draft clarification', primaryAction:handleQuickPrompt, secondaryLabel:'Open project', secondaryAction:openDealWorkspace }
      : { eyebrow:'New vendor thread', title:'Give the vendor a clean path to a strong proposal.', body:'Share the outcome, timing, budget context, and any files needed to quote accurately.', primaryLabel:'Draft scope note', primaryAction:handleQuickPrompt, secondaryLabel:'Open project', secondaryAction:openDealWorkspace };
  })() : null;

  const groupedMessages = useMemo(()=>{
    const merged = [...messages, ...pendingMessages].sort((a,b)=> new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    const groups = [];
    let currentKey = null;
    merged.forEach((m)=>{
      const d = m.createdAt ? new Date(m.createdAt) : null;
      const key = d ? d.toDateString() : 'Today';
      if(key !== currentKey){ currentKey = key; groups.push({ label: groups.length===0 ? 'Today' : d ? d.toLocaleDateString([], { month:'short', day:'numeric' }) : 'Earlier', items: [] }); }
      groups[groups.length-1].items.push(m);
    });
    return groups.length ? groups : [{ label:'Today', items: [] }];
  }, [messages, pendingMessages]);

  const getSystemEventTone = (severity = 'info') => {
    if (severity === 'success') return { accent:'#2F855A', bg:'rgba(47,133,90,0.08)', border:'rgba(47,133,90,0.18)', ink:'#1F5137' };
    if (severity === 'gold') return { accent:'#B08840', bg:'rgba(176,136,64,0.10)', border:'rgba(176,136,64,0.20)', ink:'#8A6729' };
    if (severity === 'danger') return { accent:'#C53030', bg:'rgba(197,48,48,0.08)', border:'rgba(197,48,48,0.18)', ink:'#7F1D1D' };
    return { accent:'#2B6CB0', bg:'rgba(43,108,176,0.08)', border:'rgba(43,108,176,0.18)', ink:'#1E4E86' };
  };
  const getMessageSurfaceMeta = (message = {}) => {
    const textValue = String(message?.text || '');
    const isFile = message?.type === 'file';
    const recordAffecting = isFile || isWorkspaceAffectingMessageText(textValue);
    const mentionsApproval = /approval|approve|milestone/i.test(textValue);
    const chips = [];
    if (isFile) chips.push('Attachment');
    else chips.push(recordAffecting ? 'Project record' : 'Message');
    if (mentionsApproval) chips.push('Needs review');
    if (message?.pending) chips.push(isFile ? 'Uploading…' : 'Sending…');
    if (message?.failed) chips.push('Needs retry');
    const eyebrow = isFile ? 'Shared file' : mentionsApproval ? 'Decision note' : recordAffecting ? 'Recorded update' : 'Conversation';
    const footnote = isFile
      ? 'Files stay attached to the thread and project record.'
      : mentionsApproval
        ? 'Use this note to keep approvals and next-step decisions easy to track.'
        : recordAffecting
          ? 'This message supports the project record for handoff, review, and continuity.'
          : '';
    const accent = message?.failed ? '#C53030' : isFile ? '#8A6729' : mentionsApproval ? '#2B6CB0' : recordAffecting ? '#2F855A' : '#5B6472';
    return { chips: chips.slice(0, 3), eyebrow, footnote, accent, recordAffecting, mentionsApproval, isFile };
  };

  const insertDraftTemplate = (template = '', { replace = false } = {})=>{
    const nextTemplate = String(template || '').trim();
    if(!nextTemplate) return;
    setDraft(prev=>{
      const current = String(prev || '').trim();
      if(replace || !current) return nextTemplate;
      if(current.includes(nextTemplate)) return current;
      return `${current}\n\n${nextTemplate}`;
    });
    requestAnimationFrame(()=>composerRef.current?.focus());
  };
  const composerIntentPills = active ? [
    activeActionSet?.primary ? { label:activeActionSet.primary.label, template:activeActionSet.primary.template, accent:'#B08840' } : null,
    activeActionSet?.secondary ? { label:activeActionSet.secondary.label, template:activeActionSet.secondary.template, accent:'#2B6CB0' } : null,
    ['hired','active','milestone_pending'].includes(activeDealState)
      ? { label:'Progress update', template:'Quick update:\n• Progress since last note:\n• What is ready now:\n• What is needed next:\n• Timing for the next milestone:', accent:'#2F855A' }
      : { label:'Scope clarification', template:'Quick clarification so we stay aligned:\n• Deliverables:\n• Timeline:\n• Open question:\n• Best next step:', accent:'#2B6CB0' },
    dealMeta?.nextMilestone
      ? { label:'Approval note', template:`I reviewed ${dealMeta.nextMilestone.title}${dealMeta.nextMilestone.amount ? ` (${moneyLabel(dealMeta.nextMilestone.amount)})` : ''}. Here is my decision and any final note before we move forward:`, accent:'#2F855A' }
      : { label:'File request', template:'Could you share the exact files or deliverables here so the project record stays complete?', accent:'#8A6729' },
    activeDealState === 'completed'
      ? { label:'Closeout note', template:'Thank you again for wrapping this up. I am confirming the final handoff, files, and any last closeout details here for the record.', accent:'#141518' }
      : { label:'Next-step recap', template:'Here is the clean next-step recap so nothing gets lost:\n• Owner:\n• Next action:\n• Timing:\n• Files or approvals needed:', accent:'#141518' },
  ].filter(Boolean) : [];
  const composerStatusChips = active ? [
    activeDealState ? stageLabel(activeDealState) : null,
    nextLabel,
    dealMeta?.workspace?.phase ? `Workspace · ${String(dealMeta.workspace.phase).replace(/_/g,' ')}` : null,
    dealMeta?.nextMilestone?.title ? `Milestone · ${dealMeta.nextMilestone.title}` : null,
  ].filter(Boolean).slice(0,4) : [];
  const composerMetaChips = [
    draft.trim() ? `${draft.trim().length} chars` : 'Start with a clear next step',
    uploading ? 'Uploading file to thread…' : 'Files land directly in the thread record',
    'In-app alerts live',
    'Email alerts prelaunch',
  ];
  const composerSendLabel = uploading
    ? 'Uploading…'
    : activeDealState === 'milestone_pending'
      ? 'Send approval note'
      : activeDealState === 'completed'
        ? 'Send closeout note'
        : ['hired','active'].includes(activeDealState)
          ? 'Send update'
          : 'Send message';
  const broadcastTyping = useCallback(()=>{
    const ch = typingChanRef.current;
    const uid = curRef.current?.id;
    if (!ch || !uid) return;
    const now = Date.now();
    // Throttle: only broadcast every 1.5 seconds while user is actively typing
    if (now - typingSendTsRef.current < 1500) return;
    typingSendTsRef.current = now;
    try {
      ch.send({ type:'broadcast', event:'typing', payload:{ user_id: uid, ts: now } });
    } catch(e) { logError("typing-broadcast", e); }
  }, []);
  const sendCurrentDraft = useCallback(async()=>{
    const text = draft.trim();
    if(!text) return;
    // Reset throttle so the next keystroke broadcasts immediately
    typingSendTsRef.current = 0;
    const ok = await handleSend(text);
    if(ok){ setDraft(""); saveStoredDraft(activeId, ""); }
  }, [activeId, draft, handleSend, saveStoredDraft]);
  const handleComposerKeyDown = useCallback(async(e)=>{ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); await sendCurrentDraft(); } }, [sendCurrentDraft]);
  const handleComposerDraftChange = useCallback((valueOrUpdater, persistNow = true)=>{
    setDraft(prev=>{
      const nextValue = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      if(persistNow) saveStoredDraft(activeId, nextValue);
      return nextValue;
    });
  }, [activeId, saveStoredDraft, setDraft]);
  const hasThreadMessages = (messages.length + pendingMessages.length) > 0;
  const denseThread = (messages.length + pendingMessages.length) > 18;
  const scrollConversationToLatest = useCallback((behavior='smooth') => {
    const node = streamRef.current;
    if (!node) return;
    try { node.scrollTo({ top: node.scrollHeight, behavior }); } catch { node.scrollTop = node.scrollHeight; }
  }, []);
  const isConversationNearBottom = (threshold = 150) => {
    const node = streamRef.current;
    if (!node) return true;
    return (node.scrollHeight - node.scrollTop - node.clientHeight) < threshold;
  };
  useEffect(() => {
    setComposerAssistOpen(false);
    setNewMessageNotice(false);
    lastMessageCountRef.current = 0;
    if (activeId) requestAnimationFrame(() => scrollConversationToLatest('auto'));
  }, [activeId]);

  useEffect(() => {
    if (!activeId || dealPanelTab !== 'overview') return;
    const total = messages.length + pendingMessages.length;
    const previous = lastMessageCountRef.current || 0;
    const hasNew = total > previous;
    const shouldAnchor = previous === 0 || !hasNew || isConversationNearBottom(180) || pendingMessages.length > 0;
    lastMessageCountRef.current = total;
    if (shouldAnchor) {
      setNewMessageNotice(false);
      requestAnimationFrame(() => scrollConversationToLatest(previous === 0 ? 'auto' : 'smooth'));
    } else if (hasNew) {
      setNewMessageNotice(true);
    }
  }, [activeId, dealPanelTab, messages.length, pendingMessages.length, loadingMsgs]);

  useEffect(() => {
    if (!peerTyping) return;
    if (isConversationNearBottom(140)) {
      requestAnimationFrame(() => scrollConversationToLatest('smooth'));
    }
  }, [peerTyping]);

  if (!currentUser?.id) {
    return (
      <div style={{
        minHeight: "calc(100vh - 62px)",
        background: "radial-gradient(circle at 16% 0%,rgba(83,58,104,0.30),transparent 32%), radial-gradient(circle at 88% 10%,rgba(31,109,58,0.16),transparent 30%), linear-gradient(135deg,#090b10 0%,#11101a 42%,#1a1324 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'DM Sans',-apple-system,system-ui,sans-serif",
        color: "#f7f1e7"
      }}>
        <KBEmptyState
          dark
          icon="✉"
          title="Sign in to view your inbox"
          body="Messages, proposal threads, files, and project decisions are tied to your account."
          actionLabel="Sign in"
          onAction={() => nav && nav("auth")}
          secondaryLabel="Back to marketplace"
          onSecondary={() => nav && nav("projects")}
          style={{
            background: "linear-gradient(180deg,rgba(22,20,31,0.92),rgba(13,15,22,0.94))",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 24,
            boxShadow: "0 28px 80px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.055)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)"
          }}
        />
      </div>
    );
  }

  const pendingTransitionTarget = typeof getPendingInboxTarget === 'function' ? getPendingInboxTarget() : null;
  const hashTransitionTarget = typeof window !== 'undefined' && /^#inbox-[^?]+/.test(String(window.location.hash || ''));
  const hasExplicitTransitionTarget = Boolean(
    !dealRoomsHubOpen &&
    !activeId &&
    (
      hashTransitionTarget ||
      (pendingTransitionTarget && pendingTransitionTarget.mode !== 'hub' && (
        pendingTransitionTarget.conversationId ||
        pendingTransitionTarget.projectId ||
        pendingTransitionTarget.projectTitle ||
        pendingTransitionTarget.vendorId ||
        pendingTransitionTarget.churchId
      ))
    )
  );
  const resolvingSelectedProject = Boolean(
    !dealRoomsHubOpen &&
    activeId &&
    active?.projectId &&
    loadingDealMeta &&
    !dealMeta
  );
  if (hasExplicitTransitionTarget || resolvingSelectedProject) {
    const targetLooksLikeDealRoom = Boolean(
      pendingTransitionTarget?.projectId ||
      (active?.projectId && ['hired','in_progress','completed'].includes(String(active?.status || '').toLowerCase()))
    );
    return (
      <div className="kbdr2-route-loading-shell" style={{
        minHeight:"calc(100vh - 62px)",
        display:"grid",
        placeItems:"center",
        padding:24,
        background:"linear-gradient(180deg,#f4eee3 0%,#eee3d3 100%)",
        color:"#1c2814",
        fontFamily:"'DM Sans',-apple-system,system-ui,sans-serif"
      }}>
        <div style={{
          width:"min(620px,92vw)",
          padding:"34px 30px",
          border:"1px solid rgba(155,116,50,.18)",
          borderRadius:22,
          background:"#fffdf8",
          boxShadow:"0 20px 56px rgba(28,40,20,.10)",
          textAlign:"center"
        }}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,fontWeight:850,letterSpacing:".16em",textTransform:"uppercase",color:"#9b7432",marginBottom:10}}>FaithBid workspace</div>
          <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:"clamp(28px,4vw,38px)",fontWeight:700,lineHeight:1.05,letterSpacing:"-.035em"}}>
            {targetLooksLikeDealRoom ? 'Opening Deal Room…' : 'Opening conversation…'}
          </div>
          <div style={{marginTop:10,fontSize:12.5,lineHeight:1.6,color:"#746c60"}}>
            Loading the exact project conversation and current workspace state.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className={`kbdr2-root kb-inbox-dark-shell kb-inbox-render-polish kb-inbox-final-qa${isCanonicalDealRoom ? ' kbdr2-has-canonical-dealroom' : ''}${dealRoomsHubOpen ? ' kbdr2-dealrooms-hub-mode' : ''}`} style={{height:'calc(100vh - 62px)',background:dealRoomsHubOpen?'#f3ecdf':'#090b10',color:dealRoomsHubOpen?'#1C2814':'#f7f1e7',fontFamily:"'DM Sans',-apple-system,system-ui,sans-serif",overflow:'hidden',display:'flex'}}>
      <style>{`
        .kbdr2-root *{box-sizing:border-box}
        .kbdr2-root button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
        .kbdr2-root input,.kbdr2-root textarea{font-family:inherit;outline:none;border:none;background:none;color:inherit}
        .kbdr2-root ::-webkit-scrollbar{width:8px;height:8px}
        .kbdr2-root ::-webkit-scrollbar-track{background:transparent}
        .kbdr2-root ::-webkit-scrollbar-thumb{background:rgba(20,21,24,0.10);border-radius:999px}
        .kbdr2-root ::-webkit-scrollbar-thumb:hover{background:rgba(20,21,24,0.18)}

        /* ═══════════════════ 0179 DEAL ROOMS HUB FOUNDATION ═══════════════════ */
        .kbdr2-root.kbdr2-dealrooms-hub-mode .kbdr2-topbar{display:none!important}
        .kbdr2-root.kbdr2-dealrooms-hub-mode .kbdr2-content{
          display:block!important;width:100%!important;max-width:none!important;padding:0!important;overflow:auto!important;
          background-color:#eee6d9!important;
          background-image:linear-gradient(180deg,rgba(255,253,248,.34),rgba(238,230,217,.10)),var(--kb-workspace-clay-layer)!important;
          background-size:cover!important;background-position:center top!important;
        }
        .kbdr2-hub{min-height:100%;padding:clamp(16px,1.8vw,28px);color:#1C2814}
        .kbdr2-hub-hero{
          position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:24px;
          padding:clamp(19px,2vw,27px) clamp(22px,2.5vw,34px);border-radius:22px;
          background-color:#eee6d9;background-image:var(--kb-workspace-clay-layer);background-size:cover;background-position:center;
          border:1px solid rgba(155,116,50,.18);box-shadow:0 12px 32px rgba(42,53,32,.085);color:#1C2814;
        }
        .kbdr2-hub-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,rgba(255,253,248,.25),rgba(255,253,248,.03) 55%,rgba(155,116,50,.07));pointer-events:none}
        .kbdr2-hub-hero>div,.kbdr2-hub-hero>button{position:relative;z-index:1}
        .kbdr2-hub-kicker{font-family:'DM Mono',monospace;font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#916b2e;margin-bottom:6px}
        .kbdr2-hub-hero h1{margin:0 0 5px;font-family:'Playfair Display','Newsreader',Georgia,serif;font-size:clamp(30px,3vw,42px);line-height:1;letter-spacing:-.038em;font-weight:680}
        .kbdr2-hub-hero p{margin:0;max-width:760px;font-size:12.75px;line-height:1.52;color:#62695d}
        .kbdr2-hub-primary{flex:0 0 auto;height:40px;padding:0 16px!important;border-radius:11px!important;background:#1F3A2E!important;color:#fffdf8!important;font-size:11.5px!important;font-weight:850!important;box-shadow:0 7px 17px rgba(31,58,46,.12)}
        .kbdr2-hub-primary:hover{background:#294b3b!important;transform:translateY(-1px)}
        .kbdr2-hub-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0 12px}
        .kbdr2-hub-tabs{display:flex;align-items:center;gap:7px;margin:0;padding:5px;border:1px solid rgba(28,40,20,.10);border-radius:15px;background:rgba(255,253,248,.72);width:max-content;max-width:100%;box-shadow:0 5px 18px rgba(28,40,20,.04)}
        .kbdr2-hub-tab{display:inline-flex!important;align-items:center!important;gap:8px!important;min-height:36px;padding:0 13px!important;border-radius:10px!important;color:#726b60!important;font-size:12px!important;font-weight:800!important}
        .kbdr2-hub-tab b{display:inline-flex;min-width:20px;height:20px;padding:0 6px;align-items:center;justify-content:center;border-radius:999px;background:rgba(28,40,20,.06);font-size:9.5px}
        .kbdr2-hub-tab.active{background:#fffdf8!important;color:#1C2814!important;box-shadow:0 3px 10px rgba(28,40,20,.08)}
        .kbdr2-hub-tab.active b{background:#eef2e9;color:#35502d}
        .kbdr2-hub-needs-me{display:inline-flex!important;align-items:center!important;gap:8px!important;min-height:38px;padding:0 12px!important;border:1px solid rgba(155,116,50,.22)!important;border-radius:12px!important;background:rgba(255,253,248,.76)!important;color:#5f6658!important;font-size:11px!important;font-weight:850!important;box-shadow:0 4px 14px rgba(28,40,20,.035)!important}
        .kbdr2-hub-needs-me:hover{border-color:rgba(155,116,50,.42)!important;background:#fffdf8!important;color:#1F3A2E!important}
        .kbdr2-hub-needs-me.active{background:#1F3A2E!important;border-color:#1F3A2E!important;color:#fffdf8!important;box-shadow:0 7px 18px rgba(31,58,46,.14)!important}
        .kbdr2-hub-needs-me b{display:inline-flex;min-width:20px;height:20px;padding:0 6px;align-items:center;justify-content:center;border-radius:999px;background:rgba(31,58,46,.08);font-size:9px}
        .kbdr2-hub-needs-me.active b{background:rgba(255,255,255,.15);color:#fffdf8}
        .kbdr2-hub-needs-me-dot{width:7px;height:7px;border-radius:999px;background:#b08840;box-shadow:0 0 0 3px rgba(176,136,64,.10)}
        .kbdr2-hub-needs-me.active .kbdr2-hub-needs-me-dot{background:#e0c57e;box-shadow:0 0 0 3px rgba(224,197,126,.14)}
        .kbdr2-hub-body{min-height:340px}
        .kbdr2-hub-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .kbdr2-hub-room-card{
          position:relative;overflow:hidden;display:flex!important;flex-direction:column!important;min-height:224px;padding:17px 18px 16px!important;
          text-align:left!important;border:1px solid rgba(49,63,43,.10)!important;border-radius:18px!important;
          background:rgba(255,253,248,.94)!important;color:#1C2814!important;box-shadow:0 7px 22px rgba(42,53,32,.045)!important;
          transition:transform .17s ease,border-color .17s ease,box-shadow .17s ease!important;
        }
        .kbdr2-hub-room-card::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:#d8c9ac;opacity:.85}
        .kbdr2-hub-room-card.needs-attention::before{background:linear-gradient(90deg,#315b35,#89a17d)}
        .kbdr2-hub-room-card.waiting-state::before{background:linear-gradient(90deg,#b08840,#ddc486)}
        .kbdr2-hub-room-card:hover{transform:translateY(-2px);border-color:rgba(155,116,50,.28)!important;box-shadow:0 14px 30px rgba(42,53,32,.085)!important}
        .kbdr2-hub-room-card.skeleton{pointer-events:none;gap:15px}
        .kbdr2-hub-room-card.skeleton span{display:block;height:14px;border-radius:999px;background:#f0eadf}
        .kbdr2-hub-room-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
        .kbdr2-hub-room-eyebrow{font-family:'DM Mono',monospace;font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#977337}
        .kbdr2-hub-status{display:inline-flex;padding:5px 8px;border:1px solid;border-radius:999px;font-size:8.5px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}
        .kbdr2-hub-room-title{font-family:'Playfair Display','Newsreader',Georgia,serif;font-size:22px;line-height:1.07;font-weight:760;letter-spacing:-.027em;margin-bottom:6px}
        .kbdr2-hub-room-counterparty{font-size:11px;font-weight:750;color:#766f64;margin-bottom:11px}
        .kbdr2-hub-attention{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding:9px 10px;border-radius:10px;border:1px solid transparent}
        .kbdr2-hub-attention-label{flex:0 0 auto;font-family:'DM Mono',monospace;font-size:8px;font-weight:900;letter-spacing:.10em;text-transform:uppercase}
        .kbdr2-hub-attention-detail{min-width:0;text-align:right;font-size:10.75px;font-weight:850;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .kbdr2-hub-attention.is-action{background:#eef3e9;border-color:#ccd9c3;color:#2f512f}
        .kbdr2-hub-attention.is-action .kbdr2-hub-attention-label{color:#315b35}
        .kbdr2-hub-attention.is-waiting{background:#f5f0e7;border-color:#e1d6c5;color:#716a5f}
        .kbdr2-hub-attention.is-waiting .kbdr2-hub-attention-label{color:#8a6a34}
        .kbdr2-hub-attention.is-complete{background:#f0eee8;border-color:#ddd7cb;color:#69655d}
        .kbdr2-hub-attention.is-muted{background:#f4f1eb;border-color:#e4ded2;color:#777166}
        .kbdr2-hub-room-next{font-size:11.75px;line-height:1.48;color:#61675c;max-width:96%;margin-bottom:14px}
        .kbdr2-hub-room-footer{margin-top:auto;padding-top:12px;border-top:1px solid #ece3d5;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:10.25px;color:#7d756a}
        .kbdr2-hub-open-label{font-weight:850;color:#28432f}
        .kbdr2-hub-conversation-list{display:grid;gap:9px}
        .kbdr2-hub-conversation-row{display:grid!important;grid-template-columns:42px minmax(0,1fr) auto!important;align-items:center!important;gap:13px!important;width:100%;padding:13px 15px!important;text-align:left!important;border:1px solid rgba(28,40,20,.10)!important;border-radius:16px!important;background:#fffdf8!important;color:#1C2814!important;box-shadow:0 5px 16px rgba(28,40,20,.035)!important}
        .kbdr2-hub-conversation-avatar{width:42px;height:42px;border-radius:13px;background:#263721;color:#e8cd8c;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:850}
        .kbdr2-hub-conversation-copy{min-width:0}.kbdr2-hub-conversation-line{display:flex;align-items:center;gap:10px;min-width:0}
        .kbdr2-hub-conversation-line strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Playfair Display','Newsreader',Georgia,serif;font-size:16px}
        .kbdr2-hub-conversation-line span{flex:0 0 auto;padding:3px 7px;border-radius:999px;background:#eef4ea;color:#36532d;font-size:8.5px;font-weight:850}
        .kbdr2-hub-conversation-person{font-size:10.5px;font-weight:750;color:#9a6f2e;margin:2px 0}.kbdr2-hub-conversation-copy p{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;color:#766f64}
        .kbdr2-hub-conversation-open{font-size:10.5px;font-weight:850;color:#28432f}
        .kbdr2-hub-load-more{display:block!important;margin:13px auto 0!important;height:38px;padding:0 15px!important;border:1px solid #d8cbb4!important;border-radius:11px!important;background:#fffdf8!important;color:#28432f!important;font-size:11px!important;font-weight:800!important}
        .kbdr2-hub-empty{padding:54px 28px;text-align:center;border:1px dashed rgba(28,40,20,.14);border-radius:22px;background:rgba(255,253,248,.60)}
        .kbdr2-hub-empty-kicker{font-family:'DM Mono',monospace;font-size:9px;font-weight:850;letter-spacing:.15em;text-transform:uppercase;color:#a47a34;margin-bottom:9px}
        .kbdr2-hub-empty h2{margin:0 0 8px;font-family:'Playfair Display','Newsreader',Georgia,serif;font-size:25px;color:#1C2814}.kbdr2-hub-empty p{max-width:600px;margin:0 auto;font-size:12.5px;line-height:1.65;color:#6f685e}
        @media(max-width:1180px){.kbdr2-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:760px){
          .kbdr2-hub{padding:10px 9px 80px}
          .kbdr2-hub-hero{align-items:flex-start;flex-direction:column;gap:14px;padding:18px 16px;border-radius:18px}
          .kbdr2-hub-hero h1{font-size:31px}
          .kbdr2-hub-hero p{font-size:12px;line-height:1.5}
          .kbdr2-hub-primary{width:auto;min-width:132px}
          .kbdr2-hub-controls{align-items:stretch;flex-direction:column;gap:8px;margin:11px 0 10px}
          .kbdr2-hub-tabs{width:100%;overflow-x:auto}
          .kbdr2-hub-tab{flex:1 0 auto}
          .kbdr2-hub-needs-me{align-self:flex-start}
          .kbdr2-hub-grid{grid-template-columns:1fr;gap:9px}
          .kbdr2-hub-room-card{min-height:0;padding:15px!important;border-radius:16px!important}
          .kbdr2-hub-conversation-row{grid-template-columns:38px minmax(0,1fr)}
          .kbdr2-hub-conversation-open{display:none}
        }

        /* ── TOP BAR ────────────────────────────────────────────── */
        .kbdr2-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
        .kbdr2-topbar{height:70px;display:flex;align-items:center;padding:13px 22px;gap:16px;flex-shrink:0;background:#f4f0e7}
        .kbdr2-search{flex:1;max-width:540px;height:42px;display:flex;align-items:center;gap:10px;padding:0 16px;border-radius:999px;background:#fffdf8;border:1px solid #dfd5c2;box-shadow:0 6px 16px rgba(28,40,20,0.035)}
        .kbdr2-search-ico{color:#8a9585;flex-shrink:0}
        .kbdr2-search input{flex:1;font-size:14px;color:#1F3A2E}
        .kbdr2-search input::placeholder{color:#8a9585}
        .kbdr2-topbar-spacer{flex:1}
        .kbdr2-topbar-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#4a5547;transition:background 0.15s;position:relative}
        .kbdr2-topbar-icon:hover{background:rgba(31,58,46,0.06)}
        .kbdr2-topbar-icon-dot{position:absolute;top:9px;right:10px;width:7px;height:7px;border-radius:50%;background:#C4973A;border:1.5px solid #f4f0e7}
        .kbdr2-user-chip{display:flex;align-items:center;gap:10px;padding:5px 13px 5px 5px;border-radius:999px;background:#fffdf8;border:1px solid #dfd5c2;cursor:pointer;transition:background 0.15s;box-shadow:0 5px 14px rgba(28,40,20,0.035)}
        .kbdr2-user-chip:hover{background:#fbfdf9}
        .kbdr2-user-avatar{width:34px;height:34px;border-radius:50%;background:#DDE6D7;color:#1F3A2E;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12.5px;font-family:'Playfair Display',Georgia,serif}
        .kbdr2-user-meta{display:flex;flex-direction:column;line-height:1.15}
        .kbdr2-user-name{font-size:13px;font-weight:700;color:#1F3A2E;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .kbdr2-user-role{font-size:11.5px;color:#7d8a77;margin-top:1px}
        .kbdr2-user-caret{color:#8a9585;margin-left:2px}

        /* ── CONTENT AREA ───────────────────────────────────────── */
        .kbdr2-content{flex:1;display:grid;grid-template-columns:360px 1fr;gap:16px;padding:0 22px 22px;min-height:0;overflow:hidden}

        /* ── ZONE 3: MY DEALS ───────────────────────────────────── */
        .kbdr2-deals{background:#fff;border-radius:20px;border:1px solid #dfd5c2;box-shadow:0 8px 26px rgba(28,40,20,0.06);display:flex;flex-direction:column;overflow:hidden;min-height:0;scrollbar-width:none}
        .kbdr2-deals::-webkit-scrollbar{display:none}
        .kbdr2-deals *::-webkit-scrollbar{display:none}
        .kbdr2-deals-head{padding:18px 18px 12px;display:flex;align-items:center;gap:10px;flex-shrink:0}
        .kbdr2-deals-title{flex:1;font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:800;color:#1C2814;letter-spacing:-0.035em}
        .kbdr2-new-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:999px;background:#1C2814;color:#fff;font-size:12px;font-weight:800;transition:background 0.15s;box-shadow:inset 0 1px 0 rgba(255,255,255,0.12)}
        .kbdr2-new-btn:hover{background:#17281F}
        .kbdr2-deals-summary{padding:0 18px 10px;display:flex;flex-wrap:wrap;align-items:center;gap:7px 10px;font-size:11.5px;color:#6a604f;flex-shrink:0}
        .kbdr2-deals-summary-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 9px;border-radius:999px;background:rgba(31,58,46,0.06);font-weight:600;color:#1F3A2E;cursor:pointer;border:1px solid transparent;transition:background 0.15s,border-color 0.15s}
        .kbdr2-deals-summary-pill:hover{background:rgba(31,58,46,0.10);border-color:rgba(31,58,46,0.10)}
        .kbdr2-deals-summary-pill.warn{color:#7a4216;background:rgba(224,140,55,0.12)}
        .kbdr2-deals-summary-pill.warn:hover{background:rgba(224,140,55,0.18)}
        .kbdr2-deals-summary-pill-dot{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:0.55;flex-shrink:0}
        .kbdr2-deals-summary-empty{font-size:11.5px;color:#7d8a77;padding:0 0 4px;font-style:italic}
        .kbdr2-deals-tabs{padding:0 18px;display:flex;gap:20px;border-bottom:1px solid #efe7d9;flex-shrink:0;overflow-x:auto;scrollbar-width:none}
        .kbdr2-deals-tab{padding:11px 0 12px;font-size:12.8px;font-weight:700;color:#8a8579;position:relative;transition:color 0.15s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
        .kbdr2-deals-tab:hover{color:#1F3A2E}
        .kbdr2-deals-tab.active{color:#1F3A2E;font-weight:700}
        .kbdr2-deals-tab.active::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2.5px;background:linear-gradient(90deg,#C4973A,#A87B2A);border-radius:2px}
        .kbdr2-deals-tab-count{font-size:11px;font-weight:700;background:rgba(31,58,46,0.08);color:#4a5547;padding:1px 7px;border-radius:999px;line-height:1.5}
        .kbdr2-deals-tab.active .kbdr2-deals-tab-count{background:#1F3A2E;color:#fff}
        .kbdr2-deals-list{flex:1;overflow-y:auto;min-height:0}
        .kbdr2-deals-empty{padding:48px 24px;text-align:center;color:#7d8a77}
        .kbdr2-deals-empty-title{font-family:'Playfair Display',Georgia,serif;font-size:17px;font-weight:700;color:#1F3A2E;margin-bottom:6px}
        .kbdr2-deals-empty-sub{font-size:13px;line-height:1.5}
        .kbdr2-deals-empty-icon{width:56px;height:56px;border-radius:50%;background:#f3f6ef;display:flex;align-items:center;justify-content:center;color:#1F3A2E;margin:0 auto 14px}
        .kbdr2-deals-empty-spinner{width:28px;height:28px;border:3px solid #e8ede6;border-top-color:#1F3A2E;border-radius:50%;animation:kbdr2-spin 0.8s linear infinite;margin:0 auto 14px}
        @keyframes kbdr2-spin{to{transform:rotate(360deg)}}

        /* Deal row */
        .kbdr2-deal-row{display:flex;gap:11px;padding:12px 16px;border-bottom:1px solid rgba(28,40,20,0.055);cursor:pointer;transition:background 0.12s,transform 0.12s;align-items:flex-start;width:100%;text-align:left;position:relative}
        .kbdr2-deal-row:hover{background:#fffdf8}
        .kbdr2-deal-row.active{background:#fbf6ea}
        .kbdr2-deal-row.active::before{content:'';position:absolute;left:0;top:10px;bottom:10px;width:3px;background:linear-gradient(180deg,#C4973A,#A87B2A);border-radius:0 2px 2px 0}
        .kbdr2-deal-avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#1C2814;font-weight:800;font-size:12px;font-family:'Playfair Display',Georgia,serif;flex-shrink:0}
        .kbdr2-deal-body{flex:1;min-width:0}
        .kbdr2-deal-line1{display:flex;align-items:flex-start;gap:8px;margin-bottom:4px}
        .kbdr2-deal-name{flex:1;font-size:13.5px;font-weight:800;color:#1C2814;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-0.012em}
        .kbdr2-deal-badge{flex-shrink:0;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:0.01em;white-space:nowrap}
        .kbdr2-deal-badge.proposal{background:#E8EDE6;color:#4a6b4a}
        .kbdr2-deal-badge.active{background:#DDF0DA;color:#2e5a2e}
        .kbdr2-deal-badge.pending{background:#FDEDD6;color:#96651f}
        .kbdr2-deal-badge.archived{background:#EEF0EC;color:#7d8a77}
        .kbdr2-deal-badge.completed{background:#E0ECE3;color:#3d6849}
        .kbdr2-deal-badge.disputed{background:#FADBDB;color:#8c3333}
        .kbdr2-deal-vendor{font-size:12.5px;color:#556b51;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
        .kbdr2-deal-preview{font-size:12px;color:#7d786c;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical}
        .kbdr2-deal-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;padding-top:2px}
        .kbdr2-deal-time{font-size:11.5px;color:#8a9585;white-space:nowrap;font-weight:600}
        .kbdr2-deal-unread{min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:#1F3A2E;color:#fff;font-size:10.5px;font-weight:800;display:flex;align-items:center;justify-content:center}
        .kbdr2-deal-unread.muted{background:#c5cdc1;color:#fff}
        .kbdr2-deal-row.muted .kbdr2-deal-name{color:#7d8a77;font-weight:600}
        .kbdr2-deal-row.muted .kbdr2-deal-preview{opacity:0.7}

        .kbdr2-avatar-c0{background:#DDE6D7}
        .kbdr2-avatar-c1{background:#F4E4C8}
        .kbdr2-avatar-c2{background:#E8D5E8}
        .kbdr2-avatar-c3{background:#D5E3F2}
        .kbdr2-avatar-c4{background:#F2D5D5}
        .kbdr2-avatar-c5{background:#E8E4D5}

        /* ── ZONE 4: DEAL WORKSPACE ─────────────────────────────── */
        .kbdr2-work{background:#fff;border-radius:20px;border:1px solid #dfd5c2;box-shadow:0 8px 26px rgba(28,40,20,0.06);display:flex;flex-direction:column;overflow:hidden;min-height:0;min-width:0}
        .kbdr2-work-head{padding:17px 22px 15px;display:flex;align-items:center;gap:14px;flex-shrink:0;border-bottom:1px solid #efe7d9;background:#fffdf8}
        .kbdr2-work-avatar{width:48px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#1C2814;font-weight:800;font-size:15px;font-family:'Playfair Display',Georgia,serif;flex-shrink:0}
        .kbdr2-work-info{flex:1;min-width:0}
        .kbdr2-work-title{font-family:'Playfair Display',Georgia,serif;font-size:21px;font-weight:800;color:#1C2814;letter-spacing:-0.035em;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .kbdr2-work-meta{display:flex;align-items:center;gap:10px;font-size:13px;color:#7d8a77;font-weight:500;flex-wrap:wrap}
        .kbdr2-work-status{display:inline-flex;align-items:center;gap:6px}
        .kbdr2-work-status-dot{width:7px;height:7px;border-radius:50%;background:#4ade80}
        .kbdr2-work-actions{display:flex;gap:10px;align-items:center;flex-shrink:0}
        .kbdr2-primary-btn{padding:10px 18px;border-radius:999px;background:#1C2814;color:#fff;font-size:13px;font-weight:800;transition:background 0.15s;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,0.12)}
        .kbdr2-primary-btn:hover:not(:disabled){background:#17281F}
        .kbdr2-primary-btn:disabled{opacity:0.5;cursor:not-allowed}
        .kbdr2-secondary-btn{padding:10px 14px;border-radius:999px;background:#fbf6ea;color:#1C2814;font-size:13px;font-weight:700;transition:background 0.15s;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;border:1px solid #e5dbc8}
        .kbdr2-secondary-btn:hover{background:#DDE6D7}
        .kbdr2-icon-btn{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#4a5547;transition:background 0.15s}
        .kbdr2-icon-btn:hover{background:#f3f6ef;color:#1F3A2E}

        .kbdr2-work-tabs{padding:0 18px;display:flex;gap:20px;border-bottom:1px solid #efe7d9;flex-shrink:0;background:#fff}
        /* LIFECYCLE TRACKER */
        .kbdr2-lifecycle{display:flex;align-items:center;padding:12px 22px 15px;gap:0;border-bottom:1px solid #efe7d9;background:linear-gradient(to bottom, rgba(251,246,234,0.8), transparent);flex-shrink:0;overflow-x:auto}
        .kbdr2-lifecycle::-webkit-scrollbar{display:none}
        .kbdr2-lifecycle-step{display:flex;flex-direction:column;align-items:center;gap:5px;flex-shrink:0;min-width:72px}
        .kbdr2-lifecycle-pip{width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid rgba(31,58,46,0.18);color:rgba(31,58,46,0.4);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;transition:all 0.2s}
        .kbdr2-lifecycle-step.done .kbdr2-lifecycle-pip{background:#1F3A2E;border-color:#1F3A2E;color:#fff}
        .kbdr2-lifecycle-step.current .kbdr2-lifecycle-pip{background:#fff;border-color:#1F3A2E;color:#1F3A2E;box-shadow:0 0 0 4px rgba(31,58,46,0.12)}
        .kbdr2-lifecycle-text{font-size:11px;font-weight:600;color:#7d8a77;white-space:nowrap;letter-spacing:0.02em}
        .kbdr2-lifecycle-step.done .kbdr2-lifecycle-text{color:#1F3A2E}
        .kbdr2-lifecycle-step.current .kbdr2-lifecycle-text{color:#1F3A2E;font-weight:700}
        .kbdr2-lifecycle-line{flex:1;height:2px;background:rgba(31,58,46,0.12);margin:0 -4px;min-width:18px;margin-bottom:18px;transition:background 0.2s}
        .kbdr2-lifecycle-line.done{background:#1F3A2E}
        .kbdr2-lifecycle.declined{padding:12px 26px;justify-content:center;background:rgba(160,32,32,0.04);border-bottom:1px solid rgba(160,32,32,0.12)}
        .kbdr2-lifecycle-label{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:#8a2020}
        @media (max-width: 640px){
          .kbdr2-lifecycle{padding:10px 14px 14px;gap:0}
          .kbdr2-lifecycle-step{min-width:58px}
          .kbdr2-lifecycle-text{font-size:10px}
          .kbdr2-lifecycle-line{min-width:10px}
        }
        .kbdr2-work-tab{padding:10px 0 11px;font-size:12.5px;font-weight:600;color:#7d8a77;position:relative;transition:color 0.15s;display:inline-flex;align-items:center;gap:6px}
        .kbdr2-work-tab:hover{color:#1F3A2E}
        .kbdr2-work-tab.active{color:#1F3A2E;font-weight:700}
        .kbdr2-work-tab.active::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2.5px;background:linear-gradient(90deg,#C4973A,#A87B2A);border-radius:2px}
        .kbdr2-work-tab-count{font-size:10px;font-weight:700;background:rgba(31,58,46,0.08);color:#4a5547;padding:1px 6px;border-radius:999px;line-height:1.5}
        .kbdr2-work-tab.active .kbdr2-work-tab-count{background:#1F3A2E;color:#fff}

        .kbdr2-work-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;color:#7d8a77;gap:10px}
        .kbdr2-work-empty-icon{width:72px;height:72px;border-radius:50%;background:#f3f6ef;display:flex;align-items:center;justify-content:center;color:#1F3A2E;margin-bottom:6px}
        .kbdr2-work-empty-title{font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#1F3A2E}
        .kbdr2-work-empty-sub{font-size:13.5px;line-height:1.5;max-width:360px}

        /* Next-action strip */
        .kbdr2-next-strip{margin:14px 22px 0;padding:12px 16px;border-radius:16px;background:#fff8e8;border:1px solid #e2c985;display:flex;align-items:center;gap:14px;box-shadow:0 6px 18px rgba(196,151,58,0.08)}
        .kbdr2-next-strip.urgent{background:#FDEDD6;border-color:#E8B878}
        .kbdr2-next-strip.calm{background:#F0F5EB;border-color:#C8D8BE}
        .kbdr2-next-strip-icon{width:32px;height:32px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;color:#8a6b1f;flex-shrink:0}
        .kbdr2-next-strip.calm .kbdr2-next-strip-icon{color:#2e5a2e}
        .kbdr2-next-strip-body{flex:1;min-width:0}
        .kbdr2-next-strip-eyebrow{font-size:10.5px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#8a6b1f;margin-bottom:2px}
        .kbdr2-next-strip.calm .kbdr2-next-strip-eyebrow{color:#2e5a2e}
        .kbdr2-next-strip-text{font-size:13.5px;color:#1F3A2E;font-weight:500;line-height:1.4}
        .kbdr2-next-strip-action{padding:7px 14px;border-radius:8px;background:#1F3A2E;color:#fff;font-size:12.5px;font-weight:700;flex-shrink:0;transition:background 0.15s}
        .kbdr2-next-strip-action:hover{background:#17281F}

        /* Message stream */
        .kbdr2-stream{flex:1;overflow-y:auto;padding:18px 26px 8px;min-height:0;background:linear-gradient(180deg,#fff 0%,#fffdf8 100%);scrollbar-width:none}
        .kbdr2-stream::-webkit-scrollbar{display:none}
        /* HEADER DROPDOWN MENU */
        .kbdr2-header-menu{position:absolute;top:calc(100% + 6px);right:0;background:#fff;border:1px solid rgba(31,58,46,0.08);border-radius:12px;box-shadow:0 12px 32px rgba(20,21,24,0.12),0 2px 8px rgba(20,21,24,0.04);min-width:220px;padding:6px;z-index:30;animation:kbdr2-menu-in 0.12s ease-out}
        @keyframes kbdr2-menu-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .kbdr2-header-menu-item{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border-radius:8px;font-size:13px;font-weight:500;color:#1F3A2E;text-align:left;transition:background 0.12s}
        .kbdr2-header-menu-item:hover{background:#f3f6ef}
        .kbdr2-header-menu-item.danger{color:#a02020}
        .kbdr2-header-menu-item.danger:hover{background:rgba(160,32,32,0.06)}
        .kbdr2-header-menu-item svg{flex-shrink:0;opacity:0.7}
        .kbdr2-header-menu-item:hover svg{opacity:1}
        .kbdr2-header-menu-divider{height:1px;background:rgba(31,58,46,0.06);margin:4px 0}
        .kbdr2-typing-bubble{display:inline-flex !important;align-items:center;gap:5px;padding:14px 18px !important;min-height:0}
        .kbdr2-typing-dot{width:6px;height:6px;border-radius:50%;background:#7d8a77;display:inline-block;animation:kbdr2-typing 1.2s infinite ease-in-out}
        .kbdr2-typing-dot:nth-child(1){animation-delay:0s}
        .kbdr2-typing-dot:nth-child(2){animation-delay:0.18s}
        .kbdr2-typing-dot:nth-child(3){animation-delay:0.36s}
        @keyframes kbdr2-typing{0%,60%,100%{opacity:0.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
        .kbdr2-day-label{text-align:center;font-size:12px;font-weight:700;color:#7d8a77;margin:8px 0 20px;letter-spacing:0.02em}
        .kbdr2-msg-row{display:flex;gap:10px;margin-bottom:10px;align-items:flex-end}
        .kbdr2-msg-row.grouped{margin-top:-4px;margin-bottom:6px}
        .kbdr2-msg-row.me{flex-direction:row-reverse}
        .kbdr2-msg-avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#1F3A2E;font-weight:800;font-size:10.5px;font-family:'Playfair Display',Georgia,serif;flex-shrink:0;box-shadow:0 4px 12px rgba(28,40,20,0.06)}
        .kbdr2-msg-avatar.invisible{visibility:hidden}
        .kbdr2-bubble{max-width:min(68%,640px);padding:11px 14px;border-radius:18px;font-size:14px;line-height:1.48;word-wrap:break-word;overflow-wrap:break-word;box-shadow:0 5px 16px rgba(28,40,20,0.045)}
        .kbdr2-bubble.them{background:#fffdf8;color:#1F3A2E;border:1px solid rgba(223,213,194,0.70);border-bottom-left-radius:7px}
        .kbdr2-bubble.me{background:linear-gradient(135deg,#1F3A2E,#102117);color:#fff;border-bottom-right-radius:7px;box-shadow:0 10px 24px rgba(28,40,20,0.16)}
        .kbdr2-msg-row.grouped .kbdr2-bubble.them{border-top-left-radius:14px}
        .kbdr2-msg-row.grouped.me .kbdr2-bubble.me{border-top-right-radius:14px}
        .kbdr2-bubble.system{background:transparent;color:#7d8a77;font-style:italic;text-align:center;max-width:100%;padding:6px 12px;font-size:12.5px;box-shadow:none;border:0}
        .kbdr2-bubble-time{font-size:10.5px;margin-top:5px;opacity:0.62;font-weight:600;display:flex;align-items:center;gap:6px}
        .kbdr2-bubble.me .kbdr2-bubble-time{justify-content:flex-end}
        .kbdr2-bubble-checks{font-size:10.5px}
        .kbdr2-new-message-pill{position:sticky;bottom:10px;margin:10px auto 4px;display:flex;align-items:center;justify-content:center;gap:7px;height:32px;padding:0 14px;border-radius:999px;background:#fffdf8;border:1px solid rgba(176,136,64,0.24);color:#1F3A2E;font-size:12px;font-weight:850;box-shadow:0 12px 28px rgba(28,40,20,0.12);z-index:4}
        .kbdr2-new-message-pill:hover{background:#fff8e7}
        .kbdr2-file-card{display:inline-flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:#f3f6ef;border:1px solid rgba(31,58,46,0.06);max-width:320px}
        .kbdr2-bubble.me .kbdr2-file-card{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.15);color:#fff}
        .kbdr2-file-icon{width:38px;height:42px;border-radius:6px;background:#e85c5c;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:800;letter-spacing:0.02em;flex-shrink:0}
        .kbdr2-file-meta{flex:1;min-width:0}
        .kbdr2-file-name{font-size:13px;font-weight:700;color:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:2px}
        .kbdr2-file-size{font-size:11.5px;opacity:0.7}
        .kbdr2-file-action{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:currentColor;opacity:0.6;transition:opacity 0.15s;flex-shrink:0}
        .kbdr2-file-action:hover{opacity:1}



        /* V747: remove the Messages / Proposal / Files / Milestones row from the Inbox workspace. */
        .kbdr2-work .kbdr2-work-tabs{display:none !important;}

        /* Composer */
        .kbdr2-composer{padding:10px 22px 12px;flex-shrink:0;background:#fffdf8;border-top:1px solid #efe7d9}
        .kbdr2-composer-meta{display:none}
        .kbdr2-composer-hint{display:none !important}
        .kbdr2-composer-hint-pill{padding:3px 9px;border-radius:999px;background:#f3f6ef;color:#1F3A2E;font-weight:700;font-size:11px;cursor:pointer;border:1px solid rgba(31,58,46,0.06);transition:background 0.15s}
        .kbdr2-composer-hint-pill:hover{background:#DDE6D7}
        .kbdr2-composer-inner{border:1px solid #dfd5c2;border-radius:12px;background:#fff;padding:2px;display:flex;align-items:flex-end;gap:4px;transition:border-color 0.15s,box-shadow 0.15s;box-shadow:0 2px 8px rgba(28,40,20,0.03)}
        .kbdr2-composer-inner:focus-within{border-color:#1F3A2E}
        .kbdr2-composer textarea{flex:1;resize:none;padding:9px 10px;font-size:14px;line-height:1.45;color:#1F3A2E;max-height:120px;min-height:20px;font-family:inherit}
        .kbdr2-composer textarea::placeholder{color:#8a9585}
        .kbdr2-composer-tools{display:flex;gap:2px;padding:2px 2px}
        .kbdr2-composer-tool{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#7d8a77;transition:all 0.15s}
        .kbdr2-composer-tool:hover{background:#f3f6ef;color:#1F3A2E}
        .kbdr2-composer-tool:disabled{opacity:0.4;cursor:not-allowed}
        .kbdr2-composer-send{width:42px;height:42px;border-radius:10px;background:#1F3A2E;color:#fff;display:flex;align-items:center;justify-content:center;transition:background 0.15s;margin:4px;flex-shrink:0}
        .kbdr2-composer-send:hover:not(:disabled){background:#17281F}
        .kbdr2-composer-send:disabled{opacity:0.4;cursor:not-allowed}

        /* Tab content: Proposal / Files / Milestones */
        .kbdr2-tab-body{flex:1;overflow-y:auto;padding:22px 26px 26px;min-height:0;background:linear-gradient(180deg,#fff 0%,#fffdf8 100%)}
        .kbdr2-section{background:#fff;border:1px solid #dfd5c2;border-radius:18px;padding:20px 22px;margin-bottom:16px;box-shadow:0 6px 18px rgba(28,40,20,0.045)}
        .kbdr2-section-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}
        .kbdr2-section-title{flex:1;font-family:'Playfair Display',Georgia,serif;font-size:16px;font-weight:700;color:#1F3A2E;letter-spacing:-0.01em}
        .kbdr2-section-chip{padding:3px 9px;border-radius:999px;background:#f3f6ef;color:#1F3A2E;font-size:11px;font-weight:700;letter-spacing:0.01em}

        .kbdr2-kv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 24px}
        .kbdr2-kv-label{font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#8a9585;margin-bottom:4px}
        .kbdr2-kv-value{font-size:14px;font-weight:600;color:#1F3A2E;line-height:1.4}
        .kbdr2-kv-value.big{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.01em}

        /* Milestones */
        .kbdr2-ms-list{display:flex;flex-direction:column;gap:10px}
        .kbdr2-ms-row{display:flex;gap:14px;align-items:flex-start;padding:14px;border-radius:14px;background:#fffdf8;border:1px solid #efe7d9}
        .kbdr2-ms-row.current{background:#FDF7E8;border-color:#E8D7A8}
        .kbdr2-ms-row.done{opacity:0.7}
        .kbdr2-ms-pip{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#E8EDE6;color:#7d8a77;font-size:12px;font-weight:800}
        .kbdr2-ms-row.done .kbdr2-ms-pip{background:#1F3A2E;color:#fff}
        .kbdr2-ms-row.current .kbdr2-ms-pip{background:#e3a857;color:#fff}
        .kbdr2-ms-body{flex:1;min-width:0}
        .kbdr2-ms-title{font-size:14px;font-weight:700;color:#1F3A2E;margin-bottom:3px;letter-spacing:-0.01em}
        .kbdr2-ms-meta{font-size:12.5px;color:#7d8a77;font-weight:500}
        .kbdr2-ms-amt{font-size:14px;font-weight:700;color:#1F3A2E;font-family:'Playfair Display',Georgia,serif;flex-shrink:0}

        /* Files grid */
        .kbdr2-files-list{display:flex;flex-direction:column;gap:8px}
        .kbdr2-file-row{display:flex;gap:14px;align-items:center;padding:12px 14px;border-radius:14px;background:#fffdf8;border:1px solid #efe7d9;transition:background 0.12s}
        .kbdr2-file-row:hover{background:#f3f6ef}
        .kbdr2-file-row-meta{flex:1;min-width:0}
        .kbdr2-file-row-name{font-size:13.5px;font-weight:700;color:#1F3A2E;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:2px}
        .kbdr2-file-row-sub{font-size:12px;color:#7d8a77;font-weight:500}

        .kbdr2-prop-cta{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
        .kbdr2-prop-msg{padding:14px 16px;border-radius:14px;background:#fbf6ea;border:1px solid #efe7d9;font-size:13.5px;color:#1C2814;line-height:1.55;white-space:pre-wrap;margin-top:14px}

        @media (max-width: 1200px){
          .kbdr2-content{grid-template-columns:330px 1fr}
          .kbdr2-kv-grid{grid-template-columns:1fr}
        }
        @media (max-width: 980px){
          .kbdr2-nav{display:none}
          .kbdr2-content{grid-template-columns:1fr;padding:0 16px 16px;gap:0}
          .kbdr2-deals{display:${activeId ? 'none' : 'flex'}}
          .kbdr2-work{display:${activeId ? 'flex' : 'none'}}
          .kbdr2-work-back{display:inline-flex !important}
          .kbdr2-work-tabs{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;padding-bottom:2px}
          .kbdr2-work-tabs::-webkit-scrollbar{display:none}
          .kbdr2-work-tab{flex-shrink:0;white-space:nowrap}
          .kbdr2-prop-cta{flex-wrap:wrap !important}
          .kbdr2-kv-grid{grid-template-columns:1fr 1fr}
        }
        @media (max-width: 640px){
          .kbdr2-rail{display:none}
          .kbdr2-topbar{padding:12px 14px;gap:8px}
          .kbdr2-search{max-width:none}
          .kbdr2-search input{font-size:14px}
          .kbdr2-user-name{display:none}
          .kbdr2-user-role{display:none}
          .kbdr2-user-caret{display:none}
          .kbdr2-user-chip{padding:4px}
          .kbdr2-topbar-icon{width:36px;height:36px}
          .kbdr2-work-head{flex-wrap:wrap;padding:14px 16px;gap:10px}
          .kbdr2-work-title{font-size:18px}
          .kbdr2-work-actions .kbdr2-primary-btn{font-size:12.5px;padding:8px 12px}
          .kbdr2-bubble{max-width:86%}
          .kbdr2-composer{padding:12px}
          .kbdr2-kv-grid{grid-template-columns:1fr}
          .kbdr2-file-card{max-width:100%}
          .kbdr2-deal-row{padding:12px 14px}
          .kbdr2-work-empty{padding:32px 20px}
        }

        /* Short-viewport compression: laptop screens with limited vertical room.
           Tightens kbdr2 chrome above the message stream so more conversation is visible.
           Does not fire on monitors / tall viewports. Title size and structure preserved. */
        @media (max-height: 900px){
          .kbdr2-topbar{height:56px;padding:9px 22px}
          .kbdr2-work-head{padding:11px 22px 9px}
          .kbdr2-thread-context{margin:6px 22px 0;padding:4px 0}
          .kbdr2-composer{padding:9px 22px 12px}
          .kbdr2-composer-hint{margin-bottom:4px}
        }


        /* v23 inbox premium redesign pass — message-first hierarchy */
        .kbdr2-root{
          background:
            radial-gradient(circle at 18% 0%,rgba(196,151,58,0.10),transparent 28%),
            radial-gradient(circle at 88% 10%,rgba(31,58,46,0.09),transparent 24%),
            #f4f0e7 !important;
        }
        .kbdr2-topbar{background:transparent !important}
        .kbdr2-content{grid-template-columns:minmax(330px,380px) minmax(0,1fr) !important;gap:18px !important}
        .kbdr2-deals,.kbdr2-work{
          border-color:rgba(120,99,59,0.18) !important;
          box-shadow:0 22px 60px rgba(28,40,20,0.10),0 1px 0 rgba(255,255,255,0.70) inset !important;
        }
        .kbdr2-deals{background:linear-gradient(180deg,#fffdf8 0%,#fffaf1 100%) !important}
        .kbdr2-deals-head{
          display:flex !important;
          align-items:center !important;
          justify-content:space-between !important;
          gap:10px !important;
          padding:7px 18px !important;
          background:#fffdf8 !important;
          border-bottom:1px solid rgba(223,213,194,0.55) !important;
        }
        .kbdr2-deals-title{font-size:15px !important;line-height:1.2 !important;margin:0 !important;flex:0 1 auto !important}
        .kbdr2-deals-subtitle{
          grid-column:1/-1;
          margin-top:7px;
          max-width:285px;
          font-size:12.5px;
          line-height:1.45;
          color:#6b6253;
          font-weight:500;
        }
        .kbdr2-new-btn{height:30px !important;padding:0 13px !important;font-size:12px !important;box-shadow:0 4px 12px rgba(28,40,20,0.12),inset 0 1px 0 rgba(255,255,255,0.12) !important}
        .kbdr2-deals-summary{padding:6px 18px 6px !important;border-bottom:1px solid rgba(223,213,194,0.38) !important;background:rgba(255,253,248,0.58) !important}
        .kbdr2-deals-summary-empty{font-style:normal !important;color:#786b58 !important;line-height:1.42 !important}
        .kbdr2-deals-tabs{padding:0 20px !important;background:#fffdf8 !important}
        .kbdr2-deal-row{
          margin:8px 10px !important;
          width:calc(100% - 20px) !important;
          border:1px solid transparent !important;
          border-radius:16px !important;
          background:rgba(255,255,255,0.50) !important;
          box-shadow:none !important;
        }
        .kbdr2-deal-row:hover{background:#fffdf8 !important;border-color:rgba(223,213,194,0.72) !important;transform:translateY(-1px)}
        .kbdr2-deal-row.active{
          background:#fff !important;
          border-color:rgba(196,151,58,0.34) !important;
          box-shadow:0 14px 34px rgba(28,40,20,0.09) !important;
        }
        .kbdr2-deal-row.active::before{top:14px !important;bottom:14px !important;left:-1px !important;width:4px !important;border-radius:0 999px 999px 0 !important}
        .kbdr2-deal-name{font-size:14px !important;letter-spacing:-0.018em !important}
        .kbdr2-deal-preview{-webkit-line-clamp:2 !important;color:#766d61 !important;line-height:1.42 !important}
        .kbdr2-deal-badge{font-size:10px !important;text-transform:uppercase !important;letter-spacing:0.045em !important}
        .kbdr2-work{background:#fffdf8 !important}
        .kbdr2-work-head{
          padding:18px 24px 16px !important;
          background:linear-gradient(180deg,#fffdf8 0%,#fff8ed 100%) !important;
          position:relative;
        }
        .kbdr2-work-eyebrow{
          margin-bottom:4px;
          font-size:10px;
          font-weight:850;
          letter-spacing:0.15em;
          text-transform:uppercase;
          color:#9a7330;
        }
        .kbdr2-work-title{font-size:24px !important;line-height:1.02 !important}
        .kbdr2-work-meta{gap:8px !important;color:#696052 !important}
        .kbdr2-lifecycle{
          padding:13px 24px !important;
          background:#fffdf8 !important;
          border-bottom:1px solid rgba(223,213,194,0.60) !important;
        }
        .kbdr2-work-tabs{
          padding:0 24px !important;
          background:#fffdf8 !important;
          border-bottom:1px solid rgba(223,213,194,0.70) !important;
        }
        .kbdr2-thread-context{margin:10px 22px 0;padding:6px 0;border-bottom:1px solid rgba(223,213,194,0.5);display:flex;align-items:center;flex-wrap:wrap;}
        .kbdr2-thread-context-item{display:flex;align-items:center;gap:4px;padding:3px 10px;border-right:1px solid rgba(223,213,194,0.45);min-width:0;}
        .kbdr2-thread-context-item:first-child{padding-left:0}
        .kbdr2-thread-context-item span{font-size:10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#9a8a72;white-space:nowrap;}
        .kbdr2-thread-context-item strong{font-size:12px;font-weight:700;color:#1F3A2E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px;}
        .kbdr2-thread-context-link{margin-left:auto;padding:0;background:none !important;color:#8a6729 !important;font-size:11.5px !important;font-weight:700 !important;white-space:nowrap;text-decoration:underline;text-underline-offset:2px;}
        .kbdr2-next-strip{margin:12px 24px 0 !important;border-radius:18px !important}
        .kbdr2-stream{
          padding:20px 28px 10px !important;
          background:
            linear-gradient(180deg,rgba(255,255,255,0.94) 0%,rgba(255,253,248,0.98) 100%),
            radial-gradient(circle at 50% 0%,rgba(196,151,58,0.09),transparent 38%) !important;
        }
        @media (min-width:641px){
          .kbdr2-stream{scrollbar-gutter:stable}
          .kbdr2-stream::-webkit-scrollbar{width:7px}
          .kbdr2-stream::-webkit-scrollbar-track{background:transparent}
          .kbdr2-stream::-webkit-scrollbar-thumb{background:rgba(28,40,20,0.10);border-radius:999px}
          .kbdr2-stream::-webkit-scrollbar-thumb:hover{background:rgba(28,40,20,0.18)}
          .kbdr2-tab-body::-webkit-scrollbar{width:7px}
          .kbdr2-tab-body::-webkit-scrollbar-track{background:transparent}
          .kbdr2-tab-body::-webkit-scrollbar-thumb{background:rgba(28,40,20,0.10);border-radius:999px}
          .kbdr2-tab-body::-webkit-scrollbar-thumb:hover{background:rgba(28,40,20,0.18)}
        }
        .kbdr2-day-label{
          display:inline-flex !important;
          align-items:center !important;
          justify-content:center !important;
          width:auto !important;
          min-width:120px;
          margin:4px auto 20px !important;
          padding:6px 12px;
          border-radius:999px;
          background:#fffdf8;
          border:1px solid rgba(223,213,194,0.85);
          color:#766d61 !important;
          box-shadow:0 6px 16px rgba(28,40,20,0.045);
        }
        .kbdr2-msg-row{margin-bottom:16px !important}
        .kbdr2-bubble{
          border-radius:18px !important;
          box-shadow:0 8px 20px rgba(28,40,20,0.06);
        }
        .kbdr2-bubble.them{
          background:#fffdf8 !important;
          border:1px solid #efe7d9 !important;
          border-bottom-left-radius:7px !important;
        }
        .kbdr2-bubble.me{
          background:linear-gradient(135deg,#1F3A2E,#15271f) !important;
          border-bottom-right-radius:7px !important;
          box-shadow:0 10px 24px rgba(31,58,46,0.18) !important;
        }
        .kbdr2-thread-empty{
          max-width:440px;
          margin:58px auto 42px;
          padding:30px 28px;
          text-align:center;
          border:1px solid rgba(223,213,194,0.78);
          border-radius:22px;
          background:linear-gradient(180deg,#fffdf8,#fff8ed);
          box-shadow:0 18px 46px rgba(28,40,20,0.08);
        }
        .kbdr2-thread-empty-icon{
          width:58px;
          height:58px;
          margin:0 auto 14px;
          border-radius:20px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#9a7330;
          background:rgba(196,151,58,0.10);
          border:1px solid rgba(196,151,58,0.22);
        }
        .kbdr2-thread-empty-title{
          font-family:'Playfair Display',Georgia,serif;
          font-size:21px;
          font-weight:800;
          letter-spacing:-0.025em;
          color:#1C2814;
          margin-bottom:7px;
        }
        .kbdr2-thread-empty-sub{
          font-size:13.5px;
          color:#6b6253;
          line-height:1.58;
          max-width:340px;
          margin:0 auto 18px;
        }
        .kbdr2-composer{
          padding:10px 22px 12px !important;
          background:linear-gradient(180deg,#fffdf8,#fff8ed) !important;
        }
        .kbdr2-composer-inner{
          border-radius:18px !important;
          border-color:rgba(120,99,59,0.22) !important;
          box-shadow:0 12px 28px rgba(28,40,20,0.08) !important;
        }
        .kbdr2-composer-inner:focus-within{
          border-color:#C4973A !important;
          box-shadow:0 0 0 4px rgba(196,151,58,0.12),0 14px 32px rgba(28,40,20,0.10) !important;
        }
        .kbdr2-composer-send{background:linear-gradient(135deg,#1F3A2E,#15271f) !important;box-shadow:0 8px 18px rgba(31,58,46,0.18) !important}
        @media (max-width: 1180px){
          .kbdr2-thread-context{grid-template-columns:repeat(2,minmax(0,1fr));}
          .kbdr2-thread-context-link{grid-column:1/-1;justify-self:start}
        }
        @media (max-width: 640px){
          .kbdr2-deals-subtitle{max-width:none;font-size:12px}
          .kbdr2-thread-context{margin:12px 12px 0 !important;grid-template-columns:1fr 1fr;padding:10px}
          .kbdr2-thread-context-link{width:100%;justify-content:center}
          .kbdr2-work-eyebrow{font-size:9px}
          .kbdr2-thread-empty{margin:34px 10px 28px;padding:24px 18px}
        }

        /* v24 inbox interaction hardening — clarity, read-only states, and priority labels */
        .kbdr2-priority-line{margin-top:7px;display:flex;align-items:flex-start;gap:7px;font-size:11.5px;line-height:1.35;color:#6b6253;}
        .kbdr2-priority-dot{width:7px;height:7px;border-radius:50%;margin-top:4px;flex-shrink:0;background:var(--priority-color,#8A6729);box-shadow:0 0 0 3px var(--priority-bg,rgba(176,136,64,0.10));}
        .kbdr2-priority-line strong{color:#1F3A2E;font-weight:850;}
        .kbdr2-command-card{margin:10px 22px 0;padding:12px 14px;border-radius:12px;border:1px solid rgba(223,213,194,0.6);background:#fffdf8;display:flex;flex-direction:column;gap:0;}
        .kbdr2-command-copy{min-width:0;padding:2px 2px 2px 4px;display:flex;flex-direction:column;justify-content:center;}
        .kbdr2-command-eyebrow{font-size:9.5px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:#9a7330;margin-bottom:3px;}
        .kbdr2-command-title{font-size:14px;font-weight:700;color:#1C2814;line-height:1.3;margin-bottom:4px;}
        .kbdr2-command-body{font-size:12px;color:#6b6253;line-height:1.5;}
        .kbdr2-command-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px;}
        .kbdr2-command-actions .kbdr2-primary-btn,.kbdr2-command-actions .kbdr2-secondary-btn{height:36px;padding:0 13px;font-size:12px;}
        .kbdr2-command-metrics{display:none;}
        .kbdr2-command-metric{padding:10px 11px;border-radius:14px;background:rgba(255,255,255,0.72);border:1px solid rgba(223,213,194,0.62);min-width:0;}
        .kbdr2-command-metric span{display:block;font-size:9.5px;font-weight:850;letter-spacing:0.12em;text-transform:uppercase;color:#9a8a72;margin-bottom:4px;}
        .kbdr2-command-metric strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;color:#1F3A2E;line-height:1.25;}
        .kbdr2-composer-meta{display:none !important;}
        .kbdr2-composer-meta span:last-child{text-align:right;}
        .kbdr2-composer-send{width:auto !important;min-width:44px;padding:0 13px !important;gap:8px;}
        .kbdr2-composer-send-label{font-size:12px;font-weight:850;white-space:nowrap;}
        .kbdr2-failed-banner{margin:0 16px 12px;padding:12px 13px;border-radius:16px;background:rgba(197,48,48,0.075);border:1px solid rgba(197,48,48,0.18);display:flex;align-items:center;gap:12px;box-shadow:0 10px 24px rgba(127,29,29,0.06);}
        .kbdr2-failed-banner-icon{width:28px;height:28px;border-radius:10px;background:rgba(197,48,48,0.12);color:#9b1c1c;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;}
        .kbdr2-failed-banner-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;font-size:12.5px;color:#7f1d1d;line-height:1.35;}
        .kbdr2-failed-banner-copy strong{font-size:13px;color:#7f1d1d;}
        .kbdr2-failed-banner-actions{display:flex;align-items:center;gap:7px;flex-shrink:0;}
        .kbdr2-failed-retry,.kbdr2-failed-dismiss{height:32px;padding:0 11px;border-radius:999px;font-size:11.5px;font-weight:850;}
        .kbdr2-failed-retry{background:#7f1d1d;color:#fff;}
        .kbdr2-failed-dismiss{background:rgba(255,255,255,0.62);color:#7f1d1d;border:1px solid rgba(127,29,29,0.14);}
        .kbdr2-composer-readonly .kbdr2-composer-inner{background:#fbf6ea !important;border-color:rgba(120,99,59,0.18) !important;box-shadow:none !important;}
        .kbdr2-composer-readonly textarea{color:#8a8579 !important;}
        @media (max-width: 1180px){
          .kbdr2-command-card{grid-template-columns:1fr;margin:12px 24px 0;}
        }
        @media (max-width: 640px){
          .kbdr2-command-card{margin:10px 12px 0;padding:12px;grid-template-columns:1fr;border-radius:15px;}
          .kbdr2-command-title{font-size:16px;}
          .kbdr2-command-metrics{grid-template-columns:1fr 1fr;}
          .kbdr2-failed-banner{margin:0 10px 10px;align-items:flex-start;flex-wrap:wrap;}
          .kbdr2-failed-banner-actions{width:100%;justify-content:flex-start;padding-left:40px;}
          .kbdr2-composer-meta{display:none;}
          .kbdr2-composer-send-label{display:none;}
          .kbdr2-composer-send{width:40px !important;min-width:40px !important;padding:0 !important;}
        }

        /* v25 inbox mobile + history polish — quick filters, thread glance, and older-message recovery */
        .kbdr2-mobile-quickviews{display:none;}
        .kbdr2-mobile-quickview{
          flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px;border-radius:999px !important;border:1px solid rgba(31,58,46,0.10) !important;background:#fffdf8 !important;color:#4a5547 !important;font-size:12px !important;font-weight:800 !important;white-space:nowrap;box-shadow:0 4px 12px rgba(28,40,20,0.035);
        }
        .kbdr2-mobile-quickview.active{background:#1F3A2E !important;color:#fff !important;border-color:#1F3A2E !important;}
        .kbdr2-mobile-quickview-count{min-width:18px;height:18px;padding:0 6px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:rgba(31,58,46,0.08);font-size:10.5px;font-weight:900;color:currentColor;}
        .kbdr2-mobile-quickview.active .kbdr2-mobile-quickview-count{background:rgba(255,255,255,0.16);}
        .kbdr2-mobile-glance{display:none;}
        .kbdr2-mobile-glance-pill{flex:0 0 auto;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:7px 10px;border-radius:999px;background:#fff;border:1px solid rgba(223,213,194,0.85);font-size:11.5px;font-weight:800;color:#1F3A2E;box-shadow:0 5px 14px rgba(28,40,20,0.045);}
        .kbdr2-load-older-wrap{display:flex;justify-content:center;margin:2px 0 18px;}
        .kbdr2-load-older-btn{height:34px;padding:0 14px;border-radius:999px !important;background:#fffdf8 !important;border:1px solid rgba(223,213,194,0.88) !important;color:#1F3A2E !important;font-size:12px !important;font-weight:850 !important;box-shadow:0 7px 18px rgba(28,40,20,0.045);}
        .kbdr2-load-older-btn:hover:not(:disabled){background:#f3f6ef !important;}
        .kbdr2-load-older-btn:disabled{opacity:0.62;cursor:not-allowed;}
        @media (max-width: 980px){
          .kbdr2-mobile-quickviews{display:flex;gap:8px;overflow-x:auto;padding:10px 14px 9px;border-bottom:1px solid rgba(223,213,194,0.48);background:rgba(255,253,248,0.78);scrollbar-width:none;}
          .kbdr2-mobile-quickviews::-webkit-scrollbar{display:none;}
          .kbdr2-mobile-glance{display:flex;gap:8px;overflow-x:auto;padding:9px 12px 10px;border-bottom:1px solid rgba(223,213,194,0.55);background:#fffdf8;scrollbar-width:none;}
          .kbdr2-mobile-glance::-webkit-scrollbar{display:none;}
        }
        @media (max-width: 640px){
          .kbdr2-deals-tabs{display:none !important;}
          .kbdr2-mobile-quickviews{padding:9px 12px 8px;}
          .kbdr2-mobile-quickview{height:32px;padding:0 10px;font-size:11.5px !important;}
          .kbdr2-mobile-glance{padding:8px 10px 9px;}
          .kbdr2-mobile-glance-pill{max-width:180px;font-size:11px;padding:6px 9px;}
          .kbdr2-load-older-wrap{margin:0 0 14px;}
        }


        /* v22 mobile QA patch — Deal Room / Inbox */
        @media (max-width: 980px){
          .kbdr2-root{height:calc(100svh - 60px) !important;min-height:0 !important;overflow:hidden !important;}
          .kbdr2-main{min-height:0 !important;}
          .kbdr2-content{min-height:0 !important;overflow:hidden !important;}
          .kbdr2-deals,.kbdr2-work{min-height:0 !important;}
          .kbdr2-work-head{position:sticky;top:0;z-index:12;}
          .kbdr2-header-menu{position:fixed !important;top:116px !important;right:14px !important;left:auto !important;width:min(280px,calc(100vw - 28px)) !important;max-height:calc(100svh - 150px) !important;overflow:auto !important;}
        }
        @media (max-width: 640px){
          .kbdr2-topbar{height:58px !important;padding:8px 10px !important;gap:8px !important;}
          .kbdr2-search{height:40px !important;padding:0 12px !important;border-radius:14px !important;}
          .kbdr2-content{padding:0 10px 10px !important;}
          .kbdr2-deals,.kbdr2-work{border-radius:18px !important;box-shadow:0 8px 22px rgba(28,40,20,0.07) !important;}
          .kbdr2-deals-head{padding:14px 14px 10px !important;}
          .kbdr2-deals-title{font-size:22px !important;}
          .kbdr2-deals-summary{padding:0 14px 8px !important;}
          .kbdr2-deals-tabs{padding:0 14px !important;gap:16px !important;}
          .kbdr2-deal-row{padding:12px 12px !important;gap:10px !important;}
          .kbdr2-deal-name,.kbdr2-deal-vendor,.kbdr2-deal-preview,.kbdr2-work-title,.kbdr2-file-name,.kbdr2-file-row-name{overflow-wrap:anywhere !important;word-break:break-word !important;}
          .kbdr2-deal-name,.kbdr2-deal-vendor{white-space:normal !important;display:-webkit-box !important;-webkit-line-clamp:1 !important;-webkit-box-orient:vertical !important;overflow:hidden !important;}
          .kbdr2-work-head{padding:12px 12px !important;gap:9px !important;}
          .kbdr2-work-avatar{width:40px !important;height:40px !important;font-size:13px !important;}
          .kbdr2-work-info{min-width:0 !important;}
          .kbdr2-work-title{font-size:19px !important;line-height:1.08 !important;white-space:normal !important;}
          .kbdr2-work-meta{font-size:12px !important;gap:7px !important;}
          .kbdr2-work-actions{width:100% !important;display:grid !important;grid-template-columns:minmax(0,1fr) 38px !important;gap:8px !important;}
          .kbdr2-work-actions .kbdr2-primary-btn{width:100% !important;justify-content:center !important;min-width:0 !important;}
          .kbdr2-work-tabs{padding:0 12px !important;gap:20px !important;}
          .kbdr2-lifecycle{padding:10px 12px 12px !important;}
          .kbdr2-next-strip{margin:10px 12px 0 !important;padding:11px 12px !important;border-radius:14px !important;gap:10px !important;}
          .kbdr2-next-strip-text{font-size:12px !important;}
          .kbdr2-stream{padding:14px 12px 8px !important;overscroll-behavior:contain !important;scrollbar-gutter:auto !important;}
          .kbdr2-msg-row{gap:8px !important;margin-bottom:14px !important;}
          .kbdr2-msg-avatar{width:28px !important;height:28px !important;font-size:10px !important;}
          .kbdr2-bubble{max-width:88% !important;padding:12px 13px !important;border-radius:14px !important;font-size:13.5px !important;}
          .kbdr2-tab-body{padding:14px 12px 16px !important;overscroll-behavior:contain !important;}
          .kbdr2-section{padding:16px 14px !important;border-radius:16px !important;}
          .kbdr2-ms-row,.kbdr2-file-row{padding:12px !important;gap:10px !important;}
          .kbdr2-ms-amt{width:100% !important;margin-left:38px !important;}
          .kbdr2-composer{padding:10px 10px calc(10px + env(safe-area-inset-bottom,0px)) !important;}
          .kbdr2-composer-hint{display:none !important;}
          .kbdr2-composer-inner{border-radius:14px !important;align-items:center !important;}
          .kbdr2-composer textarea{font-size:16px !important;max-height:92px !important;padding:10px 8px !important;}
          .kbdr2-composer-tools{display:none !important;}
          .kbdr2-composer-send{width:40px !important;height:40px !important;border-radius:11px !important;margin:3px !important;}
        }
        @media (max-width: 480px){
          .kbdr2-root{height:calc(100svh - 60px - 62px - env(safe-area-inset-bottom,0px)) !important;}
          .kbdr2-content{padding:0 8px 8px !important;}
          .kbdr2-deals,.kbdr2-work{border-radius:16px !important;}
          .kbdr2-topbar-icon:nth-of-type(2){display:none !important;}
          .kbdr2-bubble{max-width:92% !important;}
          .kbdr2-prop-cta{display:grid !important;grid-template-columns:1fr !important;gap:8px !important;}
          .kbdr2-prop-cta > button{width:100% !important;justify-content:center !important;}
        }

        /* v26 inbox viewport fit pass — fixes right-edge clipping without adding another sidebar/scrollbar */
        .kbdr2-root{
          width:100% !important;
          max-width:100% !important;
          min-width:0 !important;
          overflow-x:clip !important;
        }
        .kbdr2-main,.kbdr2-topbar,.kbdr2-content,.kbdr2-deals,.kbdr2-work{
          min-width:0 !important;
          max-width:100% !important;
        }
        .kbdr2-main{width:100% !important;overflow:hidden !important;}
        .kbdr2-content{
          width:100% !important;
          grid-template-columns:minmax(300px,clamp(300px,27vw,360px)) minmax(0,1fr) !important;
          gap:clamp(12px,1.2vw,16px) !important;
          padding-left:clamp(12px,1.35vw,22px) !important;
          padding-right:clamp(12px,1.35vw,22px) !important;
          overflow:hidden !important;
        }
        .kbdr2-work-head,.kbdr2-work-info,.kbdr2-work-actions,.kbdr2-work-tabs,.kbdr2-thread-context,.kbdr2-stream,.kbdr2-composer{
          min-width:0 !important;
          max-width:100% !important;
        }
        .kbdr2-work-actions .kbdr2-primary-btn{
          max-width:min(220px,34vw) !important;
          overflow:hidden !important;
          text-overflow:ellipsis !important;
        }
        .kbdr2-lifecycle{
          overflow:hidden !important;
          justify-content:stretch !important;
        }
        .kbdr2-lifecycle-step{
          min-width:0 !important;
          flex:1 1 0 !important;
        }
        .kbdr2-lifecycle-line{
          min-width:8px !important;
          flex:1 1 18px !important;
          margin-left:6px !important;
          margin-right:6px !important;
        }
        .kbdr2-lifecycle-text{
          max-width:100% !important;
          overflow:hidden !important;
          text-overflow:ellipsis !important;
        }
        .kbdr2-work-tabs{
          overflow-x:auto !important;
          scrollbar-width:none !important;
        }
        .kbdr2-work-tabs::-webkit-scrollbar{display:none !important;}
        @media (max-width: 1240px){
          .kbdr2-content{
            grid-template-columns:minmax(272px,318px) minmax(0,1fr) !important;
            gap:12px !important;
            padding-left:12px !important;
            padding-right:12px !important;
            padding-bottom:12px !important;
          }
          .kbdr2-deals-head{padding:18px 18px 12px !important;}
          .kbdr2-deals-title{font-size:24px !important;}
          .kbdr2-deals-subtitle{font-size:12px !important;max-width:245px !important;}
          .kbdr2-work-head{padding:16px 18px 14px !important;gap:12px !important;}
          .kbdr2-work-title{font-size:22px !important;}
          .kbdr2-work-actions .kbdr2-primary-btn{max-width:176px !important;}
          .kbdr2-lifecycle{padding-left:18px !important;padding-right:18px !important;}
          .kbdr2-lifecycle-text{font-size:10px !important;}
          .kbdr2-lifecycle-line{min-width:6px !important;margin-left:4px !important;margin-right:4px !important;}
          .kbdr2-thread-context{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}
          .kbdr2-thread-context-link{grid-column:1/-1 !important;justify-self:start !important;}
        }
        @media (max-width: 1080px){
          .kbdr2-search{max-width:none !important;}
          .kbdr2-user-chip{padding-right:9px !important;}
          .kbdr2-user-name{max-width:120px !important;}
        }
        /* v27 inbox mobile collapse override — earlier !important fit-pass rules
           (lines ~7088 and ~7410) pinned .kbdr2-content to a 2-column grid
           unconditionally, which won over the original 980px single-column
           collapse (no !important). Result on mobile: deals/work toggle via
           display:none/flex but render inside a still-2-column grid, leaving
           an empty 272-318px void column. Re-assert single-column with
           !important so the active pane uses the full viewport width. */
        @media (max-width: 980px){
          .kbdr2-content{grid-template-columns:1fr !important;gap:0 !important;}
        }

        /* v28 inbox composer visibility fix — keep the reply bar visible without adding another scrollbar */
        .kbdr2-work{
          position:relative !important;
        }
        .kbdr2-composer{
          position:absolute !important;
          left:0 !important;
          right:0 !important;
          bottom:0 !important;
          z-index:40 !important;
          flex:0 0 auto !important;
          border-top:1px solid rgba(223,213,194,0.92) !important;
          box-shadow:0 -16px 34px rgba(28,40,20,0.10) !important;
        }
        .kbdr2-stream{
          flex:1 1 auto !important;
          min-height:0 !important;
          padding-bottom:132px !important;
        }
        .kbdr2-thread-context{
          margin-top:10px !important;
          padding:8px !important;
          gap:8px !important;
        }
        .kbdr2-thread-context-item{
          padding:7px 9px !important;
        }
        .kbdr2-command-card{
          display:none !important;
        }
        .kbdr2-next-strip{
          display:none !important;
        }
        @media (max-width: 1240px){
          .kbdr2-stream{padding-bottom:124px !important;}
          .kbdr2-thread-context{margin-left:18px !important;margin-right:18px !important;}
        }
        @media (max-width: 640px){
          .kbdr2-composer{
            padding:9px 10px calc(9px + env(safe-area-inset-bottom,0px)) !important;
          }
          .kbdr2-stream{padding-bottom:92px !important;}
          .kbdr2-thread-context{display:none !important;}
        }

        /* v29 inbox real-use cleanup — message area gets priority, no extra sidebars/scrollbars */
        .kbdr2-work-message-mode .kbdr2-work-head{
          padding:7px 18px !important;
          gap:9px !important;
          min-height:0 !important;
          align-items:center !important;
        }
        .kbdr2-work-message-mode .kbdr2-work-avatar{
          width:28px !important;
          height:28px !important;
          font-size:10px !important;
        }
        .kbdr2-work-message-mode .kbdr2-work-eyebrow{
          display:none !important;
        }
        .kbdr2-work-message-mode .kbdr2-work-title{
          font-size:15px !important;
          line-height:1.2 !important;
          margin-bottom:0 !important;
        }
        .kbdr2-work-message-mode .kbdr2-work-meta{
          display:none !important;
        }
        .kbdr2-work-message-mode .kbdr2-work-actions .kbdr2-primary-btn{
          height:30px !important;
          padding:0 14px !important;
          font-size:12px !important;
        }
        .kbdr2-work-message-mode .kbdr2-lifecycle{
          display:none !important;
        }
        .kbdr2-work-message-mode .kbdr2-deal-snapshot{
          display:none !important;
        }
        .kbdr2-work-message-mode .kbdr2-lifecycle-step{
          min-width:26px !important;
          flex:0 1 26px !important;
          gap:0 !important;
          position:relative !important;
        }
        .kbdr2-work-message-mode .kbdr2-lifecycle-pip{
          width:18px !important;
          height:18px !important;
          font-size:9px !important;
          border-width:1.5px !important;
        }
        .kbdr2-work-message-mode .kbdr2-lifecycle-step.current .kbdr2-lifecycle-pip{
          box-shadow:0 0 0 3px rgba(31,58,46,0.10) !important;
        }
        .kbdr2-work-message-mode .kbdr2-lifecycle-text{
          position:absolute !important;
          width:1px !important;
          height:1px !important;
          padding:0 !important;
          margin:-1px !important;
          overflow:hidden !important;
          clip:rect(0 0 0 0) !important;
          white-space:nowrap !important;
          border:0 !important;
        }
        .kbdr2-work-message-mode .kbdr2-lifecycle-line{
          margin:0 5px !important;
          min-width:10px !important;
          height:2px !important;
          flex:1 1 14px !important;
        }
        .kbdr2-work-message-mode .kbdr2-lifecycle.declined{
          min-height:36px !important;
          padding:8px 20px !important;
        }
        .kbdr2-work-message-mode .kbdr2-work-tabs{
          padding:0 20px !important;
          gap:22px !important;
          min-height:43px !important;
        }
        .kbdr2-work-message-mode .kbdr2-work-tab{
          padding:11px 0 12px !important;
          font-size:13px !important;
        }
        .kbdr2-work-message-mode .kbdr2-thread-context{
          margin:8px 20px 0 !important;
          padding:6px !important;
          display:flex !important;
          align-items:center !important;
          gap:7px !important;
          overflow-x:auto !important;
          scrollbar-width:none !important;
          background:rgba(255,250,243,0.86) !important;
        }
        .kbdr2-work-message-mode .kbdr2-thread-context::-webkit-scrollbar{display:none !important;}
        .kbdr2-work-message-mode .kbdr2-thread-context-item{
          flex:0 0 auto !important;
          min-width:104px !important;
          padding:6px 10px !important;
          border-radius:8px !important;
        }
        .kbdr2-work-message-mode .kbdr2-thread-context-item span{
          font-size:8.5px !important;
          letter-spacing:0.14em !important;
          margin-bottom:2px !important;
        }
        .kbdr2-work-message-mode .kbdr2-thread-context-item strong{
          font-size:12px !important;
          max-width:160px !important;
        }
        .kbdr2-work-message-mode .kbdr2-thread-context-link{
          flex:0 0 auto !important;
          height:31px !important;
          padding:0 11px !important;
          font-size:11.5px !important;
        }
        .kbdr2-work-message-mode .kbdr2-failed-banner{
          margin:8px 20px 0 !important;
        }
        .kbdr2-work-message-mode .kbdr2-stream{
          scrollbar-gutter:stable;
        }
        .kbdr2-work-message-mode .kbdr2-thread-empty{
          margin:22px auto 18px !important;
          padding:22px 22px !important;
          max-width:420px !important;
        }
        .kbdr2-work-message-mode .kbdr2-thread-empty-icon{
          width:46px !important;
          height:46px !important;
          border-radius:16px !important;
          margin-bottom:10px !important;
        }
        .kbdr2-work-message-mode .kbdr2-thread-empty-title{
          font-size:19px !important;
          margin-bottom:5px !important;
        }
        .kbdr2-work-message-mode .kbdr2-thread-empty-sub{
          font-size:12.5px !important;
          line-height:1.5 !important;
          margin-bottom:14px !important;
        }
        .kbdr2-work-message-mode .kbdr2-msg-row{
          margin-bottom:14px !important;
        }
        .kbdr2-work-message-mode .kbdr2-day-label{
          display:none !important;
        }
        .kbdr2-work-message-mode .kbdr2-composer{
          padding:10px 18px 14px !important;
        }
        .kbdr2-work-message-mode .kbdr2-composer-hint{
          margin-bottom:6px !important;
        }
        .kbdr2-work-message-mode .kbdr2-composer-inner{
          border-radius:16px !important;
        }
        .kbdr2-work-message-mode .kbdr2-composer textarea{
          min-height:22px !important;
          max-height:110px !important;
          padding:10px 9px !important;
        }
        .kbdr2-work-message-mode .kbdr2-composer-send{
          height:30px !important;
          min-height:30px !important;
          margin:2px !important;
        }
        .kbdr2-deal-line1{
          display:grid !important;
          grid-template-columns:minmax(0,1fr) auto !important;
          align-items:center !important;
          gap:8px !important;
        }
        .kbdr2-deal-name,
        .kbdr2-deal-vendor,
        .kbdr2-deal-preview{
          min-width:0 !important;
        }
        .kbdr2-deal-badge{
          max-width:108px !important;
          overflow:hidden !important;
          text-overflow:ellipsis !important;
        }
        .kbdr2-deal-right{
          min-width:56px !important;
        }
        .kbdr2-deal-time{
          font-variant-numeric:tabular-nums !important;
        }
        .kbdr2-priority-line{
          display:grid !important;
          grid-template-columns:7px minmax(0,1fr) !important;
          align-items:start !important;
        }
        .kbdr2-priority-line span:last-child{
          min-width:0 !important;
          overflow:hidden !important;
          display:-webkit-box !important;
          -webkit-line-clamp:2 !important;
          -webkit-box-orient:vertical !important;
        }
        @media (max-width: 980px){
          .kbdr2-work-message-mode .kbdr2-work-head{
            min-height:58px !important;
          }
          .kbdr2-work-message-mode .kbdr2-lifecycle{
            display:none !important;
          }
          .kbdr2-work-message-mode .kbdr2-thread-context{
            display:none !important;
          }
          .kbdr2-work-message-mode .kbdr2-work-tabs{
            min-height:40px !important;
          }
        }
        @media (max-width: 640px){
          .kbdr2-work-message-mode .kbdr2-work-head{
            padding:10px 12px !important;
            gap:9px !important;
          }
          .kbdr2-work-message-mode .kbdr2-work-avatar{
            width:34px !important;
            height:34px !important;
            font-size:11.5px !important;
          }
          .kbdr2-work-message-mode .kbdr2-work-title{
            font-size:18px !important;
          }
          .kbdr2-work-message-mode .kbdr2-work-meta{
            font-size:11.5px !important;
            white-space:nowrap !important;
            overflow:hidden !important;
            display:block !important;
            text-overflow:ellipsis !important;
          }
          .kbdr2-work-message-mode .kbdr2-work-tabs{
            padding:0 12px !important;
            gap:16px !important;
            overflow-x:auto !important;
          }
          .kbdr2-work-message-mode .kbdr2-work-tab{
            padding:10px 0 !important;
            font-size:12.5px !important;
          }
          .kbdr2-work-message-mode .kbdr2-stream{
            scrollbar-gutter:auto !important;
          }
          .kbdr2-work-message-mode .kbdr2-thread-empty{
            margin:14px 4px 12px !important;
            padding:18px 14px !important;
          }
          .kbdr2-work-message-mode .kbdr2-composer{
            padding:8px 9px calc(8px + env(safe-area-inset-bottom,0px)) !important;
          }
        }


        .kbdr2-inbox-stats{display:flex;align-items:center;gap:6px;padding:0 18px 12px;flex-shrink:0;flex-wrap:wrap;}
        .kbdr2-inbox-stat{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:600;color:#4a5547;background:rgba(31,58,46,0.05);border:1px solid transparent;cursor:pointer;transition:all 0.12s;}
        .kbdr2-inbox-stat:hover{background:rgba(31,58,46,0.09);color:#1F3A2E;}
        .kbdr2-inbox-stat.warn{color:#7a4216;background:rgba(224,140,55,0.10);border-color:rgba(224,140,55,0.15);}
        .kbdr2-inbox-stat-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0;}
        .kbdr2-inbox-all-clear{font-size:12px;color:#8a9585;padding:0 4px;}
        @media (max-width:640px){.kbdr2-deal-snapshot{margin:10px 10px 0;padding:11px;border-radius:16px;}.kbdr2-deal-snapshot-grid{grid-template-columns:1fr 1fr;gap:7px;}.kbdr2-deal-snapshot-card{padding:10px;border-radius:13px;}.kbdr2-deal-snapshot-actions{grid-template-columns:1fr;}.kbdr2-deal-snapshot-action{padding:10px;border-radius:13px;}}

        /* ═══════════════════ 731 INBOX RAIL REMOVAL LOCK ═══════════════════
           The Inbox no longer uses the viewport-triggered third rail. Keep one stable
           two-pane layout on desktop and let the existing thread context remain in the
           message column until the next consolidation patch. */
        .kbdr2-content.has-rail{grid-template-columns:minmax(300px,320px) minmax(0,1fr) !important;gap:16px !important}
        .kbdr2-content.has-rail .kbdr2-command-card,
        .kbdr2-content.has-rail .kbdr2-next-strip,
        .kbdr2-content.has-rail .kbdr2-thread-context{display:flex !important}

        .kbdr2-rail{display:none !important;flex-direction:column;background:#fff;border-radius:20px;border:1px solid #dfd5c2;box-shadow:0 8px 26px rgba(28,40,20,0.06);overflow-y:auto;overflow-x:hidden;min-height:0;padding:18px 16px 18px}
        .kbdr2-rail::-webkit-scrollbar{width:6px}
        .kbdr2-rail::-webkit-scrollbar-thumb{background:rgba(20,21,24,0.08);border-radius:999px}
        .kbdr2-rail-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:32px 20px;text-align:center;color:#7d8a77;flex:1;min-height:0}
        .kbdr2-rail-empty-icon{width:42px;height:42px;border-radius:12px;background:#f3f6ef;color:#4a6b4a;display:flex;align-items:center;justify-content:center}
        .kbdr2-rail-empty-title{font-family:'Playfair Display',Georgia,serif;font-size:17px;font-weight:700;color:#1F3A2E;letter-spacing:-0.01em;margin-top:4px}
        .kbdr2-rail-empty-sub{font-size:12.5px;color:#7d8a77;line-height:1.45;max-width:240px}
        .kbdr2-rail-section{display:flex;flex-direction:column;gap:8px;padding:0 4px 16px;margin-bottom:16px;border-bottom:1px solid #efe7d9}
        .kbdr2-rail-section:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
        .kbdr2-rail-section-label{font-size:10.5px;font-weight:800;letter-spacing:0.10em;text-transform:uppercase;color:#8a6729}
        .kbdr2-rail-title{font-family:'Playfair Display',Georgia,serif;font-size:17px;font-weight:700;color:#1F3A2E;letter-spacing:-0.018em;line-height:1.18;overflow-wrap:anywhere;margin:0}
        .kbdr2-rail-counterparty{font-size:12.5px;color:#556b51;font-weight:600;line-height:1.4;overflow-wrap:anywhere}
        .kbdr2-rail-kv{display:grid;grid-template-columns:1fr 1fr;gap:8px 10px;margin-top:4px}
        .kbdr2-rail-kv > div{display:flex;flex-direction:column;gap:2px;min-width:0}
        .kbdr2-rail-kv-label{font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#8a9585}
        .kbdr2-rail-kv-value{font-size:13px;font-weight:700;color:#1F3A2E;line-height:1.25;overflow-wrap:anywhere}
        .kbdr2-rail-stage{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:#f3f6ef;color:#1F3A2E;font-size:11px;font-weight:700;align-self:flex-start;letter-spacing:0.01em}
        .kbdr2-rail-stage-dot{width:6px;height:6px;border-radius:50%;background:#4a6b4a}
        .kbdr2-rail-next{padding:12px 14px;border-radius:14px;background:#fbf6ea;border:1px solid rgba(196,151,58,0.20);display:flex;flex-direction:column;gap:6px}
        .kbdr2-rail-next-eyebrow{font-size:10px;font-weight:800;letter-spacing:0.10em;text-transform:uppercase;color:#8a6729}
        .kbdr2-rail-next-text{font-size:12.5px;color:#1F3A2E;line-height:1.45;font-weight:500}
        .kbdr2-rail-next-cta{align-self:flex-start;margin-top:4px;padding:7px 14px;border-radius:999px;background:#1F3A2E;color:#fff;font-size:11.5px;font-weight:800;letter-spacing:0.01em;cursor:pointer;border:none;transition:background 0.15s}
        .kbdr2-rail-next-cta:hover{background:#17281F}
        .kbdr2-rail-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}
        .kbdr2-rail-action{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;padding:0 10px;border-radius:10px;background:#fffdf8;border:1px solid #dfd5c2;color:#1F3A2E;font-size:12px;font-weight:700;cursor:pointer;transition:background 0.12s,border-color 0.12s;text-align:center}
        .kbdr2-rail-action:hover{background:#f3f6ef;border-color:#c8bea5}
        .kbdr2-rail-action.full{grid-column:1 / -1}

        /* 731 safety: no hidden desktop rail scrollbars or third column. */
        .kbdr2-content{grid-template-columns:minmax(300px,320px) minmax(0,1fr) !important;}
        .kbdr2-rail{display:none !important;}

        /* ═══════════════════ v28 INBOX POLISH ═══════════════════
           Calmer hierarchy and more uniform card heights for the
           left conversation list, quieter readability for the
           middle thread bubbles, and premium send-button sizing
           in message mode. Append-only. No JSX changes. */

        /* Left list — uniform card heights. The v23 layer expanded
           preview to -webkit-line-clamp:2, so rows ranged ~85-140px
           depending on text length. Lock preview to 1 line and the
           priority line to 1 line so every row has a stable height. */
        .kbdr2-deal-preview{-webkit-line-clamp:1 !important;line-height:1.4 !important;color:#7d786c !important}
        .kbdr2-priority-line span:last-child{-webkit-line-clamp:1 !important}
        .kbdr2-priority-line{margin-top:6px !important;font-size:11px !important;color:#766d61 !important}
        .kbdr2-priority-dot{width:5px !important;height:5px !important;margin-top:5px !important;box-shadow:none !important}
        /* Slightly more vertical breathing inside each row so the
           single-line clamp doesn't make rows feel tight. Scoped to
           >=641px so the mobile 12/12 padding (line ~7366) wins below. */
        @media (min-width:641px){.kbdr2-deal-row{padding:13px 16px !important}}
        /* Quieten the active-state lift. The previous 14/34 shadow
           read too heavy next to the gold accent stripe; the gold
           stripe + white background already make active obvious. */
        .kbdr2-deal-row.active{box-shadow:0 6px 16px rgba(28,40,20,0.06) !important}
        /* Smaller, quieter inline mute/snoozed icons next to the
           project title — the row's muted class already softens the
           name color, so these are decorative reinforcement. */
        .kbdr2-deal-name svg{width:9px !important;height:9px !important;opacity:0.55}

        /* Middle thread — readable bubble width on wide displays.
           At 1600px+ (rail off) the middle 1fr could push bubbles to
           ~860px wide, which is past comfortable reading. Cap at
           640px (~75 chars at 14/1.5). 72% rule still applies on
           narrower middle panes. Scoped to >=641px so the mobile
           88% / 480px-92% widths win below. */
        @media (min-width:641px){.kbdr2-bubble{max-width:min(82%, 760px) !important;line-height:1.55 !important}}
        .kbdr2-bubble-time{opacity:0.55 !important;font-weight:500 !important}
        /* Slightly tighter row gap so consecutive messages cluster.
           Scoped to >=641px so mobile's gap:8px override stays intact. */
        @media (min-width:641px){.kbdr2-msg-row{margin-bottom:14px !important}}

        /* Composer — premium send button in message mode. The v23
           layer already drops the height to 38 in message mode but
           leaves width at 42, producing a slightly off square. Match
           width to height for a balanced 38x38 chip. Scoped to
           >=641px so the deliberate mobile 40x40 sizing wins below. */


        /* v30 inbox message-board reconstruction — keep the panels, make the middle thread feel like the workspace */
        .kbdr2-work-message-mode .kbdr2-lifecycle{
          display:none !important;
        }
        .kbdr2-work-message-mode .kbdr2-thread-context{
          display:none !important;
        }
        .kbdr2-work-message-mode .kbdr2-work-tabs{
          min-height:42px !important;
          padding:0 22px !important;
          gap:22px !important;
          background:#fffdf8 !important;
          border-top:1px solid rgba(223,213,194,0.42) !important;
          border-bottom:1px solid rgba(223,213,194,0.62) !important;
        }
        .kbdr2-work-message-mode .kbdr2-work-tab{
          padding:12px 0 10px !important;
          color:#7b7468 !important;
          font-size:12.5px !important;
          font-weight:800 !important;
          letter-spacing:0.01em !important;
        }
        .kbdr2-work-message-mode .kbdr2-work-tab.active{
          color:#1F3A2E !important;
        }
        .kbdr2-work-message-mode .kbdr2-work-tab.active::after{
          height:2px !important;
          border-radius:999px !important;
          background:#1F3A2E !important;
        }
        .kbdr2-work-message-mode .kbdr2-stream{
          padding:22px 32px 138px !important;
          background:linear-gradient(180deg,#fff 0%,#fffdf8 100%) !important;
        }
        .kbdr2-work-message-mode .kbdr2-day-label{
          display:none !important;
        }
        .kbdr2-work-message-mode .kbdr2-msg-row{
          margin-bottom:18px !important;
        }
        .kbdr2-work-message-mode .kbdr2-bubble{
          box-shadow:0 6px 16px rgba(28,40,20,0.045) !important;
        }
        .kbdr2-work-message-mode .kbdr2-bubble.them{
          background:#fffdf8 !important;
          border-color:rgba(223,213,194,0.86) !important;
        }
        .kbdr2-work-message-mode .kbdr2-bubble.me{
          box-shadow:0 9px 22px rgba(31,58,46,0.15) !important;
        }
        .kbdr2-work-message-mode .kbdr2-composer{
          padding:6px 16px 8px !important;
          background:linear-gradient(180deg,rgba(255,253,248,0.96),#fff8ed) !important;
          border-top:1px solid rgba(223,213,194,0.86) !important;
          box-shadow:0 -12px 28px rgba(28,40,20,0.075) !important;
        }
        .kbdr2-work-message-mode .kbdr2-composer-inner{
          border-radius:10px !important;
          box-shadow:0 2px 8px rgba(28,40,20,0.04) !important;
          padding:1px !important;
        }
        .kbdr2-work-message-mode .kbdr2-composer textarea{
          min-height:18px !important;
          max-height:100px !important;
          padding:7px 9px !important;
        }
        .kbdr2-work-message-mode .kbdr2-composer-meta{
          padding-top:7px !important;
          color:#8a8174 !important;
        }
        @media (max-width:980px){
          .kbdr2-work-message-mode .kbdr2-work-tabs{
            padding:0 16px !important;
            gap:18px !important;
          }
          .kbdr2-work-message-mode .kbdr2-stream{
            padding:16px 16px 104px !important;
          }
        }
        @media (max-width:640px){
          .kbdr2-work-message-mode .kbdr2-work-tabs{
            padding:0 12px !important;
            min-height:38px !important;
          }
          .kbdr2-work-message-mode .kbdr2-stream{
            padding:12px 10px 88px !important;
          }
          .kbdr2-work-message-mode .kbdr2-msg-row{
            margin-bottom:14px !important;
          }
          .kbdr2-work-message-mode .kbdr2-composer{
            padding:8px 9px calc(8px + env(safe-area-inset-bottom,0px)) !important;
          }
        }

                @media (min-width:641px){.kbdr2-work-message-mode .kbdr2-composer-send{width:38px !important;border-radius:9px !important}}
        /* Calmer disabled state so the empty/disabled composer
           reads as intentional rather than "broken". */
        .kbdr2-composer textarea:disabled::placeholder{color:#a8b3a3 !important;font-style:italic}
        .kbdr2-composer-send:disabled{background:#cfd6cb !important;color:#fff !important}


        /* ═══════════════════ 0171 CANONICAL DEAL ROOM FOUNDATION ═══════════════════
           Read-only Checkpoint 1: canonical hired-project detection + premium
           project-centric overview. Lifecycle writes remain untouched. */
        .kbdr2-canonical-dealroom{background:#fffdf8 !important;}
        .kbdr2-canonical-dealroom:not(.kbdr2-work-message-mode) .kbdr2-work-head{
          padding:18px 24px 16px !important;
          border-bottom:0 !important;
          background:linear-gradient(180deg,#fffdf8 0%,#fffaf1 100%) !important;
        }
        .kbdr2-canonical-dealroom:not(.kbdr2-work-message-mode) .kbdr2-work-eyebrow{
          display:block !important;
          font-size:9.5px !important;
          font-weight:850 !important;
          letter-spacing:.15em !important;
          text-transform:uppercase !important;
          color:#9b7432 !important;
          margin-bottom:4px !important;
        }
        .kbdr2-canonical-dealroom:not(.kbdr2-work-message-mode) .kbdr2-work-title{
          font-size:26px !important;
          line-height:1.04 !important;
          color:#182313 !important;
        }
        .kbdr2-canonical-dealroom:not(.kbdr2-work-message-mode) .kbdr2-work-meta{
          display:flex !important;
          margin-top:5px !important;
          color:#6f695f !important;
        }
        .kbdr2-dealroom-switcher{
          display:flex;align-items:center;gap:4px;padding:0 24px;border-top:1px solid rgba(223,213,194,.48);border-bottom:1px solid rgba(223,213,194,.72);background:#fffdf8;flex-shrink:0;
        }
        .kbdr2-dealroom-switch{
          position:relative;display:inline-flex;align-items:center;gap:7px;padding:12px 2px 11px;margin-right:20px;color:#7a7367;font-size:12.5px;font-weight:800;letter-spacing:.01em;background:transparent;border:0;
        }
        .kbdr2-dealroom-switch::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;border-radius:999px;background:transparent;}
        .kbdr2-dealroom-switch.active{color:#1F3A2E;}
        .kbdr2-dealroom-switch.active::after{background:#9b7432;}
        .kbdr2-dealroom-switch-count{min-width:18px;height:18px;padding:0 5px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:#f0e7d6;color:#715525;font-size:10px;font-weight:900;}
        .kbdr2-canonical-overview{
          flex:1;min-height:0;overflow-y:auto;padding:clamp(20px,2.6vw,34px);background:linear-gradient(180deg,#fffdf8 0%,#fbf6ea 100%);scrollbar-width:thin;scrollbar-color:rgba(28,40,20,.13) transparent;
        }
        .kbdr2-canonical-overview::-webkit-scrollbar{width:7px;}
        .kbdr2-canonical-overview::-webkit-scrollbar-thumb{background:rgba(28,40,20,.13);border-radius:999px;}
        .kbdr2-canonical-next{
          position:relative;overflow:hidden;padding:clamp(24px,3vw,36px);border:1px solid rgba(184,146,73,.26);border-radius:22px;background:linear-gradient(135deg,#fffdf8 0%,#fbf3e4 100%);box-shadow:0 12px 34px rgba(42,53,32,.055);
        }
        .kbdr2-canonical-next::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#c4973a,#8d6929);}
        .kbdr2-canonical-next-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;}
        .kbdr2-canonical-kicker{display:block;font-size:9.5px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#8a6729;line-height:1.2;}
        .kbdr2-canonical-status{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;border:1px solid rgba(31,58,46,.10);background:#f3f6ef;color:#355846;font-size:10.5px;font-weight:850;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;}
        .kbdr2-canonical-status.review{background:#fbf1dc;border-color:rgba(177,132,53,.20);color:#7d5c20;}
        .kbdr2-canonical-status.complete{background:#eef3ea;color:#4c654c;}
        .kbdr2-canonical-status.hired{background:#fbf3e4;color:#7f6028;}
        .kbdr2-canonical-next h2{margin:0;color:#182313;font-family:'Playfair Display','Newsreader',Georgia,serif;font-size:clamp(27px,3vw,38px);font-weight:750;letter-spacing:-.035em;line-height:1.04;max-width:760px;}
        .kbdr2-canonical-next p{margin:12px 0 0;max-width:720px;color:#625d52;font-size:14px;line-height:1.65;font-weight:500;}
        .kbdr2-canonical-action-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:20px;}
        .kbdr2-canonical-action-primary,.kbdr2-canonical-action-secondary{min-height:42px;padding:10px 16px;border-radius:11px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:850;letter-spacing:.01em;transition:transform .16s ease,box-shadow .16s ease,background .16s ease,border-color .16s ease;cursor:pointer;}
        .kbdr2-canonical-action-primary{border:1px solid #1F3A2E;background:#1F3A2E;color:#fff;box-shadow:0 8px 18px rgba(31,58,46,.13);}
        .kbdr2-canonical-action-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 21px rgba(31,58,46,.17);}
        .kbdr2-canonical-action-secondary{border:1px solid rgba(31,58,46,.18);background:rgba(255,253,248,.76);color:#1F3A2E;}
        .kbdr2-canonical-action-secondary:hover:not(:disabled){border-color:rgba(31,58,46,.32);background:#fffdf8;}
        .kbdr2-canonical-action-primary:disabled,.kbdr2-canonical-action-secondary:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:none;}
        .kbdr2-canonical-action-error{margin-top:13px;padding:10px 12px;border-radius:10px;border:1px solid rgba(156,71,58,.20);background:#fff5f1;color:#8b3f34;font-size:11.5px;font-weight:650;line-height:1.45;}
        .kbdr2-canonical-action-panel{margin-top:16px;padding:16px;border:1px solid rgba(155,116,50,.20);border-radius:14px;background:rgba(255,253,248,.88);box-shadow:0 8px 20px rgba(42,53,32,.035);}
        .kbdr2-canonical-action-panel>div:first-child>strong{display:block;color:#1c2814;font-family:'Playfair Display','Newsreader',Georgia,serif;font-size:17px;line-height:1.2;}
        .kbdr2-canonical-action-panel>div:first-child>p{margin:6px 0 0;color:#6d665a;font-size:12px;line-height:1.55;}
        .kbdr2-canonical-action-panel textarea{width:100%;margin-top:12px;padding:11px 12px;border:1px solid #ded2be;border-radius:11px;background:#fff;color:#1c2814;font-family:'DM Sans',sans-serif;font-size:12.5px;line-height:1.5;resize:vertical;outline:none;}
        .kbdr2-canonical-action-panel textarea:focus{border-color:#aa8137;box-shadow:0 0 0 3px rgba(170,129,55,.10);}
        .kbdr2-canonical-action-panel-buttons{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .kbdr2-canonical-action-panel-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;}
        .kbdr2-canonical-action-panel-footer>span{color:#8a8174;font-size:10.5px;font-weight:700;}
        .kbdr2-canonical-agreement{margin-top:18px;padding:22px;border:1px solid rgba(223,213,194,.90);border-radius:18px;background:rgba(255,255,255,.78);box-shadow:0 7px 22px rgba(42,53,32,.035);}
        .kbdr2-canonical-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:16px;}
        .kbdr2-canonical-section-head h3{margin:5px 0 0;color:#1c2814;font-family:'Playfair Display','Newsreader',Georgia,serif;font-size:20px;line-height:1.15;letter-spacing:-.025em;}
        .kbdr2-canonical-text-link{flex:0 0 auto;padding:6px 0;color:#7d5c20;font-size:12px;font-weight:850;background:transparent;border:0;border-bottom:1px solid rgba(157,116,50,.28);}
        .kbdr2-canonical-text-link:hover{color:#1F3A2E;border-color:#1F3A2E;}
        .kbdr2-canonical-agreement-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;border:1px solid #ebe1cf;border-radius:14px;overflow:hidden;background:#ebe1cf;}
        .kbdr2-canonical-agreement-strip>div{min-width:0;padding:13px 15px;background:#fffdf8;}
        .kbdr2-canonical-agreement-strip span{display:block;margin-bottom:4px;color:#8a8174;font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;}
        .kbdr2-canonical-agreement-strip strong{display:block;color:#1F3A2E;font-size:13.5px;font-weight:800;line-height:1.3;overflow-wrap:anywhere;}
        .kbdr2-canonical-agreement-copy{margin:15px 2px 0;color:#5e5a50;font-size:13px;line-height:1.65;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
        .kbdr2-canonical-support-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px;}
        .kbdr2-canonical-support-card{display:flex;flex-direction:column;min-height:154px;padding:18px;border:1px solid rgba(223,213,194,.82);border-radius:16px;background:#fffdf8;}
        .kbdr2-canonical-support-card>strong{margin-top:8px;color:#1F3A2E;font-family:'Playfair Display','Newsreader',Georgia,serif;font-size:19px;line-height:1.18;letter-spacing:-.02em;}
        .kbdr2-canonical-support-card>p{margin:8px 0 14px;color:#706a60;font-size:12.5px;line-height:1.55;}
        .kbdr2-canonical-support-card>button{align-self:flex-start;margin-top:auto;padding:0 0 3px;background:transparent;border:0;border-bottom:1px solid rgba(31,58,46,.22);color:#1F3A2E;font-size:11.5px;font-weight:850;}
        .kbdr2-canonical-conversation-gateway{width:100%;margin-top:14px;padding:15px 17px;display:flex;align-items:center;justify-content:space-between;gap:18px;text-align:left;border:1px solid rgba(31,58,46,.12);border-radius:15px;background:#1F3A2E;color:#fff;box-shadow:0 10px 24px rgba(31,58,46,.13);}
        .kbdr2-canonical-conversation-gateway>span:first-child{min-width:0;display:flex;flex-direction:column;gap:4px;}
        .kbdr2-canonical-conversation-gateway small{font-size:9px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#d9c28f;}
        .kbdr2-canonical-conversation-gateway strong{max-width:720px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:650;color:#fff;}
        .kbdr2-canonical-conversation-arrow{font-family:Georgia,serif;font-size:22px;color:#e7d29f;}
        @media (max-width:980px){
          .kbdr2-canonical-dealroom:not(.kbdr2-work-message-mode) .kbdr2-work-head{padding:14px 15px 12px !important;}
          .kbdr2-dealroom-switcher{padding:0 15px;}
          .kbdr2-canonical-overview{padding:18px 16px 24px;}
          .kbdr2-canonical-next h2{font-size:clamp(25px,3.4vw,30px);}
          .kbdr2-canonical-support-grid{gap:10px;}
        }
        @media (max-width:640px){
          .kbdr2-canonical-dealroom:not(.kbdr2-work-message-mode) .kbdr2-work-head{position:relative !important;padding:13px 12px 11px !important;}
          .kbdr2-canonical-dealroom:not(.kbdr2-work-message-mode) .kbdr2-work-title{font-size:21px !important;}
          .kbdr2-canonical-dealroom:not(.kbdr2-work-message-mode) .kbdr2-work-meta{font-size:11.5px !important;}
          .kbdr2-dealroom-switcher{padding:0 12px;position:sticky;top:0;z-index:10;}
          .kbdr2-dealroom-switch{flex:1;justify-content:center;margin-right:0;padding:11px 4px 10px;}
          .kbdr2-canonical-overview{padding:12px 10px 20px;}
          .kbdr2-canonical-next{padding:18px 16px;border-radius:16px;}
          .kbdr2-canonical-next-top{align-items:flex-start;margin-bottom:11px;}
          .kbdr2-canonical-next h2{font-size:25px;line-height:1.06;}
          .kbdr2-canonical-next p{font-size:12.5px;line-height:1.54;}
          .kbdr2-canonical-action-row{align-items:stretch;}
          .kbdr2-canonical-action-primary,.kbdr2-canonical-action-secondary{flex:1 1 150px;}
          .kbdr2-canonical-action-panel{padding:14px;}
          .kbdr2-canonical-action-panel-footer{align-items:flex-start;flex-direction:column;}
          .kbdr2-canonical-action-panel-buttons{width:100%;}
          .kbdr2-canonical-action-panel-buttons .kbdr2-canonical-action-primary,.kbdr2-canonical-action-panel-buttons .kbdr2-canonical-action-secondary{flex:1 1 0;}
          .kbdr2-canonical-agreement{padding:14px;border-radius:15px;}
          .kbdr2-canonical-section-head{gap:10px;}
          .kbdr2-canonical-section-head h3{font-size:18px;}
          .kbdr2-canonical-agreement-strip{grid-template-columns:1fr;}
          .kbdr2-canonical-agreement-strip>div{padding:10px 11px;}
          .kbdr2-canonical-agreement-copy{-webkit-line-clamp:4;}
          .kbdr2-canonical-support-grid{grid-template-columns:1fr;gap:9px;}
          .kbdr2-canonical-support-card{min-height:0;padding:14px;}
          .kbdr2-canonical-conversation-gateway{padding:14px 15px;}
          .kbdr2-canonical-conversation-gateway strong{max-width:250px;}
        }

        /* ═══════════════════ 0174 UNIFIED DEAL ROOM DESKTOP ═══════════════════
           Explicit hired-project Deal Rooms occupy the workspace instead of
           masquerading as a normal Inbox thread. Messages remain the same
           conversation, recomposed as a quiet secondary rail. */
        .kbdr2-message-surface{display:contents;}
        .kbdr2-canonical-activity-card{min-height:154px;}
        .kbdr2-canonical-activity-list{display:flex;flex-direction:column;gap:8px;margin-top:11px;}
        .kbdr2-canonical-activity-row{display:grid;grid-template-columns:9px minmax(0,1fr);gap:9px;align-items:start;padding:2px 0;}
        .kbdr2-canonical-activity-dot{width:7px;height:7px;margin-top:5px;border-radius:999px;background:#9b7432;box-shadow:0 0 0 3px rgba(155,116,50,.10);}
        .kbdr2-canonical-activity-row>span:last-child{display:flex;align-items:baseline;justify-content:space-between;gap:10px;min-width:0;color:#4f4b43;font-size:11.5px;line-height:1.35;}
        .kbdr2-canonical-activity-row b{font-weight:750;color:#243122;text-transform:none;}
        .kbdr2-canonical-activity-row small{flex:0 0 auto;color:#91897c;font-size:9.5px;font-weight:750;}
        .kbdr2-canonical-activity-empty{margin:2px 0 0 !important;font-size:11.5px !important;}
        .kbdr2-canonical-milestone-list{display:flex;flex-direction:column;gap:1px;margin-top:15px;border:1px solid #ebe1cf;border-radius:13px;overflow:hidden;background:#ebe1cf;}
        .kbdr2-canonical-milestone-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 13px;background:#fffdf8;color:#5c574e;font-size:11.5px;}
        .kbdr2-canonical-milestone-row>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .kbdr2-canonical-milestone-row strong{flex:0 0 auto;color:#1F3A2E;font-size:10.5px;font-weight:850;}
        @media (min-width:861px){
          .kbdr2-root.kbdr2-has-canonical-dealroom .kbdr2-topbar{display:none !important;}
          .kbdr2-content.kbdr2-canonical-open{display:grid !important;grid-template-columns:minmax(0,1fr) !important;gap:0 !important;padding:14px clamp(14px,2vw,28px) 20px !important;min-height:0 !important;}
          .kbdr2-content.kbdr2-canonical-open>.kbdr2-deals{display:none !important;}
          .kbdr2-content.kbdr2-canonical-open>.kbdr2-work{width:min(1480px,100%) !important;margin:0 auto !important;min-height:0 !important;}
          .kbdr2-canonical-dealroom.kbdr2-canonical-split{display:grid !important;grid-template-rows:auto minmax(0,1fr) !important;background:#fffdf8 !important;border:1px solid rgba(223,213,194,.86) !important;border-radius:22px !important;overflow:hidden !important;box-shadow:0 18px 50px rgba(42,53,32,.08) !important;}
          .kbdr2-canonical-split>.kbdr2-work-head{grid-column:1 / -1;grid-row:1;padding:17px 22px 15px !important;border-bottom:1px solid #e8decd !important;background:linear-gradient(180deg,#fffdf8,#fbf6ea) !important;}
          .kbdr2-canonical-split>.kbdr2-canonical-overview{grid-column:1;grid-row:2;min-width:0;min-height:0;padding:clamp(22px,2.5vw,34px) !important;background:linear-gradient(180deg,#fffdf8 0%,#faf4e8 100%) !important;}
          .kbdr2-canonical-message-rail{grid-column:2;grid-row:2;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden;border-left:1px solid #e7dcc9;background:#f7f1e7;}
          .kbdr2-canonical-message-rail .kbdr2-thread-command-header{flex:0 0 auto;padding:13px 15px 11px !important;border-bottom:1px solid #e5dac7 !important;background:#fffdf8 !important;}
          .kbdr2-canonical-message-rail .kbdr2-thread-command-title{font-family:'Playfair Display','Newsreader',Georgia,serif !important;font-size:17px !important;font-weight:750 !important;color:#1c2814 !important;}
          .kbdr2-canonical-message-rail .kbdr2-stream{flex:1 1 auto;min-height:0;padding:16px 13px 18px !important;background:linear-gradient(180deg,#f9f5ed 0%,#f4ede1 100%) !important;}
          .kbdr2-canonical-message-rail .kbdr2-day-label{color:#8b8172 !important;}
          .kbdr2-canonical-message-rail .kbdr2-bubble.them{background:#fffdf8 !important;border:1px solid #e5dac7 !important;color:#263126 !important;box-shadow:0 4px 12px rgba(42,53,32,.035) !important;}
          .kbdr2-canonical-message-rail .kbdr2-bubble.me{background:#1F3A2E !important;border-color:#1F3A2E !important;color:#fff !important;}
          .kbdr2-canonical-message-rail .kbdr2-bubble-time{opacity:.65;}
          .kbdr2-canonical-message-rail .kbdr2-composer{flex:0 0 auto;padding:10px 11px 12px !important;border-top:1px solid #e4d9c6 !important;background:#fffdf8 !important;}
          .kbdr2-canonical-message-rail .kbdr2-composer-inner{border:1px solid #ded3c1 !important;background:#fff !important;box-shadow:none !important;}
          .kbdr2-canonical-message-rail .kbdr2-composer textarea{color:#243122 !important;}
          .kbdr2-canonical-message-rail .kbdr2-composer textarea::placeholder{color:#9a9285 !important;}
          .kbdr2-canonical-message-rail .kbdr2-thread-empty{color:#4e584d !important;}
        }

        /* Final mobile Inbox hardening: one-pane mobile, no right-edge clipping, composer stays usable. */
        @media (max-width: 860px){
          .kbdr2-root{
            width:100vw !important;
            max-width:100vw !important;
            height:calc(100svh - 60px - 62px - env(safe-area-inset-bottom,0px)) !important;
            min-height:0 !important;
            overflow:hidden !important;
            border-radius:0 !important;
          }
          .kbdr2-main{
            width:100% !important;
            max-width:100% !important;
            min-width:0 !important;
            overflow:hidden !important;
          }
          .kbdr2-topbar{
            height:54px !important;
            min-height:54px !important;
            padding:7px 10px !important;
            gap:8px !important;
            flex-shrink:0 !important;
          }
          .kbdr2-content{
            display:block !important;
            width:100% !important;
            max-width:100% !important;
            height:calc(100% - 54px) !important;
            min-height:0 !important;
            padding:0 10px 10px !important;
            overflow:hidden !important;
          }
          .kbdr2-deals,
          .kbdr2-work{
            width:100% !important;
            max-width:100% !important;
            height:100% !important;
            min-height:0 !important;
            min-width:0 !important;
            overflow:hidden !important;
            border-radius:18px !important;
          }
          .kbdr2-deals{display:flex;flex-direction:column;}
          .kbdr2-work{display:flex;flex-direction:column;position:relative !important;}
          .kbdr2-deals-list,
          .kbdr2-tab-body{
            min-height:0 !important;
            overflow-y:auto !important;
            overflow-x:hidden !important;
            -webkit-overflow-scrolling:touch !important;
          }
          .kbdr2-deal-row{
            min-width:0 !important;
            max-width:100% !important;
            overflow:hidden !important;
          }
          .kbdr2-deal-body,
          .kbdr2-deal-line1,
          .kbdr2-work-info,
          .kbdr2-work-meta,
          .kbdr2-work-title{
            min-width:0 !important;
            max-width:100% !important;
          }
          .kbdr2-work-head{
            min-height:56px !important;
            padding:9px 10px !important;
            gap:8px !important;
            flex-shrink:0 !important;
          }
          .kbdr2-work-back{
            flex:0 0 auto !important;
            width:34px !important;
            height:34px !important;
          }
          .kbdr2-work-avatar{
            width:34px !important;
            height:34px !important;
            font-size:11px !important;
            flex:0 0 auto !important;
          }
          .kbdr2-work-title{
            font-size:17px !important;
            line-height:1.08 !important;
            white-space:nowrap !important;
            overflow:hidden !important;
            text-overflow:ellipsis !important;
          }
          .kbdr2-work-meta{
            display:block !important;
            white-space:nowrap !important;
            overflow:hidden !important;
            text-overflow:ellipsis !important;
            font-size:11.5px !important;
          }
          .kbdr2-work-actions{
            width:auto !important;
            min-width:0 !important;
            display:flex !important;
            flex:0 0 auto !important;
            gap:6px !important;
            margin-left:auto !important;
          }
          .kbdr2-work-actions .kbdr2-primary-btn{
            display:none !important;
          }
          .kbdr2-work-actions button:not(.kbdr2-primary-btn){
            width:34px !important;
            height:34px !important;
            min-width:34px !important;
            padding:0 !important;
          }
          .kbdr2-work-tabs{
            flex:0 0 auto !important;
            min-height:38px !important;
            padding:0 10px !important;
            gap:16px !important;
            overflow-x:auto !important;
            overflow-y:hidden !important;
            scrollbar-width:none !important;
          }
          .kbdr2-work-tabs::-webkit-scrollbar{display:none !important;}
          .kbdr2-work-tab{flex:0 0 auto !important;white-space:nowrap !important;font-size:12px !important;padding:10px 0 !important;}
          .kbdr2-stream{
            flex:1 1 auto !important;
            min-height:0 !important;
            overflow-y:auto !important;
            overflow-x:hidden !important;
            -webkit-overflow-scrolling:touch !important;
            padding:12px 10px calc(96px + env(safe-area-inset-bottom,0px)) !important;
          }
          .kbdr2-composer{
            position:absolute !important;
            left:0 !important;
            right:0 !important;
            bottom:0 !important;
            z-index:50 !important;
            padding:8px 8px calc(8px + env(safe-area-inset-bottom,0px)) !important;
            background:linear-gradient(180deg,rgba(255,253,248,0.94),#fff8ed) !important;
            border-top:1px solid rgba(223,213,194,0.90) !important;
          }
          .kbdr2-composer-inner{
            min-width:0 !important;
            width:100% !important;
            border-radius:14px !important;
          }
          .kbdr2-composer textarea{
            min-width:0 !important;
            font-size:16px !important;
            max-height:82px !important;
            padding:9px 7px !important;
          }
          .kbdr2-composer-send{
            width:38px !important;
            height:38px !important;
            min-width:38px !important;
            border-radius:11px !important;
            margin:3px !important;
          }
          .kbdr2-bubble{
            max-width:92% !important;
            overflow-wrap:anywhere !important;
            word-break:break-word !important;
          }
          .kbdr2-thread-context,
          .kbdr2-command-card,
          .kbdr2-next-strip,
          .kbdr2-lifecycle{
            display:none !important;
          }
        }



          /* v33 Inbox send fallback + visual polish for actual kbdr2 deal room */
          @media (min-width: 861px) and (max-width: 1180px){
            .kbdr2-content{
              grid-template-columns:minmax(300px,360px) minmax(0,1fr) !important;
              gap:12px !important;
              padding:12px !important;
            }
            .kbdr2-deals,
            .kbdr2-work{
              min-width:0 !important;
              border-radius:18px !important;
            }
            .kbdr2-work-title{
              max-width:100% !important;
              overflow:hidden !important;
              text-overflow:ellipsis !important;
              white-space:nowrap !important;
            }
            .kbdr2-command-card,
            .kbdr2-deal-snapshot{
              margin-left:14px !important;
              margin-right:14px !important;
            }
          }
          @media (max-width: 860px){
            .kbdr2-deals-head{
              padding:13px 14px 10px !important;
              border-bottom:1px solid rgba(31,58,46,0.08) !important;
              background:rgba(255,253,248,0.96) !important;
            }
            .kbdr2-deals-title{
              font-size:24px !important;
              line-height:1.02 !important;
              letter-spacing:-0.055em !important;
            }
            .kbdr2-new-btn{
              min-width:38px !important;
              height:38px !important;
              border-radius:12px !important;
            }
            .kbdr2-deals-list{
              padding:10px !important;
              gap:8px !important;
            }
            .kbdr2-deal-row{
              min-height:0 !important;
              padding:11px 10px !important;
              border-radius:14px !important;
              border:1px solid rgba(31,58,46,0.085) !important;
              background:#fffdf8 !important;
              box-shadow:0 5px 16px rgba(28,40,20,0.045) !important;
            }
            .kbdr2-deal-avatar{
              width:38px !important;
              height:38px !important;
              min-width:38px !important;
              border-radius:12px !important;
              font-size:12px !important;
            }
            .kbdr2-deal-name{
              font-size:13.5px !important;
              line-height:1.18 !important;
              display:-webkit-box !important;
              -webkit-line-clamp:1 !important;
              -webkit-box-orient:vertical !important;
              overflow:hidden !important;
            }
            .kbdr2-deal-vendor,
            .kbdr2-deal-preview{
              font-size:11.5px !important;
              line-height:1.34 !important;
            }
            .kbdr2-deal-preview{
              display:-webkit-box !important;
              -webkit-line-clamp:1 !important;
              -webkit-box-orient:vertical !important;
              overflow:hidden !important;
            }
            .kbdr2-deal-right{
              min-width:42px !important;
            }
            .kbdr2-work-head{
              background:rgba(255,253,248,0.98) !important;
              border-bottom:1px solid rgba(31,58,46,0.08) !important;
              box-shadow:0 7px 18px rgba(28,40,20,0.055) !important;
            }
            .kbdr2-work-back{
              display:inline-flex !important;
            }
            .kbdr2-work-title{
              font-size:17px !important;
              line-height:1.12 !important;
              white-space:normal !important;
              display:-webkit-box !important;
              -webkit-line-clamp:2 !important;
              -webkit-box-orient:vertical !important;
            }
            .kbdr2-work-meta{
              white-space:normal !important;
              display:-webkit-box !important;
              -webkit-line-clamp:1 !important;
              -webkit-box-orient:vertical !important;
            }
            .kbdr2-work-tabs{
              background:#fffdf8 !important;
              border-bottom:1px solid rgba(31,58,46,0.07) !important;
            }
            .kbdr2-work-tab{
              min-height:36px !important;
            }
            .kbdr2-deal-snapshot,
            .kbdr2-command-card,
            .kbdr2-next-strip,
            .kbdr2-failed-banner,
            .kbdr2-mobile-glance{
              margin-left:10px !important;
              margin-right:10px !important;
              border-radius:14px !important;
            }
            .kbdr2-deal-snapshot-grid,
            .kbdr2-command-metrics{
              grid-template-columns:repeat(2,minmax(0,1fr)) !important;
              gap:7px !important;
            }
            .kbdr2-deal-snapshot-card,
            .kbdr2-command-metric{
              padding:9px !important;
              border-radius:11px !important;
            }
            .kbdr2-msg-row{
              max-width:100% !important;
            }
            .kbdr2-bubble{
              border-radius:14px !important;
              font-size:12.75px !important;
              line-height:1.45 !important;
              box-shadow:0 4px 13px rgba(28,40,20,0.045) !important;
            }
            .kbdr2-bubble.me{
              border-bottom-right-radius:7px !important;
            }
            .kbdr2-bubble.them{
              border-bottom-left-radius:7px !important;
            }
            .kbdr2-file-card{
              max-width:100% !important;
              min-width:0 !important;
            }
            .kbdr2-composer-inner{
              box-shadow:0 8px 22px rgba(28,40,20,0.09) !important;
              border:1px solid rgba(31,58,46,0.11) !important;
              background:#fffdf8 !important;
            }
            .kbdr2-composer-tool{
              width:34px !important;
              height:34px !important;
              min-width:34px !important;
              border-radius:10px !important;
            }
            .kbdr2-composer-send{
              width:auto !important;
              min-width:44px !important;
              padding:0 11px !important;
            }
          }
          @media (max-width: 390px){
            .kbdr2-deal-snapshot-grid,
            .kbdr2-command-metrics{
              grid-template-columns:1fr !important;
            }
            .kbdr2-deals-list{
              padding-left:8px !important;
              padding-right:8px !important;
            }
            .kbdr2-deal-row{
              padding:10px 9px !important;
            }
          }

          /* v32 actual kbdr2 pane + message fallback hardening */
          @media (max-width: 860px){
            .kbdr2-content{
              display:block !important;
              height:calc(100% - 54px) !important;
              min-height:0 !important;
              overflow:hidden !important;
            }
            .kbdr2-deals[style*="display: none"],
            .kbdr2-work[style*="display: none"]{
              display:none !important;
            }
            .kbdr2-work-back{
              display:inline-flex !important;
            }
            .kbdr2-work{
              height:100% !important;
              min-height:0 !important;
              overflow:hidden !important;
            }
            .kbdr2-work-head{
              flex:0 0 auto !important;
            }
            .kbdr2-work-tabs{
              flex:0 0 auto !important;
            }
            .kbdr2-tab-body{
              flex:1 1 auto !important;
              min-height:0 !important;
              overflow:hidden !important;
              display:flex !important;
              flex-direction:column !important;
            }
            .kbdr2-stream{
              flex:1 1 auto !important;
              min-height:0 !important;
              overflow-y:auto !important;
              overflow-x:hidden !important;
            }
            .kbdr2-composer{
              flex:0 0 auto !important;
              position:relative !important;
              bottom:auto !important;
              left:auto !important;
              right:auto !important;
            }
          }

          /* v31 real Inbox click/open fix — actual kbdr2 mobile panes */
          @media (max-width: 860px){
            .kbdr2-content.kbdr2-list-open .kbdr2-deals{
              display:flex !important;
            }
            .kbdr2-content.kbdr2-list-open .kbdr2-work{
              display:none !important;
            }
            .kbdr2-content.kbdr2-thread-open .kbdr2-deals{
              display:none !important;
            }
            .kbdr2-content.kbdr2-thread-open .kbdr2-work{
              display:flex !important;
            }
            .kbdr2-content.kbdr2-thread-open{
              padding:0 8px 8px !important;
            }
            .kbdr2-content.kbdr2-thread-open .kbdr2-work-back{
              display:inline-flex !important;
            }
            .kbdr2-content.kbdr2-thread-open .kbdr2-work{
              height:100% !important;
              min-height:0 !important;
              overflow:hidden !important;
            }
            .kbdr2-content.kbdr2-thread-open .kbdr2-work-head{
              flex-shrink:0 !important;
            }
            .kbdr2-content.kbdr2-thread-open .kbdr2-stream{
              flex:1 1 auto !important;
              min-height:0 !important;
            }
          }

        @media (max-width: 390px){
          .kbdr2-content{padding-left:6px !important;padding-right:6px !important;padding-bottom:6px !important;}
          .kbdr2-topbar-icon:nth-of-type(n+2), .kbdr2-user-chip{display:none !important;}
          .kbdr2-search{height:38px !important;}
          .kbdr2-deals,.kbdr2-work{border-radius:15px !important;}
          .kbdr2-deal-badge{display:none !important;}
        }


        /* ═══════════════════ 746 INBOX DENSITY + CLAY BACKGROUND LOCK ═══════════════════
           Inbox-only cleanup:
           - remove the global top search/action bar
           - apply the same clay workspace background as Marketplace/My Projects
           - make the left conversation pane much denser
           - make the inbox filter strip more premium and shorter
           No message data/send/thread logic changes. */
        .kbdr2-root{
          background-image:var(--kb-workspace-clay-layer) !important;
          background-size:cover !important;
          background-position:center top !important;
          background-repeat:no-repeat !important;
          background-attachment:scroll !important;
          background-color:#f6efe4 !important;
        }
        .kbdr2-main{
          background:transparent !important;
        }
        .kbdr2-topbar{
          display:none !important;
          height:0 !important;
          min-height:0 !important;
          padding:0 !important;
          margin:0 !important;
          overflow:hidden !important;
          border:0 !important;
          box-shadow:none !important;
        }
        .kbdr2-content{
          flex:1 1 auto !important;
          padding:18px 22px 22px !important;
          background:transparent !important;
        }
        .kbdr2-deals,
        .kbdr2-work{
          background:rgba(255,253,248,0.82) !important;
          border-color:rgba(223,213,194,0.74) !important;
          box-shadow:0 18px 44px rgba(28,40,20,0.09) !important;
          backdrop-filter:blur(6px) !important;
          -webkit-backdrop-filter:blur(6px) !important;
        }
        .kbdr2-deals-head{
          padding:12px 16px 8px !important;
          min-height:0 !important;
          background:linear-gradient(180deg,rgba(255,253,248,0.88),rgba(255,250,241,0.72)) !important;
          border-bottom:1px solid rgba(223,213,194,0.42) !important;
        }
        .kbdr2-deals-title{
          font-size:20px !important;
          line-height:1.05 !important;
          letter-spacing:-0.035em !important;
        }
        .kbdr2-new-btn{
          height:32px !important;
          padding:0 14px !important;
          border-radius:999px !important;
          font-size:12px !important;
          box-shadow:0 8px 18px rgba(28,40,20,0.10), inset 0 1px 0 rgba(255,255,255,0.18) !important;
        }
        .kbdr2-inbox-stats{
          padding:7px 14px 5px !important;
          gap:6px !important;
          min-height:0 !important;
          background:rgba(255,253,248,0.72) !important;
          border-bottom:1px solid rgba(223,213,194,0.34) !important;
        }
        .kbdr2-inbox-stat,
        .kbdr2-inbox-all-clear{
          height:24px !important;
          padding:0 9px !important;
          border-radius:999px !important;
          font-size:10.5px !important;
          font-weight:800 !important;
          letter-spacing:0.045em !important;
          text-transform:uppercase !important;
          background:rgba(31,58,46,0.045) !important;
          border:1px solid rgba(31,58,46,0.065) !important;
          color:#334437 !important;
        }
        .kbdr2-inbox-stat.warn{
          color:#8a4b25 !important;
          background:rgba(190,93,55,0.085) !important;
          border-color:rgba(190,93,55,0.14) !important;
        }
        .kbdr2-inbox-stat-dot{
          width:5px !important;
          height:5px !important;
          opacity:.72 !important;
        }
        .kbdr2-deals-tabs{
          padding:0 14px !important;
          gap:14px !important;
          min-height:34px !important;
          background:rgba(255,253,248,0.76) !important;
          border-bottom:1px solid rgba(223,213,194,0.50) !important;
        }
        .kbdr2-deals-tab{
          padding:8px 0 9px !important;
          min-height:34px !important;
          font-size:11.5px !important;
          font-weight:850 !important;
          letter-spacing:0.015em !important;
          color:#6f6a5f !important;
          gap:5px !important;
        }
        .kbdr2-deals-tab.active{
          color:#1F3A2E !important;
        }
        .kbdr2-deals-tab.active::after{
          height:2px !important;
          bottom:-1px !important;
        }
        .kbdr2-deals-tab-count{
          font-size:9.5px !important;
          line-height:1.35 !important;
          padding:0 6px !important;
          min-width:18px !important;
          height:18px !important;
          display:inline-flex !important;
          align-items:center !important;
          justify-content:center !important;
          background:rgba(31,58,46,0.07) !important;
          color:#6d705f !important;
        }
        .kbdr2-deals-tab.active .kbdr2-deals-tab-count{
          background:rgba(196,151,58,0.16) !important;
          color:#5f4918 !important;
        }
        .kbdr2-deals-list{
          padding:4px 0 8px !important;
        }
        .kbdr2-deal-row{
          margin:3px 8px !important;
          width:calc(100% - 16px) !important;
          padding:7px 10px !important;
          gap:8px !important;
          border-radius:12px !important;
          min-height:0 !important;
          align-items:center !important;
          border-color:rgba(223,213,194,0.34) !important;
          background:rgba(255,253,248,0.55) !important;
          box-shadow:none !important;
        }
        .kbdr2-deal-row:hover{
          transform:none !important;
          background:rgba(255,253,248,0.92) !important;
          border-color:rgba(196,151,58,0.22) !important;
        }
        .kbdr2-deal-row.active{
          background:rgba(255,253,248,0.96) !important;
          border-color:rgba(196,151,58,0.36) !important;
          box-shadow:0 8px 18px rgba(28,40,20,0.06) !important;
        }
        .kbdr2-deal-row.active::before{
          top:8px !important;
          bottom:8px !important;
          width:3px !important;
        }
        .kbdr2-deal-avatar{
          width:30px !important;
          height:30px !important;
          min-width:30px !important;
          border-radius:999px !important;
          font-size:10.5px !important;
        }
        .kbdr2-deal-line1{
          gap:5px !important;
          margin-bottom:2px !important;
          align-items:center !important;
        }
        .kbdr2-deal-name{
          font-size:12.25px !important;
          line-height:1.1 !important;
          letter-spacing:-0.012em !important;
        }
        .kbdr2-deal-badge{
          padding:2px 7px !important;
          font-size:8.5px !important;
          line-height:1.2 !important;
          letter-spacing:0.06em !important;
        }
        .kbdr2-deal-vendor{
          margin-bottom:1px !important;
          font-size:11px !important;
          line-height:1.15 !important;
        }
        .kbdr2-deal-preview{
          font-size:10.75px !important;
          line-height:1.22 !important;
          -webkit-line-clamp:1 !important;
        }
        .kbdr2-deal-right{
          min-width:34px !important;
          gap:3px !important;
          padding-top:0 !important;
        }
        .kbdr2-deal-time{
          font-size:10px !important;
          line-height:1.1 !important;
        }
        .kbdr2-deal-unread{
          min-width:17px !important;
          height:17px !important;
          padding:0 5px !important;
          font-size:9px !important;
        }
        .kbdr2-deal-row{position:relative !important;cursor:pointer !important;}
        .kbdr2-deal-row-action{
          width:26px !important;
          height:26px !important;
          border-radius:999px !important;
          display:flex !important;
          align-items:center !important;
          justify-content:center !important;
          color:#6f6a5f !important;
          background:rgba(255,253,248,0.80) !important;
          border:1px solid rgba(31,58,46,0.08) !important;
          opacity:0 !important;
          transform:translateX(4px) !important;
          transition:opacity .14s ease,transform .14s ease,background .14s ease,color .14s ease !important;
          flex-shrink:0 !important;
        }
        .kbdr2-deal-row:hover .kbdr2-deal-row-action,
        .kbdr2-deal-row:focus-within .kbdr2-deal-row-action{opacity:1 !important;transform:translateX(0) !important;}
        .kbdr2-deal-row-action:hover{background:#1F3A2E !important;color:#fffdf8 !important;}
        .kbdr2-deal-row-action.restore:hover{background:#B08840 !important;color:#fffdf8 !important;}
        .kbdr2-deal-row-action:disabled{opacity:.45 !important;cursor:not-allowed !important;}
        @media (max-width:860px){
          .kbdr2-root{background-attachment:scroll !important;}
          .kbdr2-content{height:100% !important;padding:10px 8px 8px !important;}
          .kbdr2-deals-head{padding:11px 14px 7px !important;}
          .kbdr2-deals-title{font-size:19px !important;}
          .kbdr2-deals-tabs{gap:12px !important;padding:0 12px !important;}
          .kbdr2-deals-tab{font-size:11px !important;}
          .kbdr2-deal-row{margin:3px 7px !important;width:calc(100% - 14px) !important;padding:7px 9px !important;}
        }


        /* ═══════════════════ 852ae INBOX DARK COMMAND CENTER — VISUAL ONLY ═══════════════════
           Scoped to .kb-inbox-dark-shell so Marketplace/My Projects/Vendor/Church vine systems
           and every Supabase/auth/message handler remain untouched. */
        .kbdr2-root.kb-inbox-dark-shell{
          --kbid-bg:#090b10;
          --kbid-bg-2:#11101a;
          --kbid-plum:#1a1324;
          --kbid-plum-2:#21172d;
          --kbid-panel:rgba(13,15,22,0.88);
          --kbid-panel-2:rgba(22,20,31,0.82);
          --kbid-border:rgba(255,255,255,0.08);
          --kbid-border-strong:rgba(201,164,92,0.24);
          --kbid-text:#f7f1e7;
          --kbid-muted:rgba(247,241,231,0.62);
          --kbid-muted-2:rgba(247,241,231,0.42);
          --kbid-gold:#c9a45c;
          --kbid-green:#1f6d3a;
          --kbid-green-deep:#12351f;
          background:
            radial-gradient(circle at 16% 0%,rgba(83,58,104,0.28),transparent 32%),
            radial-gradient(circle at 88% 10%,rgba(31,109,58,0.16),transparent 30%),
            linear-gradient(135deg,#090b10 0%,#11101a 42%,#1a1324 100%) !important;
          background-image:
            radial-gradient(circle at 16% 0%,rgba(83,58,104,0.28),transparent 32%),
            radial-gradient(circle at 88% 10%,rgba(31,109,58,0.16),transparent 30%),
            linear-gradient(135deg,#090b10 0%,#11101a 42%,#1a1324 100%) !important;
          background-color:#090b10 !important;
          color:var(--kbid-text) !important;
          overflow:hidden !important;
        }
        .kbdr2-root.kb-inbox-dark-shell *{box-sizing:border-box;}
        .kbdr2-root.kb-inbox-dark-shell ::selection{background:rgba(201,164,92,0.32);color:#fff8e8;}
        .kbdr2-root.kb-inbox-dark-shell ::-webkit-scrollbar-thumb{background:rgba(247,241,231,0.16) !important;}
        .kbdr2-root.kb-inbox-dark-shell ::-webkit-scrollbar-thumb:hover{background:rgba(201,164,92,0.34) !important;}

        .kbdr2-root.kb-inbox-dark-shell .kbdr2-main{
          background:transparent !important;
          color:var(--kbid-text) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-topbar{
          display:flex !important;
          height:64px !important;
          min-height:64px !important;
          padding:12px 22px 10px !important;
          margin:0 !important;
          overflow:visible !important;
          background:linear-gradient(180deg,rgba(9,11,16,0.92),rgba(9,11,16,0.62)) !important;
          border-bottom:1px solid rgba(255,255,255,0.06) !important;
          box-shadow:0 18px 48px rgba(0,0,0,0.28) !important;
          backdrop-filter:blur(14px) !important;
          -webkit-backdrop-filter:blur(14px) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-search{
          height:40px !important;
          max-width:620px !important;
          background:rgba(255,255,255,0.055) !important;
          border:1px solid rgba(255,255,255,0.10) !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.06),0 14px 34px rgba(0,0,0,0.20) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-search-ico,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-topbar-icon,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-user-caret{color:var(--kbid-muted) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-search input{color:var(--kbid-text) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-search input::placeholder{color:rgba(247,241,231,0.40) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-topbar-icon{
          background:rgba(255,255,255,0.045) !important;
          border:1px solid rgba(255,255,255,0.075) !important;
          border-radius:12px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-topbar-icon:hover{background:rgba(201,164,92,0.11) !important;color:var(--kbid-gold) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-topbar-icon-dot{background:var(--kbid-gold) !important;border-color:#090b10 !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-user-chip{
          background:rgba(255,255,255,0.055) !important;
          border:1px solid rgba(255,255,255,0.10) !important;
          color:var(--kbid-text) !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.06),0 14px 34px rgba(0,0,0,0.18) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-user-chip:hover{background:rgba(255,255,255,0.085) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-user-avatar,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-avatar,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-avatar,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-msg-avatar{
          background:linear-gradient(135deg,rgba(201,164,92,0.28),rgba(247,241,231,0.10)) !important;
          border:1px solid rgba(201,164,92,0.22) !important;
          color:#fff7e6 !important;
          box-shadow:0 10px 28px rgba(0,0,0,0.22),inset 0 1px 0 rgba(255,255,255,0.08) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-user-name{color:var(--kbid-text) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-user-role{color:var(--kbid-muted) !important;}

        .kbdr2-root.kb-inbox-dark-shell .kbdr2-content{
          grid-template-columns:minmax(320px,clamp(320px,28vw,390px)) minmax(0,1fr) !important;
          gap:18px !important;
          padding:18px 22px 22px !important;
          background:transparent !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work{
          background:linear-gradient(180deg,rgba(22,20,31,0.88),rgba(13,15,22,0.90)) !important;
          border:1px solid var(--kbid-border) !important;
          border-radius:24px !important;
          box-shadow:0 24px 70px rgba(0,0,0,0.36),inset 0 1px 0 rgba(255,255,255,0.045) !important;
          backdrop-filter:blur(18px) saturate(120%) !important;
          -webkit-backdrop-filter:blur(18px) saturate(120%) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals{
          scrollbar-width:none !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-head,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-head{
          background:linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.022)) !important;
          border-bottom:1px solid rgba(255,255,255,0.075) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-head{padding:18px 18px 12px !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-title,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-title{
          color:var(--kbid-text) !important;
          text-shadow:0 1px 18px rgba(0,0,0,0.26) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-title{font-size:24px !important;letter-spacing:-0.04em !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-new-btn,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-primary-btn{
          background:linear-gradient(135deg,var(--kbid-gold),#a9792f) !important;
          color:#100e12 !important;
          border:1px solid rgba(255,255,255,0.14) !important;
          box-shadow:0 12px 26px rgba(201,164,92,0.20),inset 0 1px 0 rgba(255,255,255,0.28) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-new-btn:hover,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-primary-btn:hover:not(:disabled){filter:brightness(1.05) !important;}

        .kbdr2-root.kb-inbox-dark-shell .kbdr2-inbox-stats{
          padding:10px 16px 9px !important;
          background:rgba(255,255,255,0.025) !important;
          border-bottom:1px solid rgba(255,255,255,0.06) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-inbox-all-clear,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-inbox-stat{
          height:26px !important;
          background:rgba(31,109,58,0.16) !important;
          border:1px solid rgba(71,186,112,0.18) !important;
          color:#bce8c7 !important;
          letter-spacing:0.07em !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.06) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-inbox-stat.warn{
          background:rgba(201,164,92,0.14) !important;
          border-color:rgba(201,164,92,0.30) !important;
          color:#f5dca0 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-inbox-stat-dot{opacity:1 !important;box-shadow:0 0 14px currentColor !important;}

        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-tabs,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-tabs{
          background:rgba(255,255,255,0.018) !important;
          border-bottom:1px solid rgba(255,255,255,0.06) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-tab,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-tab{
          color:var(--kbid-muted) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-tab:hover,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-tab:hover,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-tab.active,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-tab.active{
          color:var(--kbid-text) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-tab.active::after,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-tab.active::after{
          background:linear-gradient(90deg,transparent,var(--kbid-gold),transparent) !important;
          height:2px !important;
          box-shadow:0 0 16px rgba(201,164,92,0.42) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-tab-count,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-tab-count{
          background:rgba(255,255,255,0.075) !important;
          color:var(--kbid-muted) !important;
          border:1px solid rgba(255,255,255,0.06) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-tab.active .kbdr2-deals-tab-count,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-tab.active .kbdr2-work-tab-count{
          background:rgba(201,164,92,0.18) !important;
          color:#f6dfac !important;
          border-color:rgba(201,164,92,0.22) !important;
        }

        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-list{padding:8px 0 12px !important;background:transparent !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-row{
          margin:6px 10px !important;
          width:calc(100% - 20px) !important;
          padding:12px 12px !important;
          min-height:76px !important;
          border:1px solid rgba(255,255,255,0.055) !important;
          border-radius:16px !important;
          background:rgba(255,255,255,0.035) !important;
          color:var(--kbid-text) !important;
          box-shadow:none !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-row:hover{
          background:rgba(255,255,255,0.064) !important;
          border-color:rgba(201,164,92,0.20) !important;
          transform:translateY(-1px) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-row.active{
          background:linear-gradient(135deg,rgba(201,164,92,0.15),rgba(41,28,56,0.66)) !important;
          border-color:rgba(201,164,92,0.34) !important;
          box-shadow:0 16px 36px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.05) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-row.active::before{
          top:12px !important;
          bottom:12px !important;
          width:3px !important;
          background:linear-gradient(180deg,var(--kbid-gold),#8f6826) !important;
          box-shadow:0 0 18px rgba(201,164,92,0.50) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-name,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-empty-title,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-thread-empty-title{color:var(--kbid-text) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-vendor,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-preview,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-time,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-empty-sub,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-thread-empty-sub{color:var(--kbid-muted) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-priority-line{
          background:rgba(201,164,92,0.11) !important;
          border:1px solid rgba(201,164,92,0.18) !important;
          color:#f0d798 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-badge,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-badge.proposal,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-badge.active,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-badge.pending,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-badge.completed{
          background:rgba(31,109,58,0.22) !important;
          color:#bce8c7 !important;
          border:1px solid rgba(71,186,112,0.22) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-badge.archived{background:rgba(255,255,255,0.08) !important;color:var(--kbid-muted) !important;border:1px solid rgba(255,255,255,0.08) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-badge.disputed{background:rgba(172,69,69,0.18) !important;color:#ffc7c7 !important;border:1px solid rgba(172,69,69,0.22) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-unread{
          background:linear-gradient(135deg,var(--kbid-gold),#a9792f) !important;
          color:#100e12 !important;
          box-shadow:0 0 18px rgba(201,164,92,0.32) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-row-action{
          background:rgba(255,255,255,0.08) !important;
          border:1px solid rgba(255,255,255,0.10) !important;
          color:var(--kbid-muted) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deal-row-action:hover{background:rgba(201,164,92,0.20) !important;color:#f6dfac !important;}

        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-head{
          padding:18px 22px 16px !important;
          gap:14px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-eyebrow{
          color:var(--kbid-gold) !important;
          letter-spacing:0.14em !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-meta,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-meta span{color:var(--kbid-muted) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-status-dot{box-shadow:0 0 14px currentColor !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-secondary-btn,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-icon-btn,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-back{
          background:rgba(255,255,255,0.06) !important;
          color:var(--kbid-text) !important;
          border:1px solid rgba(255,255,255,0.09) !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.045) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-secondary-btn:hover,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-icon-btn:hover,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-back:hover{
          background:rgba(201,164,92,0.14) !important;
          color:#f6dfac !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-header-menu{
          background:rgba(16,18,27,0.96) !important;
          border:1px solid rgba(255,255,255,0.10) !important;
          box-shadow:0 24px 70px rgba(0,0,0,0.46) !important;
          color:var(--kbid-text) !important;
          backdrop-filter:blur(16px) !important;
          -webkit-backdrop-filter:blur(16px) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-header-menu-item{color:var(--kbid-text) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-header-menu-item:hover{background:rgba(255,255,255,0.07) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-header-menu-divider{background:rgba(255,255,255,0.08) !important;}

        .kbdr2-root.kb-inbox-dark-shell .kbdr2-thread-context,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-lifecycle,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-next-strip{
          background:rgba(255,255,255,0.03) !important;
          border-color:rgba(255,255,255,0.07) !important;
          color:var(--kbid-muted) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-thread-context-item{border-color:rgba(255,255,255,0.07) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-thread-context-item span{color:var(--kbid-muted-2) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-thread-context-item strong,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-thread-context-link{color:#f6dfac !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-lifecycle-text{color:var(--kbid-muted) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-lifecycle-step.done .kbdr2-lifecycle-pip,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-lifecycle-line.done{background:var(--kbid-green) !important;border-color:var(--kbid-green) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-lifecycle-pip{background:rgba(255,255,255,0.05) !important;border-color:rgba(255,255,255,0.12) !important;color:var(--kbid-muted) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-lifecycle-step.current .kbdr2-lifecycle-pip{border-color:var(--kbid-gold) !important;color:#f6dfac !important;box-shadow:0 0 0 4px rgba(201,164,92,0.12) !important;}

        .kbdr2-root.kb-inbox-dark-shell .kbdr2-stream,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-tab-body{
          background:
            radial-gradient(circle at 18% 0%,rgba(201,164,92,0.08),transparent 22%),
            radial-gradient(circle at 90% 8%,rgba(31,109,58,0.10),transparent 28%),
            linear-gradient(180deg,rgba(9,11,16,0.42),rgba(9,11,16,0.72)) !important;
          color:var(--kbid-text) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-message-mode .kbdr2-stream{
          padding:22px 28px 14px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-msg-row{color:var(--kbid-text) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-bubble{
          border:1px solid rgba(255,255,255,0.08) !important;
          box-shadow:0 12px 28px rgba(0,0,0,0.22),inset 0 1px 0 rgba(255,255,255,0.035) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-bubble.them{
          background:rgba(255,255,255,0.075) !important;
          color:var(--kbid-text) !important;
          border-color:rgba(255,255,255,0.10) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-bubble.me{
          background:linear-gradient(135deg,#12351f,#1f6d3a) !important;
          color:#f7fff5 !important;
          border-color:rgba(96,217,139,0.20) !important;
          box-shadow:0 16px 34px rgba(18,53,31,0.34),inset 0 1px 0 rgba(255,255,255,0.08) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-bubble.system{
          background:transparent !important;
          border:0 !important;
          color:var(--kbid-muted) !important;
          box-shadow:none !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-bubble-time{color:rgba(247,241,231,0.58) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-file-card,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-file-row,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-section,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-prop-card,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-command-card{
          background:rgba(255,255,255,0.045) !important;
          border-color:rgba(255,255,255,0.08) !important;
          color:var(--kbid-text) !important;
          box-shadow:0 14px 34px rgba(0,0,0,0.22) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-file-name,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-file-row-name,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-section-title,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-prop-title,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-command-title{color:var(--kbid-text) !important;}

        .kbdr2-root.kb-inbox-dark-shell .kbdr2-composer,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-message-mode .kbdr2-composer{
          background:linear-gradient(180deg,rgba(13,15,22,0.72),rgba(13,15,22,0.96)) !important;
          border-top:1px solid rgba(255,255,255,0.075) !important;
          padding:14px 22px 16px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-composer-inner,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-message-mode .kbdr2-composer-inner{
          background:rgba(255,255,255,0.065) !important;
          border:1px solid rgba(255,255,255,0.11) !important;
          border-radius:16px !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.045),0 18px 40px rgba(0,0,0,0.22) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-composer-inner:focus-within,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-message-mode .kbdr2-composer-inner:focus-within{
          border-color:rgba(201,164,92,0.46) !important;
          box-shadow:0 0 0 3px rgba(201,164,92,0.12),0 18px 40px rgba(0,0,0,0.24) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-composer textarea{
          color:var(--kbid-text) !important;
          caret-color:var(--kbid-gold) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-composer textarea::placeholder{color:rgba(247,241,231,0.38) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-composer-tool{color:var(--kbid-muted) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-composer-tool:hover{background:rgba(255,255,255,0.08) !important;color:#f6dfac !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-composer-send,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-message-mode .kbdr2-composer-send{
          background:linear-gradient(135deg,var(--kbid-gold),#a9792f) !important;
          color:#100e12 !important;
          box-shadow:0 12px 28px rgba(201,164,92,0.24),inset 0 1px 0 rgba(255,255,255,0.28) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-composer-send:disabled{background:rgba(255,255,255,0.10) !important;color:rgba(247,241,231,0.38) !important;box-shadow:none !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-composer-readonly .kbdr2-composer-inner{background:rgba(255,255,255,0.04) !important;border-color:rgba(255,255,255,0.08) !important;}

        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-empty,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-empty,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-thread-empty{
          color:var(--kbid-muted) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-empty-icon,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-empty-icon,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-thread-empty-icon{
          background:rgba(255,255,255,0.055) !important;
          color:#f6dfac !important;
          border:1px solid rgba(201,164,92,0.18) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-empty-title{color:var(--kbid-text) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals-empty-spinner{border-color:rgba(255,255,255,0.11) !important;border-top-color:var(--kbid-gold) !important;}
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-mobile-quickviews,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-mobile-glance{
          background:rgba(255,255,255,0.025) !important;
          border-color:rgba(255,255,255,0.06) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-mobile-quickview,
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-mobile-glance-pill{
          background:rgba(255,255,255,0.06) !important;
          border-color:rgba(255,255,255,0.10) !important;
          color:var(--kbid-text) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell .kbdr2-mobile-quickview.active{
          background:rgba(201,164,92,0.18) !important;
          border-color:rgba(201,164,92,0.34) !important;
          color:#f6dfac !important;
        }

        @media (max-width:860px){
          .kbdr2-root.kb-inbox-dark-shell .kbdr2-topbar{height:58px !important;min-height:58px !important;padding:8px 10px !important;}
          .kbdr2-root.kb-inbox-dark-shell .kbdr2-content{padding:10px 8px 8px !important;gap:10px !important;}
          .kbdr2-root.kb-inbox-dark-shell .kbdr2-deals,
          .kbdr2-root.kb-inbox-dark-shell .kbdr2-work{border-radius:20px !important;}
          .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-message-mode .kbdr2-stream{padding:16px 12px 10px !important;}
          .kbdr2-root.kb-inbox-dark-shell .kbdr2-composer,
          .kbdr2-root.kb-inbox-dark-shell .kbdr2-work-message-mode .kbdr2-composer{padding:10px 10px calc(10px + env(safe-area-inset-bottom,0px)) !important;}
        }
        @media (max-width:480px){
          .kbdr2-root.kb-inbox-dark-shell .kbdr2-topbar-icon:nth-of-type(2),
          .kbdr2-root.kb-inbox-dark-shell .kbdr2-user-chip{display:none !important;}
        }

        /* ═════════════ 852af INBOX DARK RENDER-MATCH POLISH — VISUAL ONLY ═════════════
           Final scoped visual layer: compress chrome, sharpen command header, tighten rows,
           refine chips/composer, and keep all data/message handlers untouched. */
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish{
          --kbid-panel-hi:rgba(28,23,39,0.90);
          --kbid-panel-lo:rgba(10,12,18,0.92);
          --kbid-hairline:rgba(255,255,255,0.075);
          --kbid-hairline-2:rgba(201,164,92,0.18);
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-topbar{
          height:50px !important;
          min-height:50px !important;
          padding:8px 22px 0 !important;
          background:transparent !important;
          border-bottom:0 !important;
          box-shadow:none !important;
          backdrop-filter:none !important;
          -webkit-backdrop-filter:none !important;
          gap:12px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-search{
          height:36px !important;
          max-width:520px !important;
          padding:0 13px !important;
          border-radius:13px !important;
          background:rgba(255,255,255,0.045) !important;
          border-color:rgba(255,255,255,0.085) !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.05) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-search input{font-size:12.5px !important;}
        @media(max-width:900px){
          /* 0165 — 12.5px triggers iOS Safari auto-zoom on focus; 16px is the
             floor that prevents it. Scoped to mobile/tablet only so the
             intentional compact desktop search sizing is untouched. */
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-search input{font-size:16px !important;}
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-topbar-icon{
          width:36px !important;
          height:36px !important;
          border-radius:11px !important;
          background:rgba(255,255,255,0.035) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-user-chip{
          height:36px !important;
          padding:3px 10px 3px 4px !important;
          background:rgba(255,255,255,0.038) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-user-avatar{width:28px !important;height:28px !important;font-size:10px !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-user-name{font-size:11.5px !important;max-width:145px !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-user-role{font-size:10px !important;}

        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-content{
          grid-template-columns:minmax(310px,clamp(310px,26vw,368px)) minmax(0,1fr) !important;
          gap:14px !important;
          padding:12px 22px 18px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deals,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work{
          border-radius:22px !important;
          background:linear-gradient(180deg,var(--kbid-panel-hi),var(--kbid-panel-lo)) !important;
          border-color:var(--kbid-hairline) !important;
          box-shadow:0 22px 62px rgba(0,0,0,0.34),inset 0 1px 0 rgba(255,255,255,0.045) !important;
        }

        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deals-head{
          padding:14px 15px 9px !important;
          min-height:52px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deals-title{
          font-size:22px !important;
          line-height:1 !important;
          position:relative !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deals-title::after{
          content:"Private command center";
          display:block;
          margin-top:5px;
          font-family:'DM Mono',monospace;
          font-size:8.5px;
          line-height:1;
          letter-spacing:.16em;
          text-transform:uppercase;
          color:rgba(247,241,231,0.42);
          font-weight:800;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-new-btn{
          height:31px !important;
          padding:0 11px !important;
          font-size:10.5px !important;
          letter-spacing:.03em !important;
          background:rgba(201,164,92,0.13) !important;
          color:#f3daa2 !important;
          border-color:rgba(201,164,92,0.30) !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.08) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-inbox-stats{
          padding:7px 13px !important;
          min-height:34px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-inbox-all-clear,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-inbox-stat{
          height:22px !important;
          padding:0 8px !important;
          font-size:9.5px !important;
          letter-spacing:.09em !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deals-tabs{
          padding:0 13px !important;
          gap:15px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deals-tab{
          padding:9px 0 10px !important;
          font-size:11.2px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deals-tab-count{
          padding:0 6px !important;
          font-size:9.5px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deals-list{padding:6px 0 9px !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-row{
          min-height:64px !important;
          margin:4px 8px !important;
          width:calc(100% - 16px) !important;
          padding:9px 10px !important;
          gap:9px !important;
          border-radius:14px !important;
          background:rgba(255,255,255,0.028) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-row.active{
          background:linear-gradient(135deg,rgba(201,164,92,0.13),rgba(35,25,49,0.56)) !important;
          border-color:rgba(201,164,92,0.34) !important;
          box-shadow:0 12px 30px rgba(0,0,0,0.23),inset 0 1px 0 rgba(255,255,255,0.045) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-row.active::before{top:10px !important;bottom:10px !important;width:3px !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-avatar{
          width:32px !important;
          height:32px !important;
          font-size:10.5px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-line1{margin-bottom:2px !important;gap:6px !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-name{font-size:12.2px !important;line-height:1.15 !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-vendor{font-size:10.8px !important;line-height:1.15 !important;margin-bottom:2px !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-preview{font-size:10.7px !important;line-height:1.22 !important;color:rgba(247,241,231,0.50) !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-time{font-size:9.5px !important;color:rgba(247,241,231,0.42) !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-badge{
          padding:2px 6px !important;
          font-size:8px !important;
          line-height:1.15 !important;
          letter-spacing:.075em !important;
          text-transform:uppercase !important;
          font-family:'DM Mono',monospace !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-unread{
          min-width:16px !important;
          height:16px !important;
          padding:0 5px !important;
          font-size:8.5px !important;
        }

        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-head{
          padding:12px 17px !important;
          gap:12px !important;
          min-height:68px !important;
          background:linear-gradient(180deg,rgba(255,255,255,0.052),rgba(255,255,255,0.018)) !important;
          border-bottom:1px solid rgba(255,255,255,0.07) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-avatar{
          width:42px !important;
          height:42px !important;
          font-size:12.5px !important;
          border-radius:15px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-info{gap:2px !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-eyebrow{
          font-size:8.5px !important;
          line-height:1 !important;
          letter-spacing:.18em !important;
          color:#d7b86f !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-title{
          font-size:20px !important;
          line-height:1.05 !important;
          letter-spacing:-0.035em !important;
          margin-bottom:2px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-meta{
          gap:7px !important;
          font-size:11px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-status{
          display:inline-flex !important;
          align-items:center !important;
          gap:5px !important;
          padding:3px 7px !important;
          border-radius:999px !important;
          background:rgba(31,109,58,0.16) !important;
          border:1px solid rgba(71,186,112,0.18) !important;
          color:#bce8c7 !important;
          font-family:'DM Mono',monospace !important;
          font-size:9px !important;
          letter-spacing:.08em !important;
          text-transform:uppercase !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-actions{gap:8px !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-actions .kbdr2-secondary-btn,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-actions .kbdr2-primary-btn{
          height:34px !important;
          padding:0 13px !important;
          border-radius:12px !important;
          font-size:11px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-icon-btn{
          width:34px !important;
          height:34px !important;
          border-radius:12px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-thread-context,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-lifecycle{
          margin-top:8px !important;
          padding:7px 8px !important;
          border-radius:14px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-stream{
          padding:18px 24px 10px !important;
          padding-bottom:104px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-msg-row{margin-bottom:14px !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-msg-avatar{width:28px !important;height:28px !important;font-size:9.5px !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-bubble{
          padding:10px 12px !important;
          border-radius:15px !important;
          font-size:12.8px !important;
          line-height:1.45 !important;
          max-width:min(680px,78%) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-bubble.them{background:rgba(255,255,255,0.062) !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-bubble.me{background:linear-gradient(135deg,#102d1b,#1f6d3a) !important;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-composer{
          padding:10px 16px 12px !important;
          background:linear-gradient(180deg,rgba(13,15,22,0.58),rgba(13,15,22,0.97)) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-inner,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-composer-inner{
          min-height:48px !important;
          border-radius:14px !important;
          background:rgba(255,255,255,0.052) !important;
          border-color:rgba(255,255,255,0.10) !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.045),0 14px 34px rgba(0,0,0,0.18) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer textarea{
          min-height:24px !important;
          max-height:82px !important;
          padding:8px 6px !important;
          font-size:13px !important;
          line-height:1.35 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-send,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-composer-send{
          width:38px !important;
          height:38px !important;
          border-radius:12px !important;
          margin:4px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-hint{
          font-size:9.5px !important;
          color:rgba(247,241,231,0.38) !important;
        }
        @media (max-width:1240px){
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-content{grid-template-columns:minmax(286px,326px) minmax(0,1fr) !important;padding-left:12px !important;padding-right:12px !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-title{font-size:18px !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-stream{padding-left:18px !important;padding-right:18px !important;}
        }
        @media (max-width:860px){
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-topbar{height:48px !important;min-height:48px !important;padding:8px 10px 0 !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-content{padding:8px !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deals-head{padding:12px 13px 8px !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-row{min-height:62px !important;margin:4px 7px !important;width:calc(100% - 14px) !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-head{min-height:62px !important;padding:10px 12px !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-avatar{width:38px !important;height:38px !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-stream{padding:14px 12px 92px !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-bubble{max-width:88% !important;font-size:13px !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer,
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-composer{padding:9px 10px calc(9px + env(safe-area-inset-bottom,0px)) !important;}
        }

        /* ═════════════ 852ah INBOX COMPOSER OVERLAP + FINAL POLISH — VISUAL ONLY ═════════════
           Fixes the bottom-right send-label collision by making the dark Inbox composer
           a true command input: tools / text field / icon-only send button stay in separate
           lanes. Scoped to Inbox only; no handlers, queries, vine, clay, or routing touched. */
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-composer{
          padding:9px 16px 11px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-inner,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-composer-inner{
          display:grid !important;
          grid-template-columns:auto minmax(0,1fr) 40px !important;
          align-items:center !important;
          gap:8px !important;
          min-height:46px !important;
          padding:4px 5px 4px 8px !important;
          overflow:hidden !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-tools{
          display:flex !important;
          align-items:center !important;
          gap:2px !important;
          padding:0 8px 0 0 !important;
          margin-right:1px !important;
          border-right:1px solid rgba(255,255,255,0.075) !important;
          min-width:0 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-tool{
          width:28px !important;
          height:28px !important;
          border-radius:9px !important;
          flex:0 0 28px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer textarea,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-composer textarea{
          width:100% !important;
          min-width:0 !important;
          height:auto !important;
          min-height:22px !important;
          max-height:78px !important;
          padding:7px 2px !important;
          overflow:auto !important;
          line-height:1.35 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-send,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-composer-send{
          width:40px !important;
          min-width:40px !important;
          max-width:40px !important;
          height:36px !important;
          min-height:36px !important;
          margin:0 !important;
          padding:0 !important;
          gap:0 !important;
          justify-self:end !important;
          overflow:hidden !important;
          flex:0 0 40px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-send svg{
          flex:0 0 auto !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-send-label{
          display:none !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-send:not(:disabled):hover{
          transform:translateY(-1px) !important;
          box-shadow:0 14px 30px rgba(201,164,92,0.28),inset 0 1px 0 rgba(255,255,255,0.30) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-send:active:not(:disabled){
          transform:translateY(0) scale(.98) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-stream{
          padding-bottom:92px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-day-label{
          color:rgba(247,241,231,0.40) !important;
          font-family:'DM Mono',monospace !important;
          font-size:9.5px !important;
          letter-spacing:.14em !important;
          text-transform:uppercase !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-new-message-pill{
          background:rgba(13,15,22,0.94) !important;
          border:1px solid rgba(201,164,92,0.28) !important;
          color:#f3daa2 !important;
          box-shadow:0 14px 34px rgba(0,0,0,0.34),inset 0 1px 0 rgba(255,255,255,0.06) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-header-menu{
          background:linear-gradient(180deg,rgba(22,20,31,0.98),rgba(13,15,22,0.98)) !important;
          border:1px solid rgba(255,255,255,0.10) !important;
          box-shadow:0 18px 46px rgba(0,0,0,0.42),inset 0 1px 0 rgba(255,255,255,0.045) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-header-menu-item{
          color:rgba(247,241,231,0.82) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-header-menu-item:hover{
          background:rgba(255,255,255,0.07) !important;
          color:#fff7e6 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-header-menu-divider{
          background:rgba(255,255,255,0.08) !important;
        }
        @media (max-width:860px){
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-inner,
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-composer-inner{
            grid-template-columns:minmax(0,1fr) 40px !important;
            padding-left:9px !important;
          }
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-composer-tools{display:none !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-work-message-mode .kbdr2-stream{padding-bottom:86px !important;}
        }


        /* ═════════════ 852ai INBOX THREAD SELECTION SAFETY — TARGETED ═════════════
           Keeps the left thread card as the pointer target and makes selected state
           visibly register immediately; data handlers and Supabase queries remain unchanged. */
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-row{
          pointer-events:auto !important;
          user-select:none !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-row .kbdr2-deal-row-action{
          position:relative !important;
          z-index:3 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish .kbdr2-deal-row.active{
          outline:1px solid rgba(201,164,92,0.26) !important;
          outline-offset:-1px !important;
        }

        /* ═════════════ 852ak INBOX FINAL VISUAL QA POLISH — VISUAL ONLY ═════════════
           Final scoped Inbox polish: stronger selected state, premium loading/empty states,
           tighter command header, refined bubbles, and safer composer lanes. No data,
           Supabase, auth, routing, marketplace, header-border, clay artwork, or mask rules touched. */
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa{
          --kbid-final-ink:#090b10;
          --kbid-final-plum:#1a1324;
          --kbid-final-gold:#c9a45c;
          --kbid-final-gold-soft:rgba(201,164,92,0.18);
          --kbid-final-green:#1f6d3a;
          --kbid-final-text:#f7f1e7;
          --kbid-final-muted:rgba(247,241,231,0.58);
          --kbid-final-dim:rgba(247,241,231,0.38);
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-topbar{
          height:46px !important;
          min-height:46px !important;
          padding:7px 22px 0 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-search{
          height:34px !important;
          max-width:470px !important;
          border-radius:12px !important;
          background:rgba(255,255,255,0.038) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-content{
          grid-template-columns:minmax(312px,342px) minmax(0,1fr) !important;
          gap:16px !important;
          padding:10px 22px 18px !important;
        }

        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deals-head{
          padding:14px 15px 8px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deals-title::after{
          content:"Private command center" !important;
          color:rgba(247,241,231,0.48) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-new-btn{
          height:30px !important;
          padding:0 10px !important;
          background:rgba(201,164,92,0.11) !important;
          color:#f4dca7 !important;
          border:1px solid rgba(201,164,92,0.23) !important;
          box-shadow:none !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-new-btn:hover{
          background:rgba(201,164,92,0.18) !important;
          color:#fff1c6 !important;
          transform:translateY(-1px) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deals-tabs{
          border-bottom:1px solid rgba(255,255,255,0.065) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deals-tab.active::after{
          height:2px !important;
          background:linear-gradient(90deg,rgba(201,164,92,0.40),#c9a45c,rgba(201,164,92,0.40)) !important;
          box-shadow:0 0 16px rgba(201,164,92,0.22) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-row{
          min-height:62px !important;
          margin:4px 8px !important;
          padding:8px 10px !important;
          border:1px solid rgba(255,255,255,0.045) !important;
          background:rgba(255,255,255,0.024) !important;
          transition:background .14s ease,border-color .14s ease,box-shadow .14s ease,transform .14s ease !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-row:hover{
          background:rgba(255,255,255,0.045) !important;
          border-color:rgba(255,255,255,0.095) !important;
          transform:translateY(-1px) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-row.active{
          background:linear-gradient(135deg,rgba(201,164,92,0.17),rgba(31,22,45,0.78)) !important;
          border-color:rgba(201,164,92,0.52) !important;
          box-shadow:0 16px 38px rgba(0,0,0,0.30),0 0 0 1px rgba(201,164,92,0.10) inset,0 0 24px rgba(201,164,92,0.08) !important;
          transform:none !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-row.active::before{
          top:9px !important;
          bottom:9px !important;
          width:4px !important;
          background:linear-gradient(180deg,#f1d486,#c9a45c,#8f6a24) !important;
          box-shadow:0 0 16px rgba(201,164,92,0.55) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-row.active .kbdr2-deal-name{
          color:#fff7e6 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-row.active .kbdr2-deal-preview{
          color:rgba(247,241,231,0.66) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-avatar{
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.22),0 6px 16px rgba(0,0,0,0.16) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-row-action{
          width:25px !important;
          height:25px !important;
          opacity:.46 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-row:hover .kbdr2-deal-row-action,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-row.active .kbdr2-deal-row-action{
          opacity:.9 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-badge{
          border-radius:999px !important;
          padding:2px 6px !important;
          border:1px solid rgba(255,255,255,0.075) !important;
          box-shadow:none !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-deal-unread{
          background:linear-gradient(180deg,#d8b96d,#b78b3b) !important;
          color:#14100a !important;
          box-shadow:0 0 0 2px rgba(13,15,22,0.82),0 7px 18px rgba(201,164,92,0.30) !important;
        }

        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-head{
          min-height:64px !important;
          padding:10px 16px !important;
          background:linear-gradient(180deg,rgba(255,255,255,0.052),rgba(255,255,255,0.018)) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-title{
          max-width:min(720px,58vw) !important;
          font-size:19px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-meta{
          display:flex !important;
          align-items:center !important;
          flex-wrap:wrap !important;
          gap:6px !important;
          color:rgba(247,241,231,0.54) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-meta span[style*="color:#1F3A2E"]{
          color:#f3daa2 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-actions{
          align-items:center !important;
          gap:7px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-actions .kbdr2-secondary-btn{
          height:32px !important;
          padding:0 12px !important;
          font-size:10.8px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-tab{
          font-size:11.5px !important;
          letter-spacing:.04em !important;
          text-transform:uppercase !important;
        }

        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-empty,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-empty{
          background:linear-gradient(180deg,rgba(22,20,31,0.92),rgba(13,15,22,0.95)) !important;
          border:1px solid rgba(255,255,255,0.10) !important;
          box-shadow:0 22px 60px rgba(0,0,0,0.34),inset 0 1px 0 rgba(255,255,255,0.045) !important;
          color:var(--kbid-final-text) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-empty-icon,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-empty-icon{
          background:rgba(201,164,92,0.105) !important;
          border:1px solid rgba(201,164,92,0.24) !important;
          color:#f4dca7 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-empty-title,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-empty-title{
          color:#fff7e6 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-empty-sub,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-empty-sub{
          color:rgba(247,241,231,0.60) !important;
        }

        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-loading{
          width:100%;
          max-width:720px;
          margin:34px auto;
          display:flex;
          flex-direction:column;
          gap:14px;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-loading-card{
          width:min(76%,560px);
          border-radius:18px;
          padding:14px 16px;
          background:rgba(255,255,255,0.052);
          border:1px solid rgba(255,255,255,0.08);
          box-shadow:0 14px 34px rgba(0,0,0,0.22);
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-loading-card.align-right{
          align-self:flex-end;
          width:min(58%,420px);
          background:rgba(31,109,58,0.16);
          border-color:rgba(71,186,112,0.14);
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-loading-kicker{
          display:block;
          margin-bottom:10px;
          font-family:'DM Mono',monospace;
          font-size:9px;
          letter-spacing:.15em;
          text-transform:uppercase;
          color:rgba(247,241,231,0.40);
          font-weight:800;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-loading-line{
          display:block;
          height:9px;
          margin:8px 0;
          border-radius:999px;
          background:linear-gradient(90deg,rgba(255,255,255,0.07),rgba(255,255,255,0.18),rgba(255,255,255,0.07));
          background-size:220% 100%;
          animation:kbdr2FinalShimmer 1.25s ease-in-out infinite;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-loading-line.wide{width:84%;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-loading-line.mid{width:64%;}
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-thread-loading-line.short{width:42%;}
        @keyframes kbdr2FinalShimmer{0%{background-position:220% 0}100%{background-position:-220% 0}}

        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-message-mode .kbdr2-stream{
          padding:18px 26px 92px !important;
          background:radial-gradient(circle at 50% 0%,rgba(201,164,92,0.055),transparent 34%),linear-gradient(180deg,rgba(9,11,16,0.12),rgba(9,11,16,0.52)) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-msg-row{
          margin-bottom:12px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-msg-row.grouped{
          margin-top:-7px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-bubble{
          max-width:min(660px,76%) !important;
          padding:9px 12px !important;
          line-height:1.44 !important;
          box-shadow:0 10px 26px rgba(0,0,0,0.18) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-bubble.them{
          background:rgba(255,255,255,0.055) !important;
          border:1px solid rgba(255,255,255,0.08) !important;
          color:rgba(247,241,231,0.88) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-bubble.me{
          background:linear-gradient(135deg,#102d1b 0%,#1d6738 100%) !important;
          border:1px solid rgba(112,210,139,0.16) !important;
          box-shadow:0 12px 28px rgba(11,59,31,0.32),inset 0 1px 0 rgba(255,255,255,0.10) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-bubble-time{
          margin-top:5px !important;
          font-size:9px !important;
          letter-spacing:.045em !important;
          text-transform:uppercase !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-typing-bubble{
          min-width:58px !important;
        }

        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-composer,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-message-mode .kbdr2-composer{
          padding:8px 16px 10px !important;
          border-top:1px solid rgba(255,255,255,0.075) !important;
          box-shadow:0 -18px 36px rgba(0,0,0,0.20) !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-composer-inner,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-message-mode .kbdr2-composer-inner{
          grid-template-columns:auto minmax(0,1fr) 42px !important;
          min-height:44px !important;
          padding:4px 5px 4px 8px !important;
          gap:7px !important;
          border-radius:13px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-composer textarea,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-message-mode .kbdr2-composer textarea{
          min-height:20px !important;
          max-height:72px !important;
          padding:7px 2px !important;
          font-size:12.8px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-composer-send,
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-message-mode .kbdr2-composer-send{
          width:42px !important;
          min-width:42px !important;
          max-width:42px !important;
          height:36px !important;
          border-radius:12px !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-composer-send-label{
          display:none !important;
          visibility:hidden !important;
          max-width:0 !important;
        }
        .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-composer-meta{
          display:none !important;
        }

        @media (max-width:1240px){
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-content{
            grid-template-columns:minmax(286px,324px) minmax(0,1fr) !important;
          }
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-title{max-width:48vw !important;}
        }

        /* ═══════════════════ 0176 DEAL ROOM DESKTOP WIDTH CASCADE LOCK ═══════════════════
           Canonical Deal Rooms must remain a single full-width workspace at desktop/tablet-
           landscape widths. This intentionally outranks the older final-QA <=1240 Inbox
           two-column rule, whose first 286–324px column otherwise captures the Deal Room
           after the Inbox list is hidden. Normal Inbox layout is unaffected. */
        @media (min-width:861px){
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-content.kbdr2-canonical-open{
            display:grid !important;
            grid-template-columns:minmax(0,1fr) !important;
            gap:0 !important;
            width:100% !important;
            max-width:100% !important;
            min-width:0 !important;
            padding:14px clamp(14px,2vw,28px) 20px !important;
            overflow:hidden !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-content.kbdr2-canonical-open > .kbdr2-deals{
            display:none !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-content.kbdr2-canonical-open > .kbdr2-work.kbdr2-canonical-dealroom{
            grid-column:1 / -1 !important;
            width:min(1480px,100%) !important;
            max-width:1480px !important;
            min-width:0 !important;
            justify-self:center !important;
            margin:0 !important;
          }
        }

        /* ═══════════════════ 0177 DEAL ROOM VISUAL ARCHITECTURE LOCK ═══════════════════
           Canonical Deal Room only. Neutralizes legacy Inbox positioning/polish that was
           correct for the ordinary Inbox but wrong once Messages became a secondary rail.
           Keeps one fluid desktop composition from laptop through monitor widths. */
        @media (min-width:861px){
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom{
            padding-top:0 !important;
            background-color:#eee6d9 !important;
            background-image:linear-gradient(180deg,rgba(255,253,248,.28),rgba(238,230,217,.08)),var(--kb-workspace-clay-layer) !important;
            background-size:cover !important;
            background-position:center top !important;
            color:#1f2d20 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-main{
            min-width:0 !important;
            min-height:0 !important;
            background:transparent !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-topbar{
            display:none !important;
            height:0 !important;
            min-height:0 !important;
            margin:0 !important;
            padding:0 !important;
            border:0 !important;
            box-shadow:none !important;
            overflow:hidden !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-content.kbdr2-canonical-open{
            grid-template-columns:minmax(0,1fr) !important;
            gap:0 !important;
            padding:clamp(10px,1vw,16px) clamp(12px,1.35vw,22px) clamp(14px,1.25vw,20px) !important;
            width:100% !important;
            max-width:none !important;
            min-width:0 !important;
            min-height:0 !important;
            overflow:hidden !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-content.kbdr2-canonical-open > .kbdr2-work.kbdr2-canonical-dealroom{
            grid-column:1 / -1 !important;
            width:100% !important;
            max-width:none !important;
            min-width:0 !important;
            min-height:0 !important;
            margin:0 !important;
            justify-self:stretch !important;
          }
          /* ═══════════════════ 0186 COLLAPSIBLE CANONICAL MESSAGES RAIL ═══════════════════
             One authoritative desktop split owner. Expanded and collapsed states retain
             the same two-track structure for smooth grid interpolation. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-dealroom.kbdr2-canonical-split{
            grid-template-columns:minmax(0,1fr) clamp(340px,28vw,410px) !important;
            grid-template-rows:auto minmax(0,1fr) !important;
            height:100% !important;
            max-height:100% !important;
            min-height:0 !important;
            border:1px solid rgba(155,116,50,.16) !important;
            border-radius:20px !important;
            background:#fffdf8 !important;
            overflow:hidden !important;
            box-shadow:0 15px 40px rgba(42,53,32,.085) !important;
            transition:grid-template-columns 260ms cubic-bezier(.2,.8,.2,1) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-dealroom.kbdr2-canonical-split.kbdr2-messages-collapsed{
            grid-template-columns:minmax(0,1fr) 52px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split > .kbdr2-work-head{
            grid-column:1 / -1 !important;
            grid-row:1 !important;
            min-height:66px !important;
            padding:10px 17px 9px !important;
            border-bottom:1px solid rgba(155,116,50,.13) !important;
            background-color:#f5efe4 !important;
            background-image:linear-gradient(90deg,rgba(255,253,248,.50),rgba(238,230,217,.20)),var(--kb-workspace-clay-layer) !important;
            background-size:cover !important;
            overflow:visible !important;
            z-index:30 !important;
          }

          /* ═══════════════════ 0187 EXACT DEAL ROOM PROJECT SWITCHER ═══════════════════ */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-work-title-shell{
            position:relative !important;
            display:flex !important;
            align-items:center !important;
            min-width:0 !important;
            max-width:min(760px,58vw) !important;
            gap:7px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-trigger{
            appearance:none !important;
            display:inline-flex !important;
            align-items:center !important;
            min-width:0 !important;
            max-width:100% !important;
            gap:7px !important;
            padding:0 !important;
            border:0 !important;
            background:transparent !important;
            cursor:pointer !important;
            text-align:left !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-trigger-title{
            min-width:0 !important;
            overflow:hidden !important;
            text-overflow:ellipsis !important;
            white-space:nowrap !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-trigger-caret{
            flex:0 0 auto !important;
            width:24px !important;
            height:24px !important;
            display:inline-flex !important;
            align-items:center !important;
            justify-content:center !important;
            border-radius:8px !important;
            color:#7d715d !important;
            background:rgba(176,136,64,.08) !important;
            transition:transform 140ms ease,background 140ms ease,color 140ms ease !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-trigger:hover .kbdr2-project-switcher-trigger-caret{
            background:rgba(176,136,64,.15) !important;
            color:#8d682d !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-trigger[aria-expanded="true"] .kbdr2-project-switcher-trigger-caret{
            transform:rotate(180deg) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-muted{
            flex:0 0 auto !important;
            display:inline-flex !important;
            align-items:center !important;
            color:#8b8478 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-menu{
            position:absolute !important;
            left:0 !important;
            top:calc(100% + 10px) !important;
            z-index:120 !important;
            width:min(390px,calc(100vw - 44px)) !important;
            max-height:min(510px,calc(100vh - 150px)) !important;
            overflow-y:auto !important;
            padding:8px !important;
            border:1px solid #d9cfbd !important;
            border-radius:16px !important;
            background:#fffdf8 !important;
            color:#1C2814 !important;
            box-shadow:0 22px 54px rgba(42,53,32,.18),0 4px 12px rgba(42,53,32,.08) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-head{
            display:flex !important;
            align-items:center !important;
            justify-content:space-between !important;
            padding:7px 8px 9px !important;
            color:#876a36 !important;
            font-family:'DM Mono',monospace !important;
            font-size:8.5px !important;
            font-weight:900 !important;
            letter-spacing:.16em !important;
            text-transform:uppercase !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-head small{
            display:inline-flex !important;
            align-items:center !important;
            justify-content:center !important;
            min-width:21px !important;
            height:21px !important;
            padding:0 6px !important;
            border-radius:999px !important;
            background:#f0eadf !important;
            color:#6b6e63 !important;
            font-size:8.5px !important;
            letter-spacing:0 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-section + .kbdr2-project-switcher-section{
            margin-top:7px !important;
            padding-top:7px !important;
            border-top:1px solid #e8dfd1 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-section-label{
            padding:5px 8px !important;
            color:#8a8378 !important;
            font-family:'DM Mono',monospace !important;
            font-size:8px !important;
            font-weight:900 !important;
            letter-spacing:.14em !important;
            text-transform:uppercase !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-item{
            width:100% !important;
            display:grid !important;
            grid-template-columns:8px minmax(0,1fr) auto auto !important;
            align-items:center !important;
            gap:9px !important;
            padding:10px 9px !important;
            border:0 !important;
            border-radius:11px !important;
            background:transparent !important;
            color:#243122 !important;
            text-align:left !important;
            cursor:pointer !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-item:hover{
            background:#f4efe6 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-item.is-current{
            background:#edf2e9 !important;
            box-shadow:inset 0 0 0 1px #d4dfcf !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-status{
            width:7px !important;
            height:7px !important;
            border-radius:999px !important;
            background:#8c9288 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-status.is-progress{background:#4f7156 !important}
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-status.is-review{background:#b18435 !important}
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-status.is-hired{background:#9b7432 !important}
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-status.is-complete{background:#6d7668 !important}
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-copy{
            min-width:0 !important;
            display:flex !important;
            flex-direction:column !important;
            gap:3px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-copy strong{
            min-width:0 !important;
            overflow:hidden !important;
            text-overflow:ellipsis !important;
            white-space:nowrap !important;
            color:#22301f !important;
            font-size:11.5px !important;
            line-height:1.2 !important;
            font-weight:850 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-copy small{
            min-width:0 !important;
            overflow:hidden !important;
            text-overflow:ellipsis !important;
            white-space:nowrap !important;
            color:#817a6f !important;
            font-size:9.5px !important;
            line-height:1.2 !important;
            font-weight:650 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-unread{
            min-width:20px !important;
            height:20px !important;
            display:inline-flex !important;
            align-items:center !important;
            justify-content:center !important;
            padding:0 5px !important;
            border-radius:999px !important;
            background:#b08840 !important;
            color:#fff !important;
            font-size:8.5px !important;
            font-weight:900 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-project-switcher-current{
            color:#446044 !important;
            font-family:'DM Mono',monospace !important;
            font-size:7.5px !important;
            font-weight:900 !important;
            letter-spacing:.08em !important;
            text-transform:uppercase !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split > .kbdr2-canonical-overview{
            grid-column:1 !important;
            grid-row:2 !important;
            min-width:0 !important;
            min-height:0 !important;
            overflow-y:auto !important;
            overflow-x:hidden !important;
            padding:15px 17px 18px !important;
            background:linear-gradient(180deg,#fffdf8 0%,#faf5eb 100%) !important;
          }

          /* Current state is an operational summary, not a landing-page hero. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-next{
            padding:17px 19px 17px !important;
            border:1px solid rgba(155,116,50,.19) !important;
            border-radius:16px !important;
            background:linear-gradient(135deg,#fffdf8 0%,#f8f0e2 100%) !important;
            box-shadow:0 7px 20px rgba(42,53,32,.045) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-next::before{
            width:3px !important;
            background:linear-gradient(180deg,#b08840,#d7bd7a) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-next.ready_for_review::before,
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-next.completed::before{
            background:linear-gradient(180deg,#3f6546,#91a986) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-next-top{
            margin-bottom:8px !important;
            gap:12px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-next h2{
            max-width:760px !important;
            font-size:clamp(25px,2.15vw,31px) !important;
            line-height:1.04 !important;
            letter-spacing:-.032em !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-next p{
            margin:7px 0 0 !important;
            max-width:760px !important;
            font-size:12.5px !important;
            line-height:1.46 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-action-row{
            margin-top:11px !important;
            gap:8px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-action-primary,
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-action-secondary{
            min-height:38px !important;
            padding:8px 14px !important;
          }

          /* Accepted agreement stays visible without consuming the first viewport. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-agreement{
            position:relative !important;
            margin-top:11px !important;
            padding:14px 15px 15px !important;
            border:1px solid rgba(115,102,80,.15) !important;
            border-radius:15px !important;
            background:#fffdfa !important;
            box-shadow:0 5px 16px rgba(42,53,32,.032) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-agreement::before{
            content:"" !important;
            position:absolute !important;
            left:15px !important;
            right:15px !important;
            top:0 !important;
            height:2px !important;
            border-radius:999px !important;
            background:linear-gradient(90deg,#b08840,rgba(176,136,64,.12)) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-section-head{
            margin-bottom:9px !important;
            gap:12px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-section-head h3{
            margin-top:3px !important;
            font-size:17px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-agreement-strip{
            border-color:#e5dac8 !important;
            background:#e5dac8 !important;
            border-radius:12px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-agreement-strip > div{
            padding:10px 12px !important;
            background:#fbf8f1 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-agreement-strip strong{
            font-size:13px !important;
            letter-spacing:-.01em !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-agreement-copy{
            margin:9px 1px 0 !important;
            font-size:12px !important;
            line-height:1.48 !important;
            -webkit-line-clamp:2 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-milestone-list{
            margin-top:9px !important;
            border-radius:11px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-milestone-row{
            padding:6px 9px !important;
            font-size:10.8px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-milestone-row strong{
            font-size:9.8px !important;
          }

          /* Files + Activity should appear in the first laptop viewport whenever content allows. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-support-grid{
            margin-top:10px !important;
            gap:10px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-support-card{
            min-height:124px !important;
            padding:13px 14px !important;
            border:1px solid rgba(115,102,80,.14) !important;
            border-radius:14px !important;
            background:rgba(255,253,248,.82) !important;
            box-shadow:0 4px 14px rgba(42,53,32,.025) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-support-card > strong{
            margin-top:5px !important;
            font-size:16px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-support-card > p{
            margin:6px 0 9px !important;
            font-size:11.25px !important;
            line-height:1.45 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-support-card > button{
            padding-bottom:2px !important;
            color:#35513d !important;
            border-bottom-color:rgba(53,81,61,.23) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-file-preview{
            display:flex !important;
            flex-direction:column !important;
            gap:5px !important;
            margin:7px 0 10px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-file-preview-row{
            min-width:0 !important;
            display:flex !important;
            align-items:center !important;
            gap:7px !important;
            padding:6px 8px !important;
            border:1px solid #e6ddcf !important;
            border-radius:9px !important;
            background:#fbf7ef !important;
            color:#4e574b !important;
            font-size:10.5px !important;
            font-weight:750 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-file-preview-row > span:last-child{
            min-width:0 !important;
            overflow:hidden !important;
            text-overflow:ellipsis !important;
            white-space:nowrap !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-file-icon{
            flex:0 0 auto !important;
            width:23px !important;
            height:23px !important;
            display:inline-flex !important;
            align-items:center !important;
            justify-content:center !important;
            border-radius:7px !important;
            background:#eee7da !important;
            color:#7b6338 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-activity-card{
            min-height:108px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-activity-list{
            position:relative !important;
            gap:6px !important;
            margin-top:7px !important;
            padding-left:1px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-activity-list::before{
            content:"" !important;
            position:absolute !important;
            left:4px !important;
            top:8px !important;
            bottom:8px !important;
            width:1px !important;
            background:#ddd2c1 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-activity-row{
            position:relative !important;
            z-index:1 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-activity-dot{
            background:#9b7432 !important;
            box-shadow:0 0 0 3px #fffdf8 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-conversation-gateway{
            display:none !important;
          }

          /* Messages are a contained secondary rail. The old Inbox composer was absolute
             against .kbdr2-work; reset it here so it belongs only to this rail. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail{
            position:relative !important;
            grid-column:2 !important;
            grid-row:2 !important;
            min-width:0 !important;
            min-height:0 !important;
            height:100% !important;
            display:flex !important;
            flex-direction:column !important;
            overflow:hidden !important;
            border-left:1px solid #e3d8c6 !important;
            background:#f7f1e7 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail > .kbdr2-thread-command-header,
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail > .kbdr2-failed-banner,
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail > .kbdr2-stream,
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail > .kbdr2-composer{
            opacity:1;
            visibility:visible;
            transition:opacity 140ms ease 105ms,visibility 0s linear 0s;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail.is-collapsed > .kbdr2-thread-command-header,
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail.is-collapsed > .kbdr2-failed-banner,
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail.is-collapsed > .kbdr2-stream,
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail.is-collapsed > .kbdr2-composer{
            opacity:0 !important;
            visibility:hidden !important;
            pointer-events:none !important;
            transition:opacity 85ms ease 0s,visibility 0s linear 85ms !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-thread-command-header{
            display:flex !important;
            align-items:center !important;
            justify-content:space-between !important;
            gap:10px !important;
            flex:0 0 auto !important;
            padding:11px 11px 9px 13px !important;
            border-bottom:1px solid #e4dac8 !important;
            background:#fffdf8 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-thread-command-title{
            color:#1c2814 !important;
            font-size:16px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-message-collapse-btn{
            flex:0 0 auto !important;
            width:30px !important;
            height:30px !important;
            display:inline-flex !important;
            align-items:center !important;
            justify-content:center !important;
            padding:0 !important;
            border:1px solid #ded4c4 !important;
            border-radius:9px !important;
            background:#fffdf8 !important;
            color:#65705f !important;
            box-shadow:none !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-message-collapse-btn:hover{
            border-color:#c7b794 !important;
            background:#f3eee4 !important;
            color:#1F3A2E !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-message-dock{
            position:absolute !important;
            inset:0 !important;
            z-index:8 !important;
            display:flex !important;
            align-items:flex-start !important;
            justify-content:center !important;
            padding-top:11px !important;
            background:linear-gradient(180deg,#fffdf8 0%,#f3ecdf 100%) !important;
            opacity:0;
            visibility:hidden;
            pointer-events:none;
            transition:opacity 95ms ease 0s,visibility 0s linear 95ms;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail.is-collapsed .kbdr2-message-dock{
            opacity:1 !important;
            visibility:visible !important;
            pointer-events:auto !important;
            transition:opacity 130ms ease 105ms,visibility 0s linear 0s !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-message-dock-button{
            width:40px !important;
            min-height:102px !important;
            display:flex !important;
            flex-direction:column !important;
            align-items:center !important;
            justify-content:flex-start !important;
            gap:15px !important;
            padding:10px 0 !important;
            border:1px solid #d9cfbd !important;
            border-radius:14px !important;
            background:#fffdf8 !important;
            color:#1F3A2E !important;
            box-shadow:0 6px 16px rgba(42,53,32,.065) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-message-dock-button:hover{
            border-color:#c2b183 !important;
            background:#fbf5e9 !important;
            transform:translateY(-1px) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-message-dock-icon{
            position:relative !important;
            display:inline-flex !important;
            align-items:center !important;
            justify-content:center !important;
            width:26px !important;
            height:26px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-message-dock-badge{
            position:absolute !important;
            top:-7px !important;
            right:-8px !important;
            min-width:17px !important;
            height:17px !important;
            display:inline-flex !important;
            align-items:center !important;
            justify-content:center !important;
            padding:0 4px !important;
            border:2px solid #fffdf8 !important;
            border-radius:999px !important;
            background:#b08840 !important;
            color:#fff !important;
            font-family:'DM Sans',sans-serif !important;
            font-size:8px !important;
            line-height:1 !important;
            font-weight:900 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-message-dock-chevron{
            width:24px !important;
            height:24px !important;
            display:inline-flex !important;
            align-items:center !important;
            justify-content:center !important;
            border-radius:8px !important;
            background:#edf1e9 !important;
            color:#35503b !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-stream{
            flex:1 1 auto !important;
            min-height:0 !important;
            overflow-y:auto !important;
            overflow-x:hidden !important;
            padding:12px 10px 12px !important;
            background:linear-gradient(180deg,#f8f4ec 0%,#f3ecdf 100%) !important;
          }
          /* ═══════════════════ 0184 DEAL ROOM MESSAGES RAIL BASELINE POLISH ═══════════════════
             Canonical desktop Deal Room only. One authoritative composer owner:
             writing area on top, compact utility row below. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-composer{
            position:static !important;
            left:auto !important;
            right:auto !important;
            bottom:auto !important;
            z-index:2 !important;
            width:100% !important;
            max-width:100% !important;
            flex:0 0 auto !important;
            padding:10px 11px 12px !important;
            border-top:1px solid #e4d9c6 !important;
            background:#fffdf8 !important;
            box-shadow:none !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-composer-inner{
            min-height:88px !important;
            display:grid !important;
            grid-template-columns:minmax(0,1fr) 40px !important;
            grid-template-areas:"message message" "tools send" !important;
            align-items:end !important;
            column-gap:8px !important;
            row-gap:3px !important;
            padding:8px !important;
            border:1px solid #d8cdbb !important;
            border-radius:15px !important;
            background:#fff !important;
            box-shadow:0 3px 10px rgba(42,53,32,.045) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-composer-inner:focus-within{
            border-color:#b89655 !important;
            box-shadow:0 0 0 3px rgba(184,150,85,.10),0 4px 12px rgba(42,53,32,.05) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-composer textarea{
            grid-area:message !important;
            align-self:start !important;
            width:100% !important;
            color:#243122 !important;
            min-height:62px !important;
            max-height:160px !important;
            overflow-y:auto !important;
            padding:8px 8px 6px !important;
            border:0 !important;
            outline:0 !important;
            background:transparent !important;
            line-height:1.48 !important;
            font-size:13px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-composer textarea::placeholder{
            color:#8a857c !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-composer-tools{
            grid-area:tools !important;
            justify-self:start !important;
            align-self:end !important;
            display:flex !important;
            gap:3px !important;
            padding:0 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-composer-tool{
            width:30px !important;
            height:30px !important;
            border-radius:9px !important;
            color:#6e766c !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-composer-tool:hover:not(:disabled){
            background:#f3efe7 !important;
            color:#1F3A2E !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-composer-send{
            grid-area:send !important;
            justify-self:end !important;
            align-self:end !important;
            width:40px !important;
            min-width:40px !important;
            height:40px !important;
            padding:0 !important;
            margin:0 !important;
            border-radius:12px !important;
            background:#1F3A2E !important;
            color:#fff !important;
            box-shadow:0 5px 12px rgba(31,58,46,.15) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-composer-send:hover:not(:disabled){
            background:#284b3b !important;
            transform:translateY(-1px) !important;
          }

          /* Compact rail empty state: never a modal-sized black card. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-thread-empty{
            width:auto !important;
            max-width:280px !important;
            min-height:0 !important;
            margin:auto 14px !important;
            padding:17px 14px !important;
            border:0 !important;
            border-radius:14px !important;
            background:transparent !important;
            box-shadow:none !important;
            color:#4e584d !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-thread-empty-icon{
            width:38px !important;
            height:38px !important;
            margin:0 auto 9px !important;
            background:#eee5d6 !important;
            border:1px solid #ddcfb7 !important;
            color:#7b5c27 !important;
            box-shadow:none !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-thread-empty-title{
            color:#1c2814 !important;
            font-size:18px !important;
            line-height:1.12 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-thread-empty-sub{
            max-width:250px !important;
            margin:6px auto 10px !important;
            color:#746e63 !important;
            font-size:11.25px !important;
            line-height:1.45 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-thread-empty .kbdr2-secondary-btn{
            min-height:34px !important;
            padding:7px 11px !important;
            border:1px solid #d8ccb7 !important;
            background:#fffdf8 !important;
            color:#1F3A2E !important;
            box-shadow:none !important;
          }

          /* Canonical rail message geometry: compact, readable, chat-like. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-msg-row{
            gap:7px !important;
            margin-bottom:9px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-msg-row.grouped{
            margin-top:-2px !important;
            margin-bottom:4px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-bubble{
            max-width:82% !important;
            padding:10px 12px 8px !important;
            border-radius:16px !important;
            font-size:13px !important;
            line-height:1.48 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-bubble-time{
            margin-top:4px !important;
            font-size:9.5px !important;
            line-height:1.2 !important;
            opacity:.58 !important;
            font-weight:600 !important;
          }

          /* Canonical rail message palette must outrank generic dark-Inbox polish. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-bubble.them{
            background:#fffdf8 !important;
            border:1px solid #e3d8c6 !important;
            color:#263126 !important;
            box-shadow:0 4px 12px rgba(42,53,32,.035) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-bubble.me{
            background:#1F3A2E !important;
            border:1px solid #1F3A2E !important;
            color:#fff !important;
            box-shadow:0 6px 14px rgba(31,58,46,.12) !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-thread-loading-card{
            background:#fffdf8 !important;
            border:1px solid #e3d8c6 !important;
            box-shadow:none !important;
          }

          /* ═══════════════════ 0178 DEAL ROOM OVERFLOW + CONTAINMENT LOCK ═══════════════════
             Canonical Deal Room only. Preserve 0177 layout; fix three overflow/contrast bugs
             without touching ordinary Inbox behavior or the canonical lifecycle/routing. */

          /* Composer textarea: preserve overflow behavior without overriding 0183 geometry. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-composer textarea{
            color:#243122 !important;
            overflow-y:auto !important;
            font-size:12.5px !important;
          }

          /* Earlier-message control: quiet divider, not a floating pale pill. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-load-older-wrap{
            display:flex !important;
            align-items:center !important;
            gap:9px !important;
            margin:2px 2px 14px !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-load-older-wrap::before,
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-load-older-wrap::after{
            content:"" !important;
            flex:1 1 auto !important;
            height:1px !important;
            background:#ddd3c3 !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-load-older-btn{
            flex:0 0 auto !important;
            height:28px !important;
            padding:0 7px !important;
            border:0 !important;
            border-radius:8px !important;
            background:transparent !important;
            color:#536451 !important;
            box-shadow:none !important;
            font-size:10.5px !important;
            font-weight:850 !important;
            letter-spacing:.01em !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-load-older-btn:hover:not(:disabled){
            background:#eee8dd !important;
            color:#1F3A2E !important;
          }

          /* 0180 — canonical Deal Room contrast lock.
             Disabled controls stay visibly disabled without becoming unreadable. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-action-primary:disabled{
            opacity:1 !important;
            background:#49604f !important;
            border-color:#49604f !important;
            color:#fffdf8 !important;
            cursor:not-allowed !important;
            box-shadow:none !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-split .kbdr2-canonical-action-secondary:disabled{
            opacity:1 !important;
            background:#f2ecdf !important;
            border-color:#d6c9b5 !important;
            color:#536451 !important;
            cursor:not-allowed !important;
            box-shadow:none !important;
          }
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-canonical-message-rail .kbdr2-load-older-btn:disabled{
            opacity:1 !important;
            background:transparent !important;
            border-color:transparent !important;
            color:#7b8177 !important;
            cursor:not-allowed !important;
            box-shadow:none !important;
          }

          /* The rounded Deal Room wrapper intentionally clips its contents. Escape that clip
             only for the More menu by fixing it to the viewport. Position comes from CSS vars
             written from the real trigger rectangle at click time, so laptop/monitor stay aligned. */
          html body .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa.kbdr2-has-canonical-dealroom .kbdr2-header-menu{
            position:fixed !important;
            top:var(--kbdr2-canonical-menu-top,124px) !important;
            right:var(--kbdr2-canonical-menu-right,18px) !important;
            left:auto !important;
            z-index:10050 !important;
            max-height:min(520px,calc(100vh - var(--kbdr2-canonical-menu-top,124px) - 14px)) !important;
            overflow-y:auto !important;
            overflow-x:hidden !important;
          }
        }

        @media (max-width:860px){
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-topbar{
            height:48px !important;
            min-height:48px !important;
            padding:8px 10px 0 !important;
          }
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-content{
            display:block !important;
            padding:8px !important;
          }
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-title{max-width:calc(100vw - 180px) !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-message-mode .kbdr2-stream{padding:14px 12px 86px !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-bubble{max-width:88% !important;font-size:13px !important;}
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-composer-inner,
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-work-message-mode .kbdr2-composer-inner{
            grid-template-columns:minmax(0,1fr) 42px !important;
          }
          .kbdr2-root.kb-inbox-dark-shell.kb-inbox-render-polish.kb-inbox-final-qa .kbdr2-composer-tools{display:none !important;}
        }



      `}</style>

      {/* ═══════════════════ MAIN AREA ═══════════════════ */}
      <div className="kbdr2-main">

        {/* TOP BAR */}
        <div className="kbdr2-topbar">
          <div className="kbdr2-search">
            <span className="kbdr2-search-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={e=>handleInboxSearchChange(e.target.value)}
              placeholder="Search projects, bids, files, or messages..."
              aria-label="Search"
            />
          </div>
          <div className="kbdr2-topbar-spacer"/>
          <button type="button" className="kbdr2-topbar-icon" aria-label="Notifications" onClick={()=>nav('activity')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {convos.some(c=>(c.unread||0)>0) && <span className="kbdr2-topbar-icon-dot"/>}
          </button>
          <button type="button" className="kbdr2-topbar-icon" aria-label="Help" onClick={()=>nav('about')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
          <button type="button" className="kbdr2-user-chip" onClick={()=>nav('profile')}>
            <span className="kbdr2-user-avatar">{getInitialsSafe(currentUser?.user_metadata?.name || currentUser?.email || 'User', 'U').slice(0,2)}</span>
            <span className="kbdr2-user-meta">
              <span className="kbdr2-user-name">{currentUser?.user_metadata?.name || currentUser?.user_metadata?.org_name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Your Account')}</span>
              <span className="kbdr2-user-role">{role==='church' ? 'Church Admin' : role==='vendor' ? 'Vendor' : 'Member'}</span>
            </span>
            <span className="kbdr2-user-caret"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
          </button>
        </div>

        {/* CONTENT */}
        <div className={`kbdr2-content${showInboxRail && active ? ' has-rail' : ''}${activeId ? ' kbdr2-thread-open' : ' kbdr2-list-open'}${isCanonicalDealRoom ? ' kbdr2-canonical-open' : ''}${dealRoomsHubOpen ? ' kbdr2-hub-open' : ''}`}>

          {dealRoomsHubOpen ? (
            <MemoDealRoomsHub role={role} activeTab={dealRoomsHubTab} onTabChange={setDealRoomsHubTab}
              activeRooms={activeDealRoomHubItems} completedRooms={completedDealRoomHubItems}
              conversations={preHireHubConversations} loadingRooms={loadingDealRoomHubProjects}
              roomsError={dealRoomHubError} onOpenRoom={openHubRoom} onOpenConversation={openHubConversation}
              hasMoreConvos={hasMoreConvos} loadingMoreConvos={loadingMoreConvos}
              onLoadMoreConvos={loadMoreConvos} nav={nav}/>
          ) : (<>
          {/* ═══════════════════ MY DEALS ═══════════════════ */}
          <MemoMessagesThreadList
            convos={convos}
            activeId={activeId}
            loadingConvos={loadingConvos}
            search={search}
            searchResults={searchResults}
            listFilter={listFilter}
            vendorInviteTotalCount={vendorInviteTotalCount}
            role={role}
            currentUser={currentUser}
            orderedFiltered={orderedFiltered}
            isMobileInbox={isMobileInbox}
            showThreadListPane={isCanonicalDealRoom ? false : showThreadListPane}
            starredSet={starredSet}
            mutedSet={mutedSet}
            resolvedMap={resolvedMap}
            pinnedRecordMap={pinnedRecordMap}
            lastViewedMap={lastViewedMap}
            rowActionBusyId={rowActionBusyId}
            loadingMoreConvos={loadingMoreConvos}
            hasMoreConvos={hasMoreConvos}
            onSelectConvo={handleSelect}
            onSetListFilter={setListFilter}
            onDeleteConvo={deleteConvo}
            onRestoreConvo={restoreConvo}
            onLoadMoreConvos={loadMoreConvos}
            onSetRowActionBusyId={setRowActionBusyId}
            nav={nav}
            vendorInviteRows={vendorInviteRows}
            loadingVendorInvites={loadingVendorInvites}
            vendorInvitesError={vendorInvitesError}
            vendorInvitesTruncated={vendorInvitesTruncated}
            openVendorInviteProject={openVendorInviteProject}
            mobileQuickViewItems={mobileQuickViewItems}
            threadPriorityById={threadPriorityById}
            getThreadPriorityMeta={getThreadPriorityMeta}
            isSnoozedThread={isSnoozedThread}
            onClearSearch={() => handleInboxSearchChange('')}
            onRequestArchiveConfirm={setArchiveConfirm}
          />

          {/* ═══════════════════ DEAL WORKSPACE ═══════════════════ */}
          <MemoMessagesThreadView
            active={active}
            activeId={activeId}
            convos={convos}
            messages={messages}
            pendingMessages={pendingMessages}
            loadingMsgs={loadingMsgs}
            loadingOlderMessages={loadingOlderMessages}
            hasMoreMessages={hasMoreMessages}
            dealMeta={dealMeta}
            activeDealState={activeDealState}
            activeSummary={activeSummary}
            activeActionSet={activeActionSet}
            primaryDealAction={primaryDealAction}
            isCanonicalDealRoom={isCanonicalDealRoom}
            canonicalDealRoomStatus={canonicalDealRoomStatus}
            canonicalDealRoomNext={canonicalDealRoomNext}
            canonicalDealRoomControls={canonicalDealRoomControls}
            canonicalAcceptedBid={canonicalAcceptedBid}
            dealPanelTab={dealPanelTab}
            headerMenuOpen={headerMenuOpen}
            headerMenuMode={headerMenuMode}
            composerAssistOpen={composerAssistOpen}
            peerTyping={peerTyping}
            newMessageNotice={newMessageNotice}
            callDetailsBusy={callDetailsBusy}
            uploading={uploading}
            sending={sending}
            search={search}
            role={role}
            currentUser={currentUser}
            isMobileInbox={isMobileInbox}
            showCenterPane={showCenterPane}
            composerRef={composerRef}
            streamRef={streamRef}
            fileInputRef={fileInputRef}
            headerMenuRef={headerMenuRef}
            moneyLabel={moneyLabel}
            mutedSet={mutedSet}
            getSnoozedUntil={getSnoozedUntil}
            dealOverviewCards={dealOverviewCards}
            executionActionCards={executionActionCards}
            workspaceSummary={workspaceSummary}
            mobileThreadGlancePills={mobileThreadGlancePills}
            failedPending={failedPending}
            composerSendLabel={composerSendLabel}
            draft={draft}
            isConversationNearBottom={isConversationNearBottom}
            onLoadOlderMessages={loadOlderMessages}
            onSetHeaderMenuOpen={setHeaderMenuOpen}
            onSetHeaderMenuMode={setHeaderMenuMode}
            onSetDealPanelTab={setDealPanelTab}
            onSetNewMessageNotice={setNewMessageNotice}
            onSetArchiveConfirm={setArchiveConfirm}
            onSetComposerAssistOpen={setComposerAssistOpen}
            onSetActiveId={setActiveId}
            onSetToast={setToast}
            onSetThreadSnooze={setThreadSnooze}
            onClearThreadSnooze={clearThreadSnooze}
            onToggleMuteThread={toggleMuteThread}
            onRestoreConvo={restoreConvo}
            onCreateSyncedThreadFromActive={createSyncedThreadFromActive}
            onRetryFailedItems={retryFailedItems}
            onDismissFailedItems={dismissFailedItems}
            onOpenChatAttachment={openChatAttachment}
            onOpenDealWorkspace={openDealWorkspace}
            onScrollToLatest={scrollConversationToLatest}
            onPopulateDealPrompt={populateDealPrompt}
            onAttachClick={handleAttachClick}
            onDraftChange={handleComposerDraftChange}
            onSendDraft={sendCurrentDraft}
            onFileInputChange={handleFileInputChange}
            onShareCallDetails={handleShareCallDetails}
            onComposerKeyDown={handleComposerKeyDown}
            onBroadcastTyping={broadcastTyping}
            onApproveCurrentMilestone={approveCurrentMilestone}
            onCanonicalLifecycleAction={runCanonicalDealRoomLifecycle}
            onExitDealRoom={closeActiveThreadToList}
            dealRoomSwitcherItems={dealRoomSwitcherItems}
            onSwitchDealRoom={switchExactDealRoom}
            nav={nav}
          />

          {showInboxRail && active && (
            <aside className="kbdr2-rail" aria-label="Deal context">
              {(() => {
                const railProjectTitle = active.projectTitle || dealMeta?.project?.title || active.name || 'Deal';
                const railCounterparty = active.name || (active.type === 'vendor' ? 'Vendor' : 'Church');
                const railBudget = dealMeta?.budgetValue ? moneyLabel(dealMeta.budgetValue) : (dealMeta?.project?.budget || '—');
                const railTimeline = dealMeta?.project?.timeline || dealMeta?.linkedBid?.timeline || '—';
                const railStageLabel = stageLabel(activeDealState);
                const railProposalAmount = dealMeta?.bidValue ? moneyLabel(dealMeta.bidValue) : null;
                const railProposalTimeline = dealMeta?.linkedBid?.timeline || null;
                const railProposalStatus = dealMeta?.linkedBid?.status ? String(dealMeta.linkedBid.status).replace(/_/g, ' ') : null;
                const railNextText = workspaceSummary || activeSummary?.body || 'Use the inbox command center to move the next decision forward.';
                const railNextEyebrow = activeSummary?.eyebrow || nextLabel || 'Next up';
                return (
                  <>
                    <div className="kbdr2-rail-section">
                      <span className="kbdr2-rail-section-label">Project</span>
                      <h3 className="kbdr2-rail-title">{railProjectTitle}</h3>
                      <div className="kbdr2-rail-counterparty">{railCounterparty}{dealMeta?.project?.city ? ` · ${dealMeta.project.city}` : ''}</div>
                      <div className="kbdr2-rail-stage"><span className="kbdr2-rail-stage-dot" style={{background:(active.archived || activeDealState === 'completed' || activeDealState === 'resolved') ? '#8a9585' : activeDealState === 'disputed' ? '#c95454' : activeDealState === 'milestone_pending' ? '#e3a857' : (activeDealState === 'active' || activeDealState === 'hired') ? '#4ade80' : '#4a6b4a'}}/>{railStageLabel}</div>
                      <div className="kbdr2-rail-kv">
                        <div>
                          <span className="kbdr2-rail-kv-label">Budget</span>
                          <span className="kbdr2-rail-kv-value">{railBudget}</span>
                        </div>
                        <div>
                          <span className="kbdr2-rail-kv-label">Timeline</span>
                          <span className="kbdr2-rail-kv-value">{railTimeline}</span>
                        </div>
                      </div>
                    </div>

                    {(railProposalAmount || railProposalTimeline || railProposalStatus) && (
                      <div className="kbdr2-rail-section">
                        <span className="kbdr2-rail-section-label">Proposal</span>
                        <div className="kbdr2-rail-kv">
                          {railProposalAmount && (
                            <div>
                              <span className="kbdr2-rail-kv-label">Amount</span>
                              <span className="kbdr2-rail-kv-value">{railProposalAmount}</span>
                            </div>
                          )}
                          {railProposalTimeline && (
                            <div>
                              <span className="kbdr2-rail-kv-label">Timeline</span>
                              <span className="kbdr2-rail-kv-value">{railProposalTimeline}</span>
                            </div>
                          )}
                          {railProposalStatus && (
                            <div style={{gridColumn:'1 / -1'}}>
                              <span className="kbdr2-rail-kv-label">Status</span>
                              <span className="kbdr2-rail-kv-value" style={{textTransform:'capitalize'}}>{railProposalStatus}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!active.archived && (
                      <div className="kbdr2-rail-section">
                        <span className="kbdr2-rail-section-label">Next action</span>
                        <div className="kbdr2-rail-next">
                          <span className="kbdr2-rail-next-eyebrow">{railNextEyebrow}</span>
                          <span className="kbdr2-rail-next-text">{railNextText}</span>
                          {primaryDealAction?.label && primaryDealAction?.onClick && (
                            <button type="button" className="kbdr2-rail-next-cta" onClick={primaryDealAction.onClick}>
                              {primaryDealAction.label}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="kbdr2-rail-section">
                      <span className="kbdr2-rail-section-label">Quick actions</span>
                      <div className="kbdr2-rail-actions">
                        {active.projectId && (
                          <button type="button" className="kbdr2-rail-action" onClick={openDealWorkspace} title="Open project workspace">View project</button>
                        )}
                        {dealMeta?.linkedBid && (
                          <button type="button" className="kbdr2-rail-action" onClick={()=>setDealPanelTab('proposal')} title="View proposal details">View proposal</button>
                        )}
                        <button type="button" className="kbdr2-rail-action" onClick={openLatestFile} title="Open latest shared file">Files</button>
                        <button type="button" className="kbdr2-rail-action" onClick={openActivityForThread} title="Open project activity">Activity</button>
                        <button type="button" className="kbdr2-rail-action full" onClick={openCounterpartyProfile} title={active.type === 'vendor' ? 'Open vendor profile' : 'Open project board'}>{active.type === 'vendor' ? 'Vendor profile' : 'Project board'}</button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </aside>
          )}
          </>)}
        </div>
      </div>
    </div>
    {archiveConfirm && (
      <ConfirmModal
        title="Remove from inbox?"
        body={`"${archiveConfirm.label}" will move to Archived. You can restore it any time from the Archived tab.`}
        confirmLabel="Remove"
        danger={true}
        onConfirm={async () => {
          const id = archiveConfirm.convoId;
          setArchiveConfirm(null);
          await deleteConvo(id);
          setToast('Conversation removed from inbox');
        }}
        onCancel={() => setArchiveConfirm(null)}
      />
    )}
    </>
  );
}

export default function MessagesScreenRoute({ dependencies, ...props }) {
  applyMessagesScreenDependencies(dependencies);
  return <MessagesScreen {...props} />;
}
