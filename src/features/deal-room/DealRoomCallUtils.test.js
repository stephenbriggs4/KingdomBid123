import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDealRoomCallPreview,
  getDealRoomCallProvider,
  hydrateDealRoomCallEvent,
  normalizeDealRoomCallUrl,
} from './DealRoomCallUtils.js';

test('accepts only credential-free HTTPS call URLs', () => {
  assert.equal(normalizeDealRoomCallUrl('javascript:alert(1)'), null);
  assert.equal(normalizeDealRoomCallUrl('http://meet.google.com/abc'), null);
  assert.equal(normalizeDealRoomCallUrl('https://user:pass@example.com/call'), null);
  assert.equal(normalizeDealRoomCallUrl('https://meet.google.com/abc-defg-hij'), 'https://meet.google.com/abc-defg-hij');
});

test('labels known providers without fetching external metadata', () => {
  assert.equal(getDealRoomCallProvider('https://meet.google.com/abc-defg-hij').label, 'Google Meet');
  assert.equal(getDealRoomCallProvider('https://faith.example.org/call/123').label, 'faith.example.org');
});

test('hydrates an immutable structured call event', () => {
  const event = hydrateDealRoomCallEvent({
    id:'event-2',
    sender_id:'user-1',
    message_type:'call_details',
    text:'☎ Call scheduled',
    event_data:{ status:'updated', url:'https://zoom.us/j/123', label:'Kickoff', note:'Bring scope notes', timezone:'America/Chicago' },
    scheduled_for:'2026-08-25T15:00:00Z',
    supersedes_message_id:'event-1',
    created_at:'2026-08-24T18:00:00Z',
  }, 'user-1');
  assert.equal(event.type, 'call_details');
  assert.equal(event.from, 'me');
  assert.equal(event.callData.status, 'updated');
  assert.equal(event.callData.providerLabel, 'Zoom');
  assert.equal(event.callData.supersedesMessageId, 'event-1');
});

test('builds useful inbox previews for shared and cancelled calls', () => {
  assert.match(buildDealRoomCallPreview({ status:'shared', scheduledFor:'2026-08-25T15:00:00Z' }), /^☎ Call scheduled/);
  assert.equal(buildDealRoomCallPreview({ status:'cancelled' }), '☎ Call cancelled');
});
