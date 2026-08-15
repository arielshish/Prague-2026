# Claude Handoff — Trip Summary Coordinate Aliases PR #127

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Working branch: `feature/missing-trip-summary-coords`
Main base before this work: `927430be9fd4cdb26d423cf8d9ac144d7bb49980`
Backup branch: `backup/pre-missing-coords-2026-08-15`

## Current state

This work has been completed on the working branch only.

It has NOT been merged to `main` and has NOT been deployed to GitHub Pages yet.

## User intent

The user wanted missing coordinates checked before building the trip-summary selection bank.

The user specifically asked to:

1. Verify missing coordinates.
2. Include places added manually to the trip summary.
3. Scan the app for additional missing location aliases.
4. Add only safe static coordinate aliases.
5. Avoid breaking or changing any unrelated app data.
6. Keep a backup and full documentation so Claude can understand exactly what was done.

## Backup

A backup branch was created before the coordinate work:

- `backup/pre-missing-coords-2026-08-15`

Do not delete this branch unless the user explicitly asks.

## Files intentionally changed in the final branch diff

Expected final diff against `main`:

- `app.html`
- `docs/TRIP_SUMMARY_COORD_ALIASES.md`
- `docs/FULL_TRIP_COORDS_AUDIT.md`
- `docs/CLAUDE_TRIP_SUMMARY_COORDS_PR127.md`

No backend/GAS files should be changed.
No GitHub workflow files or temporary tool scripts should remain in the final diff.

## Runtime code change summary

Only static entries in `PLACE_COORDS` were added, plus `BUILD_ID` was advanced to:

- `2026-08-15-e`

No app logic was intentionally changed.

The coordinate aliases were inserted inside:

```js
var PLACE_COORDS = { ... }
```

near existing known coordinate entries.

## Why aliases were added

Manual trip-summary additions resolve coordinates by exact name:

```js
coords: PLACE_COORDS[a.name] || null
```

Therefore a manually typed place name will only get GPS if it exactly matches a `PLACE_COORDS` key.

The aliases make common English/Hebrew/mixed names resolve correctly without touching visited state, expenses, schedule, or Firestore.

## First alias batch added

These were added first after checking the obvious missing/alternative names:

- `FAT CAT Downtown`
- `Fat Cat Downtown`
- `FAT CAT Downtown — כיכר וצסלב`
- `אי קמפה – Kampa Island`
- `אי קמפה (Kampa Island)`
- `Kampa Island`
- `Makakiko Running Sushi`
- `Makakiko Running Sushi — Palladium`
- `Primark Metropole Zličín`
- `Primark — Metropole Zličín`

## Reviewed audit alias batch added

After a fuller scan, many results were false positives: UI text, tickets, tips, route titles, or explanatory sentences.

After manual review, only these 11 real place aliases were added:

- `Clementinum – הספרייה הבארוקית`
- `IKEA Praha — Zličín`
- `Municipal House – Obecní dům`
- `Vyšehrad – המבצר הנסתר`
- `בית הריקוד – Dancing House`
- `גשר קארל – Charles Bridge`
- `הרובע היהודי – Josefov`
- `טירת פראג – Pražský hrad`
- `כיכר העיר העתיקה – Old Town Square`
- `מגדל פטרין – Petřín Tower`
- `שעון האסטרונומי – Orloj`

## Total added aliases

Total coordinate alias keys added in this branch:

- 10 first-batch aliases
- 11 reviewed-audit aliases
- 21 total aliases

These represent fewer unique real-world places because several names point to the same location.

Approximate current `PLACE_COORDS` size after the work is about 165 key names/aliases.

## Intentionally not added

- `שפת הנהר Vltava – בלילה`

Reason: this is a broad area/night-route label, not one exact point. Do not force a GPS point for it unless the user chooses a specific stop along the river.

## Full audit report

The full scan output was saved to:

- `docs/FULL_TRIP_COORDS_AUDIT.md`

Important note: the audit report includes false positives because `app.html` contains many UI strings, tips, titles, route labels, ticket labels, and explanatory rows.

Do not automatically add every “Missing GPS / needs review” item from that report. Review each item manually and only add real places or safe aliases.

## Safety boundaries

The user repeatedly asked to ensure this does not break other app behavior.

Do not touch the following unless the user gives a separate explicit approval:

- visited state / `prague_visited_v1`
- manual summary override state / `prague_trip_summary_overrides_v1`
- trip summary cloud doc / `appdata/trip_summary`
- main Firestore doc / `appdata/main`
- expenses Firestore doc / `appdata/expenses`
- custom schedule / `prague_days_v1`
- expenses local data / `prague_exp_v10`
- packing/reminders/budget keys
- login/authentication
- GitHub Pages deploy workflow
- backend repository
- GAS sync/deployment

This PR should remain frontend-only and static-data-only.

## Validation already run

Workflow validation passed after fixing a cleanup-only issue.

Validated checks included:

- reviewed aliases are present in `PLACE_COORDS`
- `BUILD_ID` is `2026-08-15-e`
- inline JavaScript passes `node --check`
- protected localStorage key counts did not change
- protected Firestore path counts did not change
- no new `localStorage.removeItem`
- no new `localStorage.clear`
- temporary workflow/scripts were cleaned out of the final diff

The first reviewed-alias workflow failed only during cleanup/commit because `git add` referenced a temporary file that had already been removed. The actual apply/validation step had already succeeded. The workflow was fixed to use `git add -A`; the second run completed successfully.

## Expected final compare against main

The expected final branch diff should include only:

- `app.html` — static coordinate aliases and `BUILD_ID`
- `docs/TRIP_SUMMARY_COORD_ALIASES.md` — human-readable coordinate alias summary
- `docs/FULL_TRIP_COORDS_AUDIT.md` — audit report
- `docs/CLAUDE_TRIP_SUMMARY_COORDS_PR127.md` — this handoff document

If compare shows `.github/workflows/*` or `tools/*` in the final diff, stop and clean them before opening/merging the PR.

## PR guidance

Recommended PR title:

`Add trip summary coordinate aliases`

Recommended PR body should mention:

- backup branch: `backup/pre-missing-coords-2026-08-15`
- frontend-only/static coordinate alias change
- 21 total aliases added
- one broad Vltava night-route label intentionally not added
- no backend/GAS
- no Firestore path changes
- no visited/expenses/schedule changes
- validation: `node --check` passed and protected keys/path counts unchanged

Do not merge without explicit user approval.

## Next planned work after this PR

The user wants a trip-summary selection bank.

For that future feature:

- show whether each candidate has GPS: `📍 יש מיקום` / `⚠️ חסר מיקום`
- allow including/hiding places in the summary
- do not mutate `היינו` / `prague_visited_v1` from the bank
- use existing isolated summary override storage when possible
- preserve Firestore sync boundaries from PR #126
