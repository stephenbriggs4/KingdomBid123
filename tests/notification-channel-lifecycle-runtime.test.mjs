import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

function loadRegistry(fakeSupabase) {
  const start = app.indexOf('const __kbNotifChannelRegistry = new Map();');
  const end = app.indexOf('export default function App()', start);
  assert.ok(start >= 0 && end > start, 'notification registry source must be extractable');
  const context = vm.createContext({
    supabase: fakeSupabase,
    logError: () => {},
    Promise,
    Set,
    Map,
  });
  vm.runInContext(`${app.slice(start, end)}\nglobalThis.subscribe = subscribeToNotificationsChannel;`, context);
  return context.subscribe;
}

test('notification registry survives Strict Mode release/remount with unique physical channels', async () => {
  const channels = [];
  const removed = [];
  const fakeSupabase = {
    channel(name) {
      const channel = {
        name,
        subscribed: false,
        changeHandler: null,
        on(_kind, _filter, handler) {
          assert.equal(this.subscribed, false, 'must never add callbacks after subscribe');
          this.changeHandler = handler;
          return this;
        },
        subscribe() {
          this.subscribed = true;
          return this;
        },
      };
      channels.push(channel);
      return channel;
    },
    async removeChannel(channel) {
      removed.push(channel.name);
      channel.subscribed = false;
      return 'ok';
    },
  };

  const subscribe = loadRegistry(fakeSupabase);
  let deliveries = 0;
  const releaseA = subscribe('user-1', () => { deliveries += 1; });
  const releaseB = subscribe('user-1', () => { deliveries += 10; });
  assert.equal(channels.length, 1, 'concurrent listeners share one physical channel');
  channels[0].changeHandler({ eventType: 'INSERT' });
  assert.equal(deliveries, 11);

  releaseA();
  assert.equal(removed.length, 0, 'first release keeps shared channel alive');
  releaseB();
  releaseB();

  const releaseC = subscribe('user-1', () => { deliveries += 100; });
  assert.equal(channels.length, 2, 'rapid remount creates a fresh physical channel');
  assert.notEqual(channels[0].name, channels[1].name, 'physical channel identity is generation-scoped');
  releaseC();
  await Promise.resolve();
  assert.deepEqual(removed, [channels[0].name, channels[1].name]);
});
