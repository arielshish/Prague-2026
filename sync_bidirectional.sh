#!/bin/bash
# ══════════════════════════════════════════════════
#  סנכרון דו-כיווני: Git ↔ GAS ↔ GitHub Pages
#  שימוש:
#    ./sync_bidirectional.sh push   ← Git → GAS → GitHub
#    ./sync_bidirectional.sh pull   ← GAS → Git → GitHub
#    ./sync_bidirectional.sh status ← השוואה בלבד
# ══════════════════════════════════════════════════

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
GAS_DIR="$DIR/gas_project"
DEPLOY_ID="AKfycby3K9gKoVwWZY7tUVf8hUDLnM6WAryzBwmBLxm82XzD8u_bn5URmg9Roixxf-vdrpn6"

MODE="${1:-status}"

echo "══════════════════════════════════════════"
echo "  Prague 2026 — Sync ($MODE)"
echo "══════════════════════════════════════════"

case "$MODE" in

  # ── Git → GAS → GitHub ──────────────────────
  push)
    echo "▶ סנכרון app.html → index.html + gas_project/index.html"
    cd "$DIR"
    python3 sync_gas.py

    echo "▶ בדיקת diff..."
    diff index.html gas_project/index.html || { echo "❌ diff נכשל"; exit 1; }
    echo "✅ index.html == gas_project/index.html"

    echo "▶ clasp push..."
    cd "$GAS_DIR"
    clasp push

    echo "▶ clasp deploy @latest..."
    clasp deploy --deploymentId "$DEPLOY_ID" --description "sync $(date '+%d/%m %H:%M')"

    echo "▶ git commit + push..."
    cd "$DIR"
    git add -A
    if git diff --staged --quiet; then
      echo "ℹ️  אין שינויים לcommit"
    else
      git commit -m "sync: $(date '+%d/%m/%Y %H:%M')"
      git push origin main
    fi

    echo ""
    echo "✅ Git → GAS → GitHub — הושלם"
    ;;

  # ── GAS → Git → GitHub ──────────────────────
  pull)
    echo "▶ clasp pull מ-GAS..."
    cd "$GAS_DIR"
    clasp pull

    echo "▶ סנכרון gas_project/index.html → app.html"
    cd "$DIR"
    # אם index.html השתנה — עדכן app.html (היפוך sync_gas.py)
    # כרגע sync_gas.py הוא חד-כיווני (app.html → index.html)
    # אז נעתיק את index.html החדש מ-GAS ונסנכרן
    python3 sync_gas.py

    echo "▶ git status..."
    git status --short

    echo "▶ git commit + push..."
    git add -A
    if git diff --staged --quiet; then
      echo "ℹ️  אין שינויים — GAS וGit מסונכרנים"
    else
      git commit -m "pull from GAS: $(date '+%d/%m/%Y %H:%M')"
      git push origin main
      echo "✅ GAS → Git → GitHub — הושלם"
    fi
    ;;

  # ── Status only ─────────────────────────────
  status)
    echo "▶ git log (3 אחרונים):"
    cd "$DIR"
    git log --oneline -3

    echo ""
    echo "▶ diff index.html ↔ gas_project/index.html:"
    if diff index.html gas_project/index.html > /dev/null 2>&1; then
      echo "✅ זהים"
    else
      echo "⚠️  שונים — הרץ: ./sync_bidirectional.sh push"
    fi

    echo ""
    echo "▶ GAS deployments:"
    cd "$GAS_DIR"
    clasp deployments
    ;;

  *)
    echo "שימוש: $0 [push|pull|status]"
    exit 1
    ;;
esac
