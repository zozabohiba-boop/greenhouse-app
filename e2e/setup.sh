#!/usr/bin/env bash
# يجهز قاعدة بيانات اختبار نظيفة + PostgREST
set -euo pipefail
cd "$(dirname "$0")/.."
if ! su postgres -s /bin/bash -c "/usr/lib/postgresql/16/bin/pg_isready -q -h /tmp -p 5544"; then
  rm -f /tmp/pgdata/postmaster.pid
  su postgres -s /bin/bash -c "setsid /usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgdata -o '-k /tmp -p 5544' -l /tmp/pgdata/log start" >/dev/null
  sleep 2
fi
PG="psql -h /tmp -p 5544 -U postgres -v ON_ERROR_STOP=1 -q"
cp supabase/migrations/*.sql e2e/*.sql /tmp/ 2>/dev/null || true
chmod 644 /tmp/*.sql
su postgres -s /bin/bash -c "dropdb -h /tmp -p 5544 --if-exists --force e2e && createdb -h /tmp -p 5544 e2e"
su postgres -s /bin/bash -c "$PG -d e2e -f /tmp/supabase_stub.sql -f /tmp/001_schema.sql -f /tmp/002_seed_catalogs.sql -f /tmp/003_invitations_sync.sql -f /tmp/004_storage.sql -f /tmp/006_profiles_email.sql -f /tmp/007_team_admin.sql -f /tmp/008_recommendation_done.sql -f /tmp/seed.sql"
cat > /tmp/postgrest.conf <<CONF
db-uri = "postgres://authenticator:auth@127.0.0.1:5544/e2e"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "e2e-super-secret-jwt-token-with-at-least-32-chars"
server-port = 3001
server-host = "127.0.0.1"
CONF
if [ -f /tmp/postgrest.pid ]; then kill "$(cat /tmp/postgrest.pid)" 2>/dev/null || true; fi
for i in $(seq 1 40); do (exec 3<>/dev/tcp/127.0.0.1/3001) 2>/dev/null || break; sleep 0.25; done
setsid nohup /tmp/postgrest /tmp/postgrest.conf > /tmp/postgrest.log 2>&1 &
echo $! > /tmp/postgrest.pid
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/farms || true)
  [ "$code" = "401" ] || [ "$code" = "200" ] && break
  sleep 0.25
done
echo "postgrest ready ($code)"
