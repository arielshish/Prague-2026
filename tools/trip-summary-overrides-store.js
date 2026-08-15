'use strict';

const DEFAULT_OVERRIDES_KEY = 'prague_trip_summary_overrides_v1';
const DEFAULT_OVERRIDES_TS_KEY = 'prague_trip_summary_overrides_ts';
const DEFAULT_FIRESTORE_DOC = 'appdata/trip_summary';

function nowMs(clock) {
  return typeof clock === 'function' ? Number(clock()) : Date.now();
}

function parseJson(raw, fallback) {
  if (!raw) return fallback;
  try { return JSON.parse(raw); }
  catch (_err) { return fallback; }
}

function normalizeOverrides(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { version: 1, places: {}, hidden: {} };
  }
  return {
    version: Number(value.version) || 1,
    places: value.places && typeof value.places === 'object' && !Array.isArray(value.places) ? value.places : {},
    hidden: value.hidden && typeof value.hidden === 'object' && !Array.isArray(value.hidden) ? value.hidden : {}
  };
}

function hasMeaningfulOverrides(value) {
  const st = normalizeOverrides(value);
  return Object.keys(st.places).length > 0 || Object.keys(st.hidden).length > 0;
}

function createTripSummaryOverridesStore(options = {}) {
  const storage = options.storage;
  const firestoreDoc = options.firestoreDoc || null;
  const key = options.key || DEFAULT_OVERRIDES_KEY;
  const tsKey = options.tsKey || DEFAULT_OVERRIDES_TS_KEY;
  const clock = options.clock;

  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new Error('createTripSummaryOverridesStore requires a storage adapter with getItem/setItem');
  }

  function loadLocal() {
    const raw = storage.getItem(key);
    const tsRaw = storage.getItem(tsKey);
    return {
      exists: raw !== null,
      state: normalizeOverrides(parseJson(raw, null)),
      ts: Number(tsRaw || 0) || 0,
      rawLength: raw == null ? 0 : String(raw).length
    };
  }

  function saveLocal(state, ts = nowMs(clock)) {
    const normalized = normalizeOverrides(state);
    storage.setItem(key, JSON.stringify(normalized));
    storage.setItem(tsKey, String(ts));
    return { state: normalized, ts };
  }

  function shouldAcceptRemote(remote, local) {
    const remoteState = normalizeOverrides(parseJson(remote && remote.data, remote && remote.state));
    const remoteTs = Number(remote && remote.ts || 0) || 0;
    const localState = local && local.state ? normalizeOverrides(local.state) : normalizeOverrides(null);
    const localTs = Number(local && local.ts || 0) || 0;
    const localHasData = !!(local && local.exists) && hasMeaningfulOverrides(localState);
    const remoteHasData = hasMeaningfulOverrides(remoteState);

    if (!remote) return { accept: false, reason: 'no-remote' };
    if (!remoteHasData && localHasData) return { accept: false, reason: 'remote-empty-local-has-data' };
    if (!remoteHasData && !localHasData && !remoteTs) return { accept: false, reason: 'remote-empty-no-ts' };
    if (remoteTs && localTs && remoteTs < localTs) return { accept: false, reason: 'remote-older-than-local' };
    return { accept: true, reason: 'remote-accepted', state: remoteState, ts: remoteTs || nowMs(clock) };
  }

  async function saveCloud(state, ts = nowMs(clock)) {
    if (!firestoreDoc || typeof firestoreDoc.set !== 'function') {
      return { skipped: true, reason: 'no-firestore-doc' };
    }
    const normalized = normalizeOverrides(state);
    await firestoreDoc.set({ data: JSON.stringify(normalized), ts }, { merge: true });
    return { skipped: false, state: normalized, ts };
  }

  async function save(state) {
    const saved = saveLocal(state);
    const cloud = await saveCloud(saved.state, saved.ts);
    return { local: saved, cloud };
  }

  function applyRemote(remote) {
    const local = loadLocal();
    const decision = shouldAcceptRemote(remote, local);
    if (!decision.accept) return { applied: false, decision, local };
    const saved = saveLocal(decision.state, decision.ts);
    return { applied: true, decision, local: saved };
  }

  return {
    key,
    tsKey,
    firestoreDocPath: DEFAULT_FIRESTORE_DOC,
    loadLocal,
    saveLocal,
    saveCloud,
    save,
    applyRemote,
    shouldAcceptRemote,
    normalizeOverrides,
    hasMeaningfulOverrides
  };
}

module.exports = {
  DEFAULT_OVERRIDES_KEY,
  DEFAULT_OVERRIDES_TS_KEY,
  DEFAULT_FIRESTORE_DOC,
  normalizeOverrides,
  hasMeaningfulOverrides,
  createTripSummaryOverridesStore
};
