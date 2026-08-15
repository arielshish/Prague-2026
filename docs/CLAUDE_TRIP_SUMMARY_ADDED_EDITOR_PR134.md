# Claude Handoff — Trip Summary Added Items Editor PR #134

PR #134 fixes a UI gap after the selection bank feature: `overrides.added` rows appeared in the Trip Summary but were not editable in the manual editor.

The manual editor now renders a dedicated section for bank-added items, with day/label editing and a remove-from-summary action. The data model remains unchanged and saved overrides are not bulk-deleted.

Final diff must contain only `app.html` and the two PR #134 docs. Do not merge temporary `tools/` or `.github/workflows/` files.
