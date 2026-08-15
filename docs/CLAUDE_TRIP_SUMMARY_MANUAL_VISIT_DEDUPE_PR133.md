# Claude Handoff — Trip Summary Manual Visit De-dupe PR #133

PR #132 exposed existing duplicate manual visits saved from repeated `+ ביקור` taps. PR #133 keeps the saved data intact and only de-dupes identical manual visit rows during rendering.

Key rule: collapse duplicate manual visits by `day + label` for the same source place, but keep distinct days/labels.

Final diff must contain only `app.html` and the two PR #133 docs. Do not merge temporary `tools/` or `.github/workflows/` files.
