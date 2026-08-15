'use strict';

const assert = require('assert');
const {
  DEFAULT_OVERRIDES_KEY,
  DEFAULT_OVERRIDES_TS_KEY,
  normalizeOverrides,
  hasMeaningfulOverrides,
  createTripSummaryOverridesStore
} = require('./trip-summary-overrides-store');

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    data,
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v) { data[k] = String(v); },
    removeItem(k) { delete data[k]; }
  };
}

async function run() {
  assert.deepStrictEqual(normalizeOverrides(null), { version: 1, places: {}, hidden: {} });
  assert.strictEqual(hasMeaningfulOverrides({ version: 1, places: {}, hidden: {} }), false);
  assert.strictEqual(hasMeaningfulOverrides({ version: 1, places: { 'Pizza & Pasta Factory': { visits: [{ day: 3 }] } }, hidden: {} }), true);

  const storage = memoryStorage();
  const store = createTripSummaryOverridesStore({ storage, clock: () => 1000 });
  const state = { version: 1, places: { 'Pizza & Pasta Factory': { visits: [{ day: 3 }, { day: 7 }] } }, hidden: {} };
  const saved = store.saveLocal(state);
  assert.strictEqual(saved.ts, 1000);
  assert.strictEqual(storage.getItem(DEFAULT_OVERRIDES_TS_KEY), '1000');
  assert.deepStrictEqual(JSON.parse(storage.getItem(DEFAULT_OVERRIDES_KEY)), state);

  const local = store.loadLocal();
  assert.strictEqual(local.exists, true);
  assert.deepStrictEqual(local.state, state);

  const olderRemote = { data: JSON.stringify({ version: 1, places: { Old: true }, hidden: {} }), ts: 999 };
  assert.strictEqual(store.shouldAcceptRemote(olderRemote, local).accept, false);
  assert.strictEqual(store.shouldAcceptRemote(olderRemote, local).reason, 'remote-older-than-local');

  const emptyRemote = { data: JSON.stringify({ version: 1, places: {}, hidden: {} }), ts: 2000 };
  assert.strictEqual(store.shouldAcceptRemote(emptyRemote, local).accept, false);
  assert.strictEqual(store.shouldAcceptRemote(emptyRemote, local).reason, 'remote-empty-local-has-data');

  const newerRemoteState = { version: 1, places: { 'Gran Fierro': { visits: [{ day: 6 }] } }, hidden: {} };
  const newerRemote = { data: JSON.stringify(newerRemoteState), ts: 3000 };
  const applied = store.applyRemote(newerRemote);
  assert.strictEqual(applied.applied, true);
  assert.deepStrictEqual(JSON.parse(storage.getItem(DEFAULT_OVERRIDES_KEY)), newerRemoteState);
  assert.strictEqual(storage.getItem(DEFAULT_OVERRIDES_TS_KEY), '3000');

  const cloudWrites = [];
  const cloudStore = createTripSummaryOverridesStore({
    storage: memoryStorage(),
    clock: () => 4000,
    firestoreDoc: {
      async set(payload, options) {
        cloudWrites.push({ payload, options });
      }
    }
  });
  await cloudStore.save({ version: 1, places: { 'Primark Metropole Zličín': { visits: [{ day: 7 }] } }, hidden: {} });
  assert.strictEqual(cloudWrites.length, 1);
  assert.strictEqual(cloudWrites[0].payload.ts, 4000);
  assert.strictEqual(cloudWrites[0].options.merge, true);
  assert.deepStrictEqual(JSON.parse(cloudWrites[0].payload.data).places['Primark Metropole Zličín'].visits[0], { day: 7 });

  console.log('trip-summary-overrides-store tests passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
