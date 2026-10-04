#!/usr/bin/env bash
# يبني نسخة الاختبار موجّهة للبوابة المحلية بدل Supabase الحقيقي
set -euo pipefail
cd "$(dirname "$0")/.."
KEY=$(node -e "import('./e2e/gateway.mjs').then(m=>console.log(m.ANON_KEY))")
VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_PUBLISHABLE_KEY="$KEY" npx vite build --outDir dist-e2e --mode e2e >/dev/null
echo "dist-e2e ready"
