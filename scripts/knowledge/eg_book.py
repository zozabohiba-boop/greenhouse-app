#!/usr/bin/env python3
"""يدمج بيانات كتاب «التوصيات المعتمدة لمكافحة الآفات الزراعية 2026» (لجنة مبيدات الآفات الزراعية) في pesticides_data.json.

  python3 scripts/knowledge/eg_book.py

المدخل: scripts/knowledge/eg_recommendations_extract.json (مستخرج من ملف الـPDF؛ طريقة الاستخراج والتحقق داخل الملف نفسه).
يضيف (idempotent: يستبدل صفوفه السابقة فقط):
- سوق EG: لكل مادة × محصول ورد في توصيات الكتاب → phi_days = الأعلى بين المنتجات المفردة المسجلة (الأكثر تحفظًا؛ المركبة قد تضم معاملات بذور/تربة بفترات طويلة فلا تُحسب) + ملاحظة بالمدى.
  mrl فارغ: الكتاب لا يعطي حدًا مصريًا، فقط فترة الأمان والتسجيل.
- سد فجوات CODEX: من عمود Codex في الكتاب فقط (قورن بصفوف Codex الرسمية فتطابق 213 من 214؛ عمود EPA لم يُستخدم لأن تطابقه مع 40 CFR 180 كان 84% فقط) حيث لا يوجد صف من المصدر الرسمي المباشر،
  وبشرط أن تكون القيمة متسقة بين كل منتجات المادة للمحصول، وأن يكون المنتج مفردًا أو أن عمود EU فيه يطابق قاعدة الاتحاد الأوروبي (دليل صحة ترتيب المواد في المنتجات المركبة).
  يُوسم كل صف في الملاحظة أنه من الكتاب لا من القاعدة الأصلية.
"""
import json, os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
TODAY = '2026-11-27'
CROPS = ['tomato', 'pepper', 'eggplant', 'cucumber', 'melon', 'strawberry', 'green_bean']
BOOK = 'توصيات الآفات 2026'
MAP = {'fosetyl aluminium': 'fosetyl', 'copper sulfate tribasic': 'copper sulphate tribasic', 'propamocarb hydrochloride': 'propamocarb'}


def pages(rs):
    ps = sorted({r['book_page'] for r in rs})
    return '،'.join(map(str, ps[:4])) + ('…' if len(ps) > 4 else '')


def main():
    d = json.load(open(os.path.join(HERE, 'pesticides_data.json'), encoding='utf-8'))
    ex = json.load(open(os.path.join(HERE, 'eg_recommendations_extract.json'), encoding='utf-8'))
    ours = {s['name_en'].lower() for s in d['substances']}
    have = {(m['substance'].lower(), m['market'], m['crop']): m for m in d['mrls'] if not str(m.get('source', '')).startswith('book:')}
    eu = {(k[0], k[2]): m['mrl_mg_kg'] for k, m in have.items() if k[1] == 'EU'}
    d['mrls'] = [m for m in d['mrls'] if not str(m.get('source', '')).startswith('book:')]

    def sub(a):
        a = MAP.get(a, a)
        return a if a in ours else None

    prods = defaultdict(list)       # (substance, crop) -> product rows
    cand = defaultdict(list)        # (substance, crop, 'codex'|'epa') -> [(value, row)]
    for r in ex['rows']:
        if r['crop'] not in CROPS:
            continue
        n = len(r['values'])
        for v in r['values']:
            s = sub(v['active'])
            if not s:
                continue
            prods[(s, r['crop'])].append(r)
            trusted = n == 1
            if not trusted and v['eu'] not in (None, '-') and eu.get((s, r['crop'])) is not None:
                trusted = abs(float(v['eu']) - eu[(s, r['crop'])]) < 1e-9
            if not trusted:
                continue
            for col in ('codex',):
                x = v[col]
                if x not in (None, '-'):
                    cand[(s, r['crop'], col)].append((float(x), r))

    # معاملة البذور/التقاوى (FS أو معدل بالكجم تقاوى/بذرة) فترة أمانها ليست فاصل رش؛ تُستثنى من phi المادة وتُذكر في الملاحظة
    seed = set()
    tn = os.path.join(HERE, 'eg_trade_names.json')
    if os.path.exists(tn):
        for t in json.load(open(tn, encoding='utf-8'))['rows']:
            if t['formulation'] == 'FS' or 'تقاوى' in t['rate_ar'] or 'بذرة' in t['rate_ar']:
                seed.add((t['pdf_page'], t['reg_no']))

    eg = []
    for (s, crop), rs in sorted(prods.items()):
        regs = sorted({r['reg_no'] for r in rs})
        sd = [r for r in rs if (r['pdf_page'], r['reg_no']) in seed]
        single = [r['phi_days'] for r in rs if len(r['actives']) == 1 and r['phi_days'] is not None and (r['pdf_page'], r['reg_no']) not in seed]
        allp = [r['phi_days'] for r in rs if r['phi_days'] is not None]
        # فترة الأمان على مستوى المادة = الأعلى بين منتجاتها المفردة فقط؛ المنتجات المركبة قد تتضمن معاملات بذور/تربة بفترات طويلة لا تخص المادة وحدها
        phi = max(single) if single else None
        note = 'مسجل في مصر: %d رقم تسجيل' % len(regs)
        if single:
            note += '، أمان المنتجات المفردة %d–%d يوم (الأعلى معتمد)' % (min(single), max(single))
            if allp and max(allp) > max(single):
                note += '، وحتى %d في المركبات' % max(allp)
        elif allp:
            note += '، في منتجات مركبة فقط: أمان %d–%d يوم حسب المنتج (لا قيمة موحدة للمادة)' % (min(allp), max(allp))
        else:
            note += '، أمان غير محدد بقيمة'
        if sd:
            note += '، ومعاملة البذور/التقاوى مستثناة من فترة الأمان'
        note += ' — %s ص %s' % (BOOK, pages(rs))
        eg.append({'substance': s, 'market': 'EG', 'crop': crop, 'mrl_mg_kg': None, 'default_loq': False, 'phi_days': phi,
                   'source': 'book:APC2026', 'retrieved_on': TODAY, 'commodity': note})

    gaps, conflicts = [], []
    for (s, crop, col), lst in sorted(cand.items()):
        market = 'CODEX'
        if (s, market, crop) in have:
            continue
        vals = {v for v, _ in lst}
        if len(vals) != 1:
            conflicts.append((s, crop, market, sorted(vals)))
            continue
        rs = [r for _, r in lst]
        gaps.append({'substance': s, 'market': market, 'crop': crop, 'mrl_mg_kg': lst[0][0], 'default_loq': False,
                     'source': 'book:APC2026', 'retrieved_on': TODAY,
                     'commodity': 'عمود Codex في %s ص %s (ليس من قاعدة Codex مباشرة)' % (BOOK, pages(rs))})

    d['mrls'] += eg + gaps
    p = d.setdefault('progress', {})
    p['eg_book'] = {'source': ex['meta']['source'], 'eg_rows': len(eg), 'codex_gap_rows': sum(g['market'] == 'CODEX' for g in gaps),
                    'conflicts_skipped': [list(map(str, c)) for c in conflicts],
                    'actives_in_book_not_in_registry': sorted({a for r in ex['rows'] if r['crop'] in CROPS for a in r['actives'] if not sub(a)})}
    json.dump(d, open(os.path.join(HERE, 'pesticides_data.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('EG rows', len(eg), 'CODEX gaps', p['eg_book']['codex_gap_rows'], 'conflicts', len(conflicts))
    print('substances with EG row', len({e['substance'] for e in eg}))


if __name__ == '__main__':
    main()
