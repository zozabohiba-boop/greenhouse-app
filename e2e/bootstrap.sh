#!/usr/bin/env bash
# تجهيز النظام لبيئة الاختبار الشامل على حاوية جديدة (آمن للتكرار):
# PostgreSQL 16 + كلاستر /tmp/pgdata على المنفذ 5544 + أدوار Supabase + PostgREST في /tmp/postgrest
# بعده: npm ci && ./e2e/build.sh && ./e2e/setup.sh && node e2e/run.mjs
set -euo pipefail

PGBIN=/usr/lib/postgresql/16/bin
PGDATA=/tmp/pgdata
PGPORT=5544
POSTGREST_VERSION="${POSTGREST_VERSION:-v12.2.12}"
POSTGREST_BIN=/tmp/postgrest

as_pg() { su postgres -s /bin/bash -c "$1"; }

# 1) PostgreSQL 16
if [ ! -x "$PGBIN/postgres" ]; then
  echo "• تثبيت PostgreSQL 16"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq postgresql-16 postgresql-client-16 >/dev/null
fi
id postgres >/dev/null 2>&1 || { echo "مستخدم postgres غير موجود" >&2; exit 1; }

# 2) الكلاستر (UTF8 إجباري: لغة الحاوية POSIX والبيانات عربية)
if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "• إنشاء الكلاستر في $PGDATA"
  rm -rf "$PGDATA"
  mkdir -p "$PGDATA"
  chown postgres:postgres "$PGDATA"
  chmod 700 "$PGDATA"
  as_pg "$PGBIN/initdb -D $PGDATA -U postgres -E UTF8 --locale=C.UTF-8 --auth-local=trust --auth-host=scram-sha-256" >/dev/null
fi
CONF="$PGDATA/postgresql.conf"
grep -q '^# e2e-bootstrap' "$CONF" || cat >> "$CONF" <<EOF
# e2e-bootstrap
listen_addresses = '127.0.0.1'
port = $PGPORT
unix_socket_directories = '/tmp'
password_encryption = 'scram-sha-256'
EOF

# 3) تشغيل السيرفر لو مش شغال
if ! as_pg "$PGBIN/pg_isready -q -h /tmp -p $PGPORT"; then
  rm -f "$PGDATA/postmaster.pid"
  as_pg "setsid $PGBIN/pg_ctl -D $PGDATA -o '-k /tmp -p $PGPORT' -l $PGDATA/log start" >/dev/null
  # setsid قد يرجع قبل ما pg_ctl يخلص، فننتظر صراحةً
  for i in $(seq 1 60); do as_pg "$PGBIN/pg_isready -q -h /tmp -p $PGPORT" && break; sleep 0.5; done
  as_pg "$PGBIN/pg_isready -q -h /tmp -p $PGPORT" || { echo "PostgreSQL لم يبدأ — راجع $PGDATA/log" >&2; exit 1; }
fi

# 4) الأدوار على مستوى الكلاستر (supabase_stub.sql ينشئها لو ناقصة، وهنا نضمن كلمة مرور authenticator)
as_pg "$PGBIN/psql -h /tmp -p $PGPORT -U postgres -d postgres -v ON_ERROR_STOP=1 -q" <<'SQL'
set client_min_messages = warning;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator login noinherit; end if;
end $$;
alter role authenticator with login noinherit password 'auth';
grant anon, authenticated, service_role to authenticator;
SQL
PGPASSWORD=auth "$PGBIN/psql" "postgres://authenticator:auth@127.0.0.1:$PGPORT/postgres" -Atqc 'select 1' >/dev/null \
  || { echo "فشل دخول authenticator عبر TCP" >&2; exit 1; }

# 5) PostgREST
if [ ! -x "$POSTGREST_BIN" ] || ! "$POSTGREST_BIN" --version >/dev/null 2>&1; then
  echo "• تنزيل PostgREST $POSTGREST_VERSION"
  tmp=$(mktemp -d)
  curl -fsSL -o "$tmp/postgrest.tar.xz" \
    "https://github.com/PostgREST/postgrest/releases/download/$POSTGREST_VERSION/postgrest-$POSTGREST_VERSION-linux-static-x86-64.tar.xz"
  tar -xJf "$tmp/postgrest.tar.xz" -C "$tmp"
  install -m 755 "$tmp/postgrest" "$POSTGREST_BIN"
  rm -rf "$tmp"
fi

echo "bootstrap ready: $("$PGBIN/postgres" --version), $("$POSTGREST_BIN" --version 2>&1 | head -1)"
