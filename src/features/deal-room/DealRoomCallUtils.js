export function normalizeDealRoomCallUrl(value = '') {
  const raw = String(value || '').trim();
  if (!raw || raw.length > 2048) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function getDealRoomCallProvider(value = '') {
  const safeUrl = normalizeDealRoomCallUrl(value);
  if (!safeUrl) return { label:'External call', hostname:'' };
  const hostname = new URL(safeUrl).hostname.toLowerCase().replace(/^www\./, '');
  const known = [
    [/meet\.google\.com$/, 'Google Meet'],
    [/(^|\.)zoom\.us$/, 'Zoom'],
    [/(^|\.)teams\.microsoft\.com$/, 'Microsoft Teams'],
    [/(^|\.)calendly\.com$/, 'Calendly'],
    [/(^|\.)whereby\.com$/, 'Whereby'],
  ].find(([pattern]) => pattern.test(hostname));
  return { label:known?.[1] || hostname, hostname };
}

export function formatDealRoomCallTime(value, options = {}) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString([], {
    weekday:options.compact ? undefined : 'short',
    month:'short',
    day:'numeric',
    hour:'numeric',
    minute:'2-digit',
  });
}

export function buildDealRoomCallPreview(callData = {}) {
  if (callData.status === 'cancelled') return '☎ Call cancelled';
  const time = formatDealRoomCallTime(callData.scheduledFor, { compact:true });
  return time ? `☎ Call scheduled · ${time}` : '☎ Call details shared';
}

export function hydrateDealRoomCallEvent(row = {}, currentUserId = null) {
  if (String(row?.message_type || '').trim().toLowerCase() !== 'call_details') return null;
  const eventData = row?.event_data && typeof row.event_data === 'object' ? row.event_data : {};
  const safeUrl = normalizeDealRoomCallUrl(eventData?.url);
  if (!safeUrl) return null;
  const rawStatus = String(eventData?.status || '').toLowerCase();
  const status = ['shared','updated','cancelled'].includes(rawStatus) ? rawStatus : 'shared';
  const provider = getDealRoomCallProvider(safeUrl);
  const scheduledFor = row?.scheduled_for || null;
  return {
    id:row?.id || null,
    from:String(row?.sender_id || '') === String(currentUserId || '') ? 'me' : 'them',
    type:'call_details',
    text:row?.text || buildDealRoomCallPreview({ status, scheduledFor }),
    time:row?.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour:'numeric', minute:'2-digit' }) : '',
    createdAt:row?.created_at || null,
    callData:{
      status,
      url:safeUrl,
      label:String(eventData?.label || '').trim().slice(0,120),
      note:String(eventData?.note || '').trim().slice(0,500),
      timezone:String(eventData?.timezone || '').trim().slice(0,100),
      scheduledFor,
      supersedesMessageId:row?.supersedes_message_id || null,
      providerLabel:provider.label,
      providerHostname:provider.hostname,
    },
  };
}

export function toLocalDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0,16);
}
