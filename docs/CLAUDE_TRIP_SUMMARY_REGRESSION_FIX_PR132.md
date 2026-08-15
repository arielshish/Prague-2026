# Claude Handoff — Trip Summary Regression Fix PR #132

PR #131 de-duplicated summary rows too aggressively. This PR keeps canonical duplicate cleanup but excludes `manualVisit` rows from normal de-dupe so a second Pizza & Pasta Factory visit remains visible.

It also locks body scroll while full-screen Trip Summary overlays are open and moves Burger King OC Eden GPS aliases into `PLACE_COORDS`.

Final diff must contain only `app.html` and the two PR #132 docs. Do not merge temporary `tools/` or `.github/workflows/` files.
