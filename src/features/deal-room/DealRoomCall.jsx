import React, { useState } from 'react';
import {
  getDealRoomCallProvider,
  normalizeDealRoomCallUrl,
  formatDealRoomCallTime,
  toLocalDateTimeInput,
} from './DealRoomCallUtils';

const DEAL_ROOM_CALL_CSS = `
.kbdr2-thread-command-main{min-width:0}
.kbdr2-thread-command-context{display:block;margin-top:2px;color:#8a857c;font-size:9.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kbdr2-call-event-row{width:100%;margin:7px 0 14px}
.kbdr2-call-card{display:grid;grid-template-columns:42px minmax(0,1fr);gap:11px;width:100%;padding:14px;border:1px solid #d9cfbe;border-radius:16px;background:#fffdf8;color:#263126;box-shadow:0 7px 18px rgba(42,53,32,.055)}
.kbdr2-call-card.is-muted{background:#f1ede5;color:#6e716a;box-shadow:none}
.kbdr2-call-card-icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:13px;background:#e6f2e9;color:#276143}
.kbdr2-call-card.is-muted .kbdr2-call-card-icon{background:#e5e0d8;color:#7e7a71}
.kbdr2-call-card-copy{min-width:0}
.kbdr2-call-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.kbdr2-call-card-top strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:1.25}
.kbdr2-call-card-top span{flex:0 0 auto;padding:3px 7px;border-radius:999px;background:#def5e8;color:#23714b;font-family:var(--font-sans),monospace;font-size:7.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
.kbdr2-call-card.is-muted .kbdr2-call-card-top span{background:#e1ddd6;color:#6d6a64}
.kbdr2-call-card-time{margin-top:5px;color:#35543e;font-size:11.25px;font-weight:800;line-height:1.42}
.kbdr2-call-card-copy p{margin:7px 0 0;color:#676c63;font-size:11px;line-height:1.45}
.kbdr2-call-card-provider{margin-top:8px;color:#7d7b74;font-size:9.5px;line-height:1.4;overflow-wrap:anywhere}
.kbdr2-call-card-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:10px}
.kbdr2-call-card-actions a,.kbdr2-call-card-actions button{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:31px!important;padding:0 9px!important;border:1px solid #d7ccba!important;border-radius:9px!important;background:#fff!important;color:#36533f!important;font-size:9.5px!important;font-weight:800!important;text-decoration:none!important}
.kbdr2-call-card-actions a{border-color:#274a38!important;background:#274a38!important;color:#fff!important}
.kbdr2-call-card-actions button.danger{color:#9d4f45!important}
.kbdr2-call-card-actions a:hover,.kbdr2-call-card-actions button:hover:not(:disabled){transform:translateY(-1px)}
.kbdr2-call-card-actions button:disabled{opacity:.55;cursor:wait}
.kbdr2-call-card-audit{display:block;margin-top:8px;color:#969188;font-size:8.75px;line-height:1.4}
.kbdr2-call-dialog-backdrop{position:fixed;inset:0;z-index:10050;display:grid;place-items:center;padding:18px;background:rgba(11,16,13,.46);backdrop-filter:blur(4px)}
.kbdr2-call-dialog{width:min(540px,calc(100vw - 28px));max-height:calc(100vh - 36px);overflow:auto;padding:20px;border:1px solid rgba(155,116,50,.22);border-radius:20px;background:#fffdf8;color:#1c2814;box-shadow:0 28px 80px rgba(14,22,17,.28)}
.kbdr2-call-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}
.kbdr2-call-dialog-head span{display:block;margin-bottom:4px;color:#9b7432;font-family:var(--font-sans),monospace;font-size:8px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.kbdr2-call-dialog-head h2{margin:0;font-family:var(--font-display),serif;font-size:25px;line-height:1.05;letter-spacing:-.03em}
.kbdr2-call-dialog-head button{width:32px;height:32px;border:1px solid #e0d7c8!important;border-radius:9px!important;background:#f7f2e9!important;color:#697066!important;font-size:22px!important;line-height:1!important}
.kbdr2-call-field{display:grid;gap:6px;margin-top:12px}
.kbdr2-call-field>span{color:#4b5449;font-size:10px;font-weight:800}
.kbdr2-call-field>span small{color:#9a958d;font-size:9px;font-weight:600}
.kbdr2-call-field input,.kbdr2-call-field textarea{width:100%;border:1px solid #dcd3c5!important;border-radius:11px!important;background:#fff!important;color:#243122!important;font-size:12px!important}
.kbdr2-call-field input{height:42px;padding:0 12px!important}
.kbdr2-call-field textarea{min-height:78px;padding:11px 12px!important;resize:vertical}
.kbdr2-call-field input:focus,.kbdr2-call-field textarea:focus{border-color:#b89655!important;box-shadow:0 0 0 3px rgba(184,150,85,.10)!important}
.kbdr2-call-field-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.kbdr2-call-dialog-error{margin-top:11px;padding:9px 10px;border:1px solid #efc9c4;border-radius:10px;background:#fff1ef;color:#98463c;font-size:10.5px;line-height:1.45}
.kbdr2-call-dialog-guardrail{margin-top:13px;padding:10px 11px;border:1px solid #dce6d8;border-radius:10px;background:#f0f6ed;color:#526050;font-size:10px;line-height:1.5}
.kbdr2-call-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.kbdr2-call-dialog-actions button{min-height:38px!important;padding:0 13px!important;border:1px solid #d8cebe!important;border-radius:10px!important;background:#fff!important;color:#5d645b!important;font-size:10.5px!important;font-weight:800!important}
.kbdr2-call-dialog-actions button.primary{border-color:#1f3a2e!important;background:#1f3a2e!important;color:#fff!important}
.kbdr2-call-dialog-actions button:disabled{opacity:.58;cursor:wait}
@media(max-width:620px){.kbdr2-call-field-grid{grid-template-columns:1fr}.kbdr2-call-dialog{padding:17px}.kbdr2-call-card{grid-template-columns:36px minmax(0,1fr);padding:12px}.kbdr2-call-card-icon{width:36px;height:36px;border-radius:11px}.kbdr2-call-card-top{flex-direction:column;gap:5px}.kbdr2-call-card-actions{align-items:stretch}.kbdr2-call-card-actions a,.kbdr2-call-card-actions button{flex:1 1 auto!important}}
`;

export function DealRoomCallComposerTool({
  disabled = false,
  busy = false,
  seed = null,
  onClearSeed = () => {},
  onSubmit = async () => false,
}) {
  const seedKey = seed?.id || 'new';
  return <DealRoomCallComposerToolInner key={seedKey} disabled={disabled} busy={busy} seed={seed} onClearSeed={onClearSeed} onSubmit={onSubmit}/>;
}

function DealRoomCallComposerToolInner({ disabled, busy, seed, onClearSeed, onSubmit }) {
  const [open, setOpen] = useState(()=>Boolean(seed));
  const [url, setUrl] = useState(()=>seed?.url || '');
  const [label, setLabel] = useState(()=>seed?.label || '');
  const [scheduledFor, setScheduledFor] = useState(()=>toLocalDateTimeInput(seed?.scheduledFor));
  const [note, setNote] = useState(()=>seed?.note || '');
  const [error, setError] = useState('');

  const close = () => {
    if (busy) return;
    setOpen(false);
    setError('');
    onClearSeed();
  };

  const submit = async (event) => {
    event.preventDefault();
    const safeUrl = normalizeDealRoomCallUrl(url);
    if (!safeUrl) {
      setError('Enter a complete HTTPS call link, such as a Google Meet, Zoom, Teams, or Calendly URL.');
      return;
    }
    const scheduledIso = scheduledFor ? new Date(scheduledFor).toISOString() : null;
    if (scheduledFor && !Number.isFinite(new Date(scheduledFor).getTime())) {
      setError('Choose a valid call date and time.');
      return;
    }
    setError('');
    const ok = await onSubmit({
      url:safeUrl,
      label:String(label || '').trim().slice(0,120),
      note:String(note || '').trim().slice(0,500),
      scheduledFor:scheduledIso,
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      status:seed?.id ? 'updated' : 'shared',
      supersedesMessageId:seed?.id || null,
    });
    if (ok) {
      setOpen(false);
      setUrl('');
      setLabel('');
      setScheduledFor('');
      setNote('');
      onClearSeed();
    }
  };

  return (
    <>
      <style>{DEAL_ROOM_CALL_CSS}</style>
      <button
        type="button"
        className="kbdr2-composer-tool kbdr2-call-tool"
        aria-label="Share call details"
        title="Share call details"
        disabled={disabled || busy}
        onClick={()=>{ setError(''); setOpen(true); }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"/>
        </svg>
      </button>

      {open && (
        <div className="kbdr2-call-dialog-backdrop" role="presentation" onMouseDown={(event)=>{ if(event.target === event.currentTarget) close(); }} onKeyDown={(event)=>{ if(event.key === 'Escape') close(); }}>
          <form className="kbdr2-call-dialog" role="dialog" aria-modal="true" aria-labelledby="kbdr2-call-dialog-title" onSubmit={submit}>
            <div className="kbdr2-call-dialog-head">
              <div>
                <span>Deal Room call</span>
                <h2 id="kbdr2-call-dialog-title">{seed?.id ? 'Update call details' : 'Share call details'}</h2>
              </div>
              <button type="button" onClick={close} aria-label="Close call details" disabled={busy}>×</button>
            </div>
            <label className="kbdr2-call-field">
              <span>HTTPS call link</span>
              <input type="url" inputMode="url" required autoFocus value={url} onChange={event=>setUrl(event.target.value)} placeholder="https://meet.google.com/…" maxLength={2048}/>
            </label>
            <div className="kbdr2-call-field-grid">
              <label className="kbdr2-call-field">
                <span>Label <small>optional</small></span>
                <input value={label} onChange={event=>setLabel(event.target.value)} placeholder="Project kickoff" maxLength={120}/>
              </label>
              <label className="kbdr2-call-field">
                <span>Date and time <small>optional</small></span>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onInput={event=>setScheduledFor(event.currentTarget.value)}
                  onChange={event=>setScheduledFor(event.currentTarget.value)}
                />
              </label>
            </div>
            <label className="kbdr2-call-field">
              <span>Context <small>optional</small></span>
              <textarea value={note} onChange={event=>setNote(event.target.value)} placeholder="What should both sides prepare?" maxLength={500}/>
            </label>
            {error && <div className="kbdr2-call-dialog-error" role="alert">{error}</div>}
            <div className="kbdr2-call-dialog-guardrail">The call happens externally. Keep scope changes, approvals, files, and milestones recorded in this Deal Room.</div>
            <div className="kbdr2-call-dialog-actions">
              <button type="button" onClick={close} disabled={busy}>Cancel</button>
              <button type="submit" className="primary" disabled={busy}>{busy ? 'Sharing…' : seed?.id ? 'Share update' : 'Share call details'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function DealRoomCallMessageCard({
  message,
  superseded = false,
  canManage = false,
  busy = false,
  onUpdate = () => {},
  onCancel = async () => {},
}) {
  const call = message?.callData || {};
  const cancelled = call.status === 'cancelled';
  const schedule = formatDealRoomCallTime(call.scheduledFor);
  const statusLabel = cancelled ? 'Cancelled' : superseded ? 'Updated' : call.status === 'updated' ? 'Updated' : 'Scheduled';
  const provider = getDealRoomCallProvider(call.url);
  return (
    <div className={`kbdr2-call-card${cancelled || superseded ? ' is-muted' : ''}`}>
      <div className="kbdr2-call-card-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"/></svg>
      </div>
      <div className="kbdr2-call-card-copy">
        <div className="kbdr2-call-card-top"><strong>{call.label || 'Project call'}</strong><span>{statusLabel}</span></div>
        {schedule && <div className="kbdr2-call-card-time">{schedule} · shown in your local time</div>}
        {call.note && <p>{call.note}</p>}
        <div className="kbdr2-call-card-provider">{provider.label}{provider.hostname && provider.label !== provider.hostname ? ` · ${provider.hostname}` : ''} · external link</div>
        <div className="kbdr2-call-card-actions">
          {!cancelled && !superseded && <a href={call.url} target="_blank" rel="noopener noreferrer">Open call link ↗</a>}
          {canManage && !cancelled && !superseded && <button type="button" onClick={()=>onUpdate({ id:message.id, ...call })} disabled={busy}>Update</button>}
          {canManage && !cancelled && !superseded && <button type="button" className="danger" onClick={()=>onCancel(message)} disabled={busy}>Cancel call</button>}
        </div>
        <small className="kbdr2-call-card-audit">Shared {message?.time || ''}. Record decisions and milestones in the Deal Room.</small>
      </div>
    </div>
  );
}
