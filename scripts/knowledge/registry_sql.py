#!/usr/bin/env python3
"""يولّد supabase/migrations/016_registry_data.sql من pesticides_data.json (المصدر الوحيد للحقيقة).

  python3 scripts/knowledge/registry_sql.py > supabase/migrations/016_registry_data.sql

القواعد:
- لا أرقام مخترعة: كل صف MRL له source و retrieved_on من الملف؛ فترات الأمان (phi_days) تأتي فقط من صفوف السوق EG المستخرجة من كتاب توصيات الآفات 2026 (eg_book.py)؛ لا تُخمَّن.
- idempotent: upsert على (lower(name_en)) و (substance, market, crop). لا حذف.
- مواد السجل عامة (farm_id = null)، والتعديل عليها محصور بمدير النظام عبر RLS.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(HERE, 'pesticides_data.json'), encoding='utf-8'))
REVIEWED = d.get('generated_on') or '2026-11-27'
RETRIEVED_ON = '2026-11-27'


# تهجئات عربية/أسماء بديلة لربط منتجات الكتالوج (المطابقة كلمات كاملة بعد التطبيع). لا نربط سلالات ميكروبية غير محددة.
ALIASES = [
    ('difenoconazole', 'ديفينوكونازول'),
    ('metalaxyl-m', 'ميفينوكسام'),
    ('bordeaux mixture', 'كبريتات النحاس + الجير'),
    ('fatty acids potassium salts', 'صابون البوتاسيوم'),
    ('paraffin oil (cas 8042-47-5)', 'زيت بارافيني (معدني)'),
    ('paraffin oil (cas 64742-46-7)', 'زيت بارافيني (معدني)'),
    ('bacillus amyloliquefaciens qst 713', 'Bacillus subtilis QST 713'),
]


def q(v):
    if v is None or v == '':
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def arr(xs):
    return "array[" + ", ".join(q(x) for x in xs) + "]::text[]" if xs else "'{}'::text[]"


ONLY = set(a for a in sys.argv[1:] if a.isalpha() and a.isupper())  # مثال: python3 registry_sql.py EU  ← صفوف السوق فقط


def main():
    out = []
    w = out.append
    w('-- 016: سجل المبيدات — المواد الفعالة وحدود المتبقيات (مولّد من scripts/knowledge/pesticides_data.json)')
    w('-- لا تعدّل يدويًا: عدّل البيانات في JSON وأعد التوليد. كل رقم معه مصدره وتاريخ قراءته.')
    w('')
    w('insert into public.active_substances (farm_id, name_en, name_ar, cas_no, classes, moa_system, moa_code, chemical_group, eu_status, eu_expiry, eu_cfs, notes, source_url, reviewed_on)')
    w('values')
    rows = []
    for s in d['substances']:
        note = s.get('notes')
        if s.get('eu_verified_by'):
            note = ((note + ' — ') if note else '') + 'تاريخ الانتهاء مراجع في ' + s['eu_verified_by']
        rows.append('  (null, {name_en}, {name_ar}, {cas}, {classes}, {sys}, {code}, {grp}, {st}, {exp}, {cfs}, {notes}, {src}, {rev})'.format(
            name_en=q(s['name_en']), name_ar=q(s.get('name_ar')), cas=q(s.get('cas')), classes=arr(s.get('classes') or []),
            sys=q(s.get('moa_system')), code=q(s.get('moa_code')), grp=q(s.get('chemical_group')), st=q(s.get('eu_status') or 'unknown'),
            exp=q(s.get('eu_expiry')), cfs=q(s.get('eu_cfs')), notes=q(note), src=q(s.get('eu_source') or s.get('eu_source_alt')), rev=q(REVIEWED)))
    w(',\n'.join(rows))
    w("on conflict (coalesce(farm_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name_en)) do update set")
    w('  name_ar = excluded.name_ar, cas_no = excluded.cas_no, classes = excluded.classes, moa_system = excluded.moa_system,')
    w('  moa_code = excluded.moa_code, chemical_group = excluded.chemical_group, eu_status = excluded.eu_status,')
    w('  eu_expiry = excluded.eu_expiry, eu_cfs = excluded.eu_cfs, notes = excluded.notes, source_url = excluded.source_url,')
    w('  reviewed_on = excluded.reviewed_on, deleted_at = null, updated_at = now(), server_updated_at = now();')
    w('')
    # حدود المتبقيات كنص مضغوط (سطر لكل صف): مادة|سوق|محصول|MRL|مفتاح المصدر|السلعة كما وردت في المصدر
    # مفتاح المصدر: c<رقم القسم في 40 CFR 180>  أو  x<معرّف المادة في Codex>
    def key(url):
        if 'law.cornell.edu' in url:
            return 'c' + url.rsplit('180.', 1)[1]
        if 'pestId=' in url:
            return 'x' + url.split('pestId=')[1]
        if 'eu-pesticides-database' in url and 'pest_res_id_list=' in url:
            return 'e' + url.split('pest_res_id_list=')[1]
        if url.startswith('book:'):
            return ''  # مصدر كتاب (ورقي/PDF): لا رابط
        raise SystemExit('مصدر غير معروف: ' + url)
    lines = []
    for m in d['mrls']:
        if ONLY and m['market'] not in ONLY:
            continue
        # default_loq مسموح فقط لصفوف الاتحاد الأوروبي (القيمة عند حد الكشف *)؛ التاريخ لكل صف
        assert (not m.get('default_loq') or m['market'] == 'EU') and re.fullmatch(r'\d{4}-\d{2}-\d{2}', m['retrieved_on']), m
        c = (m.get('commodity') or '').replace('|', '/').replace(chr(10), ' ')
        lines.append('|'.join([m['substance'].lower(), m['market'], m['crop'], '' if m['mrl_mg_kg'] is None else repr(m['mrl_mg_kg']),
                               key((m.get('source') or '').split('  ')[0]), c, 't' if m.get('default_loq') else 'f', m['retrieved_on'],
                               '' if m.get('phi_days') is None else str(m['phi_days'])]))
    w('with raw as (select l from regexp_split_to_table($d$')
    w('\n'.join(lines))
    w("$d$, E'\\n') l where l <> ''),")
    w("v as (select split_part(l, '|', 1) as name_en, split_part(l, '|', 2) as market, split_part(l, '|', 3) as crop_code,")
    w("  nullif(split_part(l, '|', 4), '')::numeric as mrl_mg_kg, split_part(l, '|', 5) as k, split_part(l, '|', 6) as notes,\n  split_part(l, '|', 7) = 't' as loq, split_part(l, '|', 8)::date as got, nullif(split_part(l, '|', 9), '')::int as phi from raw)")
    w('insert into public.substance_limits (farm_id, substance_id, market, crop_code, mrl_mg_kg, default_loq, phi_days, source_url, retrieved_on, notes)')
    w("select null, s.id, v.market, v.crop_code, v.mrl_mg_kg, v.loq, v.phi,")
    w("  case when v.k = '' then null when v.k like 'c%' then 'https://www.law.cornell.edu/cfr/text/40/180.' || substr(v.k, 2)")
    w("       when v.k like 'e%' then 'https://ec.europa.eu/food/plant/pesticides/eu-pesticides-database/start/screen/mrls/details?lg_code=EN&pest_res_id_list=' || substr(v.k, 2)")
    w("       else 'https://codex.fao.org/codex-texts/codex-online-databases/pesticides-residues/pesticide-index/pesticide-details?pestId=' || substr(v.k, 2) end,")
    w("  v.got, v.notes")
    w("from v join public.active_substances s on s.farm_id is null and lower(s.name_en) = v.name_en")
    w("on conflict (coalesce(farm_id, '00000000-0000-0000-0000-000000000000'::uuid), substance_id, market, crop_code) where deleted_at is null do update set")
    w('  mrl_mg_kg = excluded.mrl_mg_kg, default_loq = excluded.default_loq, phi_days = excluded.phi_days, source_url = excluded.source_url,')
    w('  retrieved_on = excluded.retrieved_on, notes = excluded.notes, updated_at = now(), server_updated_at = now();')
    w('')
    # تطبيع عربي/إنجليزي: حروف صغيرة، توحيد الألف والياء والتاء المربوطة، وكل ما عدا الحروف والأرقام فاصل
    norm = "regexp_replace(translate(lower({x}), 'أإآىة', 'ااايه'), '[^a-z0-9ء-ي]+', ' ', 'g')"
    w('with np as (')
    w("  select p.id, ' ' || " + norm.format(x='p.active_ingredient') + " || ' ' as t")
    w('  from public.products p where p.farm_id is null and p.deleted_at is null and p.active_ingredient is not null')
    w('), al(en, nm) as (values')
    w(',\n'.join('  (%s, %s)' % (q(en), q(nm)) for en, nm in ALIASES))
    w('), ns as (')
    w("  select s.id, trim(" + norm.format(x='v.nm') + ") as n")
    w('  from public.active_substances s cross join lateral (values (s.name_en), (s.name_ar)) v(nm)')
    w('  where s.farm_id is null and s.deleted_at is null and v.nm is not null')
    w('  union all')
    w("  select s.id, trim(" + norm.format(x='al.nm') + ")")
    w('  from al join public.active_substances s on s.farm_id is null and s.deleted_at is null and lower(s.name_en) = al.en')
    w(')')
    w('insert into public.product_actives (farm_id, product_id, substance_id)')
    w('select distinct null::uuid, np.id, ns.id from np join ns on length(ns.n) >= 4 and np.t like (\'% \' || ns.n || \' %\')')
    w('on conflict (product_id, substance_id) where deleted_at is null do nothing;')
    w('')
    print('\n'.join(out))


if __name__ == '__main__':
    main()
