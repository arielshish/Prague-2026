# Claude Trip Summary Cloud Sync — PR #126

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/trip-summary-cloud-sync`
Backup branch: `backup/pre-trip-summary-cloud-sync-2026-08-15`

## Purpose

Persist manual trip-summary corrections from PR #125 to Firestore without touching existing app data.

## Files changed

- `app.html`
- `docs/CLAUDE_TRIP_SUMMARY_CLOUD_SYNC.md`

## Runtime change in `app.html`

New isolated Firestore document:

- `appdata/trip_summary`

Existing local keys remain the local cache/source:

- `prague_trip_summary_overrides_v1`
- `prague_trip_summary_overrides_ts`

Added functions:

- `_tripSummaryOverridesLocalTs()`
- `_tripSummaryOverridesMeaningful(o)`
- `_saveTripSummaryOverridesToCloud(o, ts)`
- `_applyTripSummaryOverridesFromCloud(d)`
- `initTripSummaryOverridesCloudSync()`

Integration points:

- `_saveTripSummaryOverrides(o)` writes local first, then attempts Firestore save.
- `_resyncLocalDataToCloud()` uploads local trip-summary overrides after login only if local override data exists.
- `_showApp()` starts the isolated listener after the authenticated app is displayed.
- `BUILD_ID` becomes `2026-08-15-c`.

## Safety boundaries

Do not touch or reuse:

- `appdata/main`
- `appdata/expenses`
- `prague_days_v1`
- `prague_visited_v1`
- `prague_exp_v10`
- GAS / backend login code

Conflict protection:

- Empty remote state does not overwrite meaningful local override data.
- Older remote timestamp does not overwrite newer local override data.
- Newer local data is pushed back to `appdata/trip_summary`.
- Firestore save uses `{ merge: true }`.
