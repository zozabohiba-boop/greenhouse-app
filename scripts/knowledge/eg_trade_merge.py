#!/usr/bin/env python3
"""يبني eg_trade_names.json من eg_trade_rows_raw.txt (الاسم التجاري/التركيز/الجرعة/الآفة مقروءة بصريًا من صور كتاب التوصيات 2026)
ويطابق كل صف على eg_recommendations_extract.json بالمفتاح (pdf_page, reg_no). يفشل إن وُجد صف بلا مطابقة.

  python3 scripts/knowledge/eg_trade_merge.py

صيغة الملف الخام: pdf_page|reg|trade_ar|form_conc|actives|rate|pest
"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ex = json.load(open(os.path.join(HERE, 'eg_recommendations_extract.json'), encoding='utf-8'))
key = {(r['pdf_page'], r['reg_no']): r for r in ex['rows']}
out, miss = [], []
for l in open(os.path.join(HERE, 'eg_trade_rows_raw.txt'), encoding='utf-8'):
    p = l.rstrip('\n').split('|')
    if len(p) < 7:
        continue
    pg, reg, name, fc, act, rate, pest = int(p[0]), p[1], p[2], p[3], p[4], p[5], p[6]
    r = key.get((pg, reg))
    if not r:
        miss.append((pg, reg, name)); continue
    m = re.match(r'([A-Z]+)\s*([\d.]+%)', fc)
    out.append({'crop': r['crop'], 'pdf_page': pg, 'book_page': pg - 13, 'reg_no': reg, 'trade_name_ar': name,
                'formulation': m.group(1) if m else None, 'concentration': m.group(2) if m else None, 'actives_text': act,
                'rate_ar': rate, 'pest_ar': pest, 'phi_days': r['phi_days'], 'who': r['who']})
if miss:
    print('NO MATCH', miss); sys.exit(1)
crops = sorted({r['crop'] for r in out})
json.dump({'meta': {'source': ex['meta']['source'],
  'method': 'الاسم التجاري والتركيز ومعدل الاستخدام والآفة قُرئت بصريًا من صور صفحات الكتاب (170 dpi) لأن طبقة النص العربية مشوّشة، ثم طُوبقت أرقام التسجيل على eg_recommendations_extract.json صفحة بصفحة (الفروق التي ظهرت صُححت في الملف الأصلي). كتابة الأسماء العربية قد تحوي خطأ إملائيًا بسيطًا؛ المرجع النهائي هو الكتاب المطبوع. أرقام التسجيل ليست فريدة: المفتاح (pdf_page, reg_no). الملف الخام: eg_trade_rows_raw.txt',
  'crops': crops, 'count': len(out)}, 'rows': out}, open(os.path.join(HERE, 'eg_trade_names.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out), 'rows', crops)

# فهرس مصغّر يُشحن مع التطبيق لميزة «تصوير العلبة» (src/data/eg_trade_index.json): منتج واحد لكل (رقم تسجيل، اسم) مع استخداماته حسب المحصول
idx = {}
for r in out:
    k = (r['reg_no'], r['trade_name_ar'])
    e = idx.setdefault(k, {'reg': r['reg_no'], 'n': r['trade_name_ar'], 'f': r['formulation'], 'c': r['concentration'], 'a': r['actives_text'], 'u': []})
    e['u'].append({'crop': r['crop'], 'pest': r['pest_ar'], 'rate': r['rate_ar'], 'phi': r['phi_days']})
dst = os.path.join(HERE, '..', '..', 'src', 'data', 'eg_trade_index.json')
json.dump({'source': 'كتاب التوصيات المعتمدة لمكافحة الآفات الزراعية 2026 — لجنة مبيدات الآفات الزراعية', 'crops': crops, 'products': list(idx.values())},
          open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('index', len(idx), 'products', os.path.getsize(dst), 'bytes')
