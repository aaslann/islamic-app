#!/usr/bin/env bash
set -euo pipefail

OWNER="aaslann"
REPO="islami-asistan"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="${TMPDIR:-/tmp}/islami-asistan-pages-$$"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) gerekli. Kurulum: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub'a giriş yapın: gh auth login"
  exit 1
fi

echo "→ Geçici klasör hazırlanıyor..."
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
cp "$ROOT/store/privacy-policy.html" "$WORK_DIR/index.html"

cd "$WORK_DIR"
git init -b main
git add index.html
git commit -m "Add privacy policy for App Store / Play Store"

if gh repo view "$OWNER/$REPO" >/dev/null 2>&1; then
  echo "→ Repo zaten var: $OWNER/$REPO — içerik push ediliyor..."
  git remote add origin "https://github.com/$OWNER/$REPO.git" 2>/dev/null || git remote set-url origin "https://github.com/$OWNER/$REPO.git"
  git push -u origin main --force
else
  echo "→ Yeni public repo oluşturuluyor: $OWNER/$REPO"
  gh repo create "$OWNER/$REPO" --public --source=. --remote=origin --push
fi

echo "→ GitHub Pages etkinleştiriliyor (branch: main, root)..."
gh api -X POST "/repos/$OWNER/$REPO/pages" \
  -f 'build_type=legacy' \
  -f 'source[branch]=main' \
  -f 'source[path]=/' \
  2>/dev/null || gh api -X PUT "/repos/$OWNER/$REPO/pages" \
  -f 'build_type=legacy' \
  -f 'source[branch]=main' \
  -f 'source[path]=/'

echo ""
echo "✓ Tamamlandı"
echo "  URL (birkaç dakika içinde aktif olur): https://$OWNER.github.io/$REPO/"
echo "  Repo: https://github.com/$OWNER/$REPO"

rm -rf "$WORK_DIR"
