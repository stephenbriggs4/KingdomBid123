import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

function loadRegistry(fakeSupabase, existingContext = null) {
  const start = app.indexOf("const __kbNotifChannelStateKey = Symbol.for('faithbid.notification-channel-state');");
  const end = app.indexOf('export default function App()', start);
  assert.ok(start >= 0 && end > start, 'notification registry source must be extractable');
  const context = existingContext || vm.createContext({
    supabase: fakeSupabase,
    logError: () => {},
    Promise,
    Set,
    Map,
  });
  vm.runInContext(`(() => {\n${app.slice(start, end)}\nglobalThis.subscribe = subscribeToNotificationsChannel;\n})();`, context);
  return { subscribe: context.subscribe, context };
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

  const { subscribe } = loadRegistry(fakeSupabase);
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

test('notification registry reuses its subscribed channel after a simulated Vite hot reload', () => {
  const channels = [];
  const fakeSupabase = {
    channel(name) {
      const channel = {
        name,
        subscribed: false,
        on() {
          assert.equal(this.subscribed, false, 'must never add callbacks after subscribe');
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
    async removeChannel() { return 'ok'; },
  };

  const firstModule = loadRegistry(fakeSupabase);
  firstModule.subscribe('user-1', () => {});
  const reloadedModule = loadRegistry(fakeSupabase, firstModule.context);
  reloadedModule.subscribe('user-1', () => {});

  assert.equal(channels.length, 1, 'hot reload reuses the subscribed physical channel');
});
