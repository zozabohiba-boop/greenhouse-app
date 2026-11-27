#!/usr/bin/env python3
"""US EPA tolerances (40 CFR Part 180, Subpart C) للمحاصيل المحمية في التطبيق.

المصدر: نص 40 CFR 180.xxx كما يظهر في Cornell LII (نسخة مطابقة للائحة الاتحادية؛ موقع eCFR الرسمي يمنع القراءة الآلية).
كل صف يحتفظ باسم السلعة كما وردت في اللائحة (commodity) ثم نحوّله إلى رمز محصول في التطبيق
بقاعدة تصنيف المحاصيل الأمريكية المعلنة (مجموعة 8-10 = طماطم/فلفل/باذنجان، مجموعة 9 = خيار/كنتالوب، 13-07G = فراولة، 6A/6-22A = فاصوليا قرنية).
السلعة المسماة صراحةً تتفوق دائمًا على قيمة المجموعة. لا توجد أرقام مخترعة: ما لم يرد في النص لا يُسجَّل.

تشغيل:  python3 us_tolerances.py   (يحدّث pesticides_data.json بطريقة idempotent: يستبدل كل صفوف US)
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
JSON = os.path.join(HERE, 'pesticides_data.json')
RETRIEVED = '2026-11-27'
URL = 'https://www.law.cornell.edu/cfr/text/40/{n}'

# substance (as in pesticides_data.json) -> (CFR section, [(commodity as listed, ppm, note)])
RAW = {
    'abamectin': ('180.449', [('Vegetable, fruiting, group 8-10', 0.07, ''), ('Vegetable, cucurbit, group 9', 0.005, ''),
                              ('Vegetable, legume, edible podded, subgroup 6A', 0.08, ''), ('Berry, low growing, subgroup 13-07G', 0.05, '')]),
    'emamectin benzoate': ('180.505', [('Vegetable, fruiting, group 8-10', 0.02, ''), ('Vegetable, cucurbit, group 9', 0.02, '')]),
    'mandipropamid': ('180.637', [('Vegetable, fruiting, group 8-10', 1.0, ''), ('Vegetable, cucurbit, group 9', 0.6, ''),
                                  ('Bean (Phaseolus spp.), edible podded', 0.90, '')]),
    'chlorantraniliprole': ('180.628', [('Vegetable, fruiting, group 8-10', 1.4, ''), ('Vegetable, cucurbit, group 9', 0.5, ''),
                                        ('Berry, low growing, subgroup 13-07G', 1.0, '')]),
    'cyantraniliprole': ('180.672', [('Vegetable, fruiting, group 8-10', 2.0, ''), ('Vegetable, cucurbit, group 9', 0.70, ''),
                                     ('Strawberry', 1.5, ''), ('Vegetable, legume, bean, edible podded, subgroup 6-22A', 2.0, '')]),
    'spinosad': ('180.495', [('Vegetable, fruiting, group 8-10', 0.40, ''), ('Vegetable, cucurbit, group 9', 0.3, ''),
                             ('Berry, low growing, subgroup 13-07G, except cranberry', 0.90, ''), ('Vegetable, legume, edible podded, subgroup 6A', 0.30, '')]),
    'spinetoram': ('180.635', [('Vegetable, fruiting, group 8-10', 0.40, ''), ('Vegetable, cucurbit, group 9', 0.30, ''),
                               ('Berry, low growing, subgroup 13-07G, except cranberry', 0.90, ''), ('Vegetable, legume, edible podded, subgroup 6A', 0.30, '')]),
    'indoxacarb': ('180.564', [('Vegetable, fruiting, group 8-10', 0.5, ''), ('Vegetable, cucurbit, group 9', 0.60, ''),
                               ('Strawberry', 4.0, ''), ('Vegetable, legume, bean, edible podded, subgroup 6-22A', 0.9, '')]),
    'methoxyfenozide': ('180.544', [('Vegetable, fruiting, group 8-10', 2.0, ''), ('Vegetable, cucurbit, group 9', 0.3, ''),
                                    ('Berry, low growing, subgroup 13-07G, except cranberry', 2.0, ''), ('Edible podded bean subgroup 6-22A', 2.0, '')]),
    'imidacloprid': ('180.472', [('Vegetable, fruiting, group 8', 1.0, ''), ('Vegetable, cucurbit, group 9', 0.5, ''), ('Strawberry', 0.50, '')]),
    'spirotetramat': ('180.641', [('Vegetable, fruiting, group 8-10', 2.5, ''), ('Vegetable, cucurbit, group 9', 0.30, ''),
                                  ('Strawberry', 0.40, 'لا تسجيلات أمريكية لهذه السلعة (حاشية اللائحة)')]),
    'lambda-cyhalothrin': ('180.438', [('Vegetable, fruiting, group 8', 0.20, ''), ('Tomato', 0.1, ''), ('Vegetable, cucurbit, group 9', 0.05, ''),
                                       ('Vegetable, legume, edible podded, subgroup 6A', 0.20, '')]),
    'alpha-cypermethrin': ('180.418', [('Vegetable, fruiting, group 8-10', 0.20, 'سيبرمثرين وأيزومراته'), ('Vegetable, cucurbit, group 9', 0.20, 'سيبرمثرين وأيزومراته'),
                                       ('Bean, green, edible podded', 0.7, 'سيبرمثرين وأيزومراته (جدول 2)')]),
    'chlorfenapyr': ('180.513', [('Vegetable, fruiting, group 8-10', 2.0, ''), ('Cucumber', 0.5, '')]),
    'hexythiazox': ('180.448', [('Berry, low growing, subgroup 13-07G', 6.0, ''), ('Tomato', 0.50, ''), ('Pepper/eggplant subgroup 8-10B', 1.5, '')]),
    'etoxazole': ('180.593', [('Pepper/eggplant subgroup 8-10B', 0.2, ''), ('Tomato', 0.2, ''), ('Squash/cucumber subgroup 9B', 0.02, ''),
                              ('Melon subgroup 9A', 0.2, ''), ('Berry, low growing, subgroup 13-07G', 0.5, '')]),
    'fenpyroximate': ('180.566', [('Vegetable, fruiting, group 8-10', 0.20, ''), ('Squash/cucumber subgroup 9B', 0.4, ''), ('Melon subgroup 9A', 0.10, ''),
                                  ('Berry, low growing, subgroup 13-07G', 1.0, ''), ('Bean, snap, succulent', 0.40, '')]),
    'bifenazate': ('180.572', [('Vegetable, fruiting, group 8-10', 4.0, ''), ('Vegetable, cucurbit, group 9', 0.75, ''), ('Strawberry', 1.5, ''),
                               ('Vegetable, legume, edible-podded, subgroup 6A', 6.0, '')]),
    'pyridaben': ('180.494', [('Berry, low growing, subgroup 13-07G, except cranberry', 2.5, ''), ('Cucumber', 0.50, ''), ('Tomato', 0.15, '')]),
    'chlorpyrifos': ('180.342', [('Cucumber', 0.05, ''), ('Pepper', 1.0, ''), ('Strawberry', 0.2, '')]),
    'methomyl': ('180.253', [('Pepper, bell', 2.0, ''), ('Tomato', 1.0, ''), ('Vegetable, fruiting, group 8', 0.2, ''), ('Vegetable, cucurbit, group 9', 0.2, '')]),
    'dimethoate': ('180.204', [('Tomato', 2.0, ''), ('Pepper', 2.0, ''), ('Melon', 1.0, ''), ('Bean, snap, succulent', 2.0, '')]),
    'oxamyl': ('180.303', [('Tomato', 2.0, ''), ('Pepper, bell', 2.0, 'الفلفل الحار 5.0'), ('Eggplant', 2.0, ''), ('Cucumber', 2.0, ''), ('Cantaloupe', 2.0, '')]),
    'fosthiazate': ('180.596', [('Tomato', 0.02, '')]),
    'fluopyram': ('180.661', [('Pepper/eggplant subgroup 8-10B', 4.0, ''), ('Tomato subgroup 8-10A', 1.0, ''), ('Squash/cucumber subgroup 9B', 0.60, ''),
                              ('Melon subgroup 9A', 1.0, ''), ('Berry, low growing, except cranberry, subgroup 13-07G', 2.0, ''),
                              ('Vegetable, legume, bean, edible podded, subgroup 6-22A', 4.0, '')]),
    'azoxystrobin': ('180.507', [('Pepper/eggplant subgroup 8-10B', 3.0, ''), ('Tomato subgroup 8-10A', 0.2, ''), ('Vegetable, cucurbit, group 9', 0.3, ''),
                                 ('Berry, low growing, subgroup 13-07G, except cranberry', 10.0, ''), ('Vegetable, legume, edible podded, subgroup 6A, except soybean', 3.0, '')]),
    'pyraclostrobin': ('180.582', [('Vegetable, fruiting, group 8-10', 1.4, ''), ('Berry, low growing, subgroup 13-07G, except cranberry', 1.2, ''),
                                   ('Vegetable, cucurbit, group 9', 0.5, ''), ('Vegetable, legume, edible podded, subgroup 6A', 0.5, '')]),
    'trifloxystrobin': ('180.555', [('Vegetable, fruiting, group 8-10', 0.5, ''), ('Vegetable, cucurbit, group 9', 0.50, ''),
                                    ('Berry, low growing, subgroup 13-07G', 1.5, ''), ('Vegetable, legume, bean, edible podded, subgroup 6-22A', 1.5, '')]),
    # ── دفعة 3: فطريات ──
    'difenoconazole': ('180.475', [('Vegetable, fruiting, group 8-10', 0.60, ''), ('Vegetable, cucurbit, group 9', 0.70, ''),
                                   ('Berry, low growing, subgroup 13-07G, except cranberry', 2.5, '')]),
    'tebuconazole': ('180.474', [('Vegetable, fruiting, group 8-10', 1.3, ''), ('Vegetable, cucurbit, group 9', 0.4, ''), ('Bean, succulent', 0.1, '')]),
    'myclobutanil': ('180.443', [('Vegetable, fruiting, group 8, except tomato', 4.0, ''), ('Tomato', 0.30, ''), ('Vegetable, cucurbit, group 9', 0.20, ''),
                                 ('Strawberry', 0.50, ''), ('Bean, snap, succulent', 1.0, '')]),
    'tetraconazole': ('180.557', [('Vegetable, fruiting, group 8-10', 0.30, ''), ('Vegetable, cucurbit, group 9', 0.15, ''),
                                  ('Low growing berry subgroup 13-07G, except cranberry', 0.25, '')]),
    'boscalid': ('180.589', [('Vegetable, fruiting, group 8-10', 3.0, ''), ('Vegetable, cucurbit, group 9', 3.0, ''),
                             ('Berry, low growing, subgroup 13-07G, except cranberry', 4.5, ''), ('Vegetable, legume, edible podded subgroup 6A', 5.0, '')]),
    'cyprodinil': ('180.532', [('Berry, low growing, subgroup 13-07G, except cranberry', 5.0, ''), ('Vegetable, cucurbit, group 9', 0.70, ''),
                               ('Vegetable, fruiting, group 8-10', 1.5, ''), ('Bean, succulent', 0.6, '')]),
    'fludioxonil': ('180.516', [('Vegetable, fruiting, group 8-10, except tomato', 0.50, ''), ('Tomato', 5.0, ''), ('Vegetable, cucurbit, group 9', 0.45, ''),
                                ('Berry, low growing, subgroup 13-07G, except cranberry', 3.0, ''), ('Bean, succulent', 0.4, '')]),
    'iprodione': ('180.399', [('Strawberry', 15.0, ''), ('Bean, succulent', 2.0, '')]),
    'mancozeb': ('180.176', [('Pepper', 12.0, ''), ('Tomato', 2.5, ''), ('Vegetable, cucurbit, group 9', 2.0, '')]),
    'chlorothalonil': ('180.275', [('Bean, snap, succulent', 5.0, ''), ('Tomato', 5.0, ''), ('Vegetable, cucurbit, group 9', 5.0, ''),
                                   ('Vegetable, fruiting, group 8, except tomato', 6.0, '')]),
    'metalaxyl-M': ('180.546', [('Vegetable, fruiting, group 8-10', 1.0, 'ميفينوكسام (180.546) — ميتالاكسيل-M')]),
    'cymoxanil': ('180.503', [('Vegetable, fruiting, group 8', 0.2, ''), ('Vegetable, cucurbit, group 9', 0.05, '')]),
    'dimethomorph': ('180.493', [('Strawberry', 0.90, ''), ('Vegetable, cucurbit, group 9', 0.5, ''), ('Vegetable, fruiting, group 8', 1.5, '')]),
    'propamocarb': ('180.499', [('Vegetable, fruiting, group 8-10', 4.0, ''), ('Vegetable, cucurbit, group 9', 1.5, '')]),
    'famoxadone': ('180.587', [('Vegetable, fruiting, group 8-10, except tomato', 4.0, ''), ('Tomato', 1.0, ''), ('Vegetable, cucurbit, group 9', 0.3, '')]),
    'thiophanate-methyl': ('180.371', [('Bean, snap, succulent', 2.0, ''), ('Strawberry', 7.0, ''), ('Vegetable, cucurbit, group 9', 1.0, '')]),
    'fluazinam': ('180.574', [('Tomato subgroup 8-10A', 1.5, ''), ('Pepper/eggplant subgroup 8-10B', 0.09, ''), ('Vegetable, cucurbit, group 9', 0.07, ''),
                              ('Bean, green, edible podded', 0.1, '')]),
    'cyflufenamid': ('180.667', [('Berry, low growing, subgroup 13-07G, except cranberry', 0.20, ''), ('Vegetable, cucurbit, group 9', 0.10, ''),
                                 ('Vegetable, fruiting, group 8-10', 0.20, '')]),
    'ametoctradin': ('180.663', [('Vegetable, fruiting, group 8-10', 1.5, ''), ('Vegetable, cucurbit, group 9', 3.0, '')]),
    # ── دفعة 4: حشرات/أكاروس ──
    'acetamiprid': ('180.578', [('Berry, low growing subgroups 13-07G', 0.60, ''), ('Vegetable, cucurbit, group 9', 0.50, ''),
                                ('Vegetable, fruiting, group 8-10', 0.20, ''), ('Vegetable, legume, edible podded, subgroup 6A', 0.60, '')]),
    'thiamethoxam': ('180.565', [('Vegetable, fruiting, group 8', 0.25, ''), ('Vegetable, cucurbit, group 9', 0.2, ''),
                                 ('Berry, low growing, subgroup 13-07G, except cranberry', 0.30, ''), ('Bean, succulent', 0.02, '')]),
    'dinotefuran': ('180.603', [('Vegetable, fruiting, group 8', 0.7, ''), ('Vegetable, cucurbit, group 9', 0.5, '')]),
    'pyriproxyfen': ('180.510', [('Vegetable, fruiting, group 8-10', 0.80, ''), ('Vegetable, cucurbit, group 9', 0.10, ''), ('Strawberry', 0.30, '')]),
    'buprofezin': ('180.511', [('Vegetable, fruiting, group 8-10', 2.0, ''), ('Vegetable, cucurbit, group 9', 0.50, ''),
                               ('Berry, low growing, subgroup 13-07G', 2.5, ''), ('Bean, green, edible podded', 0.02, '')]),
    'spiromesifen': ('180.607', [('Vegetable, fruiting, group 8', 0.45, ''), ('Vegetable, cucurbit, group 9', 0.10, ''),
                                 ('Berry and small fruit, low growing berry, subgroup 13-07G', 2.0, ''), ('Bean, edible podded', 0.80, '')]),
    'flonicamid': ('180.613', [('Tomato subgroup 8-10A', 0.4, ''), ('Pepper/Eggplant subgroup 8-10B', 3.0, ''), ('Vegetable, cucurbit, group 9', 1.5, ''),
                               ('Berry, low-growing, subgroup 13-07G', 2.0, ''), ('Vegetable, legume, bean, edible podded, subgroup 6-22A', 4.0, '')]),
    'flupyradifurone': ('180.679', [('Vegetable, fruiting, group 8-10', 1.5, ''), ('Vegetable, cucurbit, group 9', 0.40, ''),
                                    ('Berry, low growing, except cranberry subgroup 13-07G', 1.5, ''), ('Vegetable, legume, edible podded, subgroup 6A', 3.0, '')]),
    'sulfoxaflor': ('180.668', [('Vegetable, fruiting, group 8-10', 0.70, ''), ('Vegetable, cucurbit, group 9', 0.40, ''),
                                ('Berry, low growing, subgroup 13-7G', 0.70, ''), ('Bean, succulent', 4.0, '')]),
    'pymetrozine': ('180.556', [('Vegetable, fruiting, group 8', 0.2, ''), ('Vegetable, cucurbit, group 9', 0.1, '')]),
    'acequinocyl': ('180.599', [('Vegetable, fruiting, group 8-10', 0.7, ''), ('Vegetable, cucurbit, group 9', 0.3, ''),
                                ('Berry, low growing, subgroup 13-07G', 0.5, ''), ('Bean, edible podded', 0.25, '')]),
    'malathion': ('180.111', [('Eggplant', 8.0, ''), ('Tomato', 8.0, ''), ('Pepper', 8.0, ''), ('Cucumber', 8.0, ''), ('Melon', 8.0, ''), ('Strawberry', 8.0, '')]),
    'deltamethrin': ('180.435', [('Vegetable, fruiting, group 8', 0.3, ''), ('Tomato', 0.3, ''), ('Vegetable, cucurbit, group 9', 0.2, '')]),
    'fosetyl': ('180.415', [('Pepper/eggplant, subgroup 8-10B', 0.01, 'لا تسجيلات أمريكية (حاشية اللائحة)'), ('Tomato', 3.0, ''),
                            ('Strawberry', 75.0, ''), ('Vegetable, cucurbit, group 9', 15.0, '')]),
    'quinoxyfen': ('180.588', [('Vegetable, fruiting, group 8-10', 1.7, ''), ('Melon subgroup 9A', 0.08, ''), ('Berry, low growing, subgroup 13-07G', 1.0, '')]),
}

# مواد فُحصت ولا يوجد لها أي صف على المحاصيل المحمية في 40 CFR 180 (يعني: لا حد أمريكي → غير مسموحة عمليًا)
NO_ROWS = {
    'profenofos': '180.404: جداول المواشي والقطن فقط — لا حد على الخضر',
    'spirodiclofen': '180.608: لا صفوف للخضر/الفراولة (لوز، تفاح، حمضيات، عنب، مانجو، فستق، مواشي)',
    'lufenuron': 'لا يوجد قسم له في Subpart C (فهرس 180.101–180.732) — لا حد أمريكي مسجل',
    'penconazole': 'لا يوجد قسم له في Subpart C — لا حد أمريكي مسجل',
    'carbendazim': 'لا يوجد قسم له في Subpart C — لا حد أمريكي مسجل',
    'hymexazol': 'لا يوجد قسم له في Subpart C — لا حد أمريكي مسجل',
    'bupirimate': 'لا يوجد قسم له في Subpart C — لا حد أمريكي مسجل',
    'milbemectin': 'لا يوجد قسم له في Subpart C — لا حد أمريكي مسجل',
}


def crops_for(commodity: str):
    """محاصيل التطبيق التي ينطبق عليها اسم السلعة (صراحةً أو بحكم المجموعة). explicit=True لو الاسم محدد."""
    c = commodity.lower().replace('low-growing', 'low growing')
    if 'low growing' in c and ('13-07g' in c or '13-7g' in c) and 'except strawberry' not in c:
        return ['strawberry'], False
    if c.startswith(('vegetable, fruiting', 'vegetables, fruiting')):
        if 'except tomato' in c:
            return ['pepper', 'eggplant'], False
        return ['tomato', 'pepper', 'eggplant'], False
    if c == 'bean, succulent':   # أضعف مستوى: لا يفرّق بين القرنية والمقشورة في اللائحة
        return ['green_bean'], False
    if c.startswith('pepper/eggplant'):
        return ['pepper', 'eggplant'], False
    if c.startswith('tomato'):
        return ['tomato'], True
    if c.startswith('pepper'):
        return ['pepper'], True
    if c.startswith('eggplant'):
        return ['eggplant'], True
    if c.startswith('vegetable, cucurbit'):
        return ['cucumber', 'melon'], False
    if c.startswith('squash/cucumber'):
        return ['cucumber'], False
    if c.startswith('melon subgroup') or c.startswith('cantaloupe') or c == 'melon':
        return ['melon'], c in ('cantaloupe', 'melon')
    if c.startswith('cucumber'):
        return ['cucumber'], True
    if c.startswith('strawberry'):
        return ['strawberry'], True
    if c.startswith('berry, low growing'):
        return ['strawberry'], False
    if 'edible podded' in c or 'edible-podded' in c or c.startswith('bean, snap'):
        return ['green_bean'], 'bean,' in c and 'subgroup' not in c
    return [], False


def build():
    rows, unmapped = [], []
    for sub, (cfr, items) in RAW.items():
        best = {}
        for commodity, ppm, note in items:
            crops, explicit = crops_for(commodity)
            if not crops:
                unmapped.append((sub, commodity, ppm))
                continue
            for crop in crops:
                prev = best.get(crop)
                # الاسم الصريح يتفوق على المجموعة؛ ولو تساويا ناخذ الأعلى تحفظًا (لا — الأدنى أحوط للتصدير)
                if prev is None or (explicit and not prev['_explicit']) or (explicit == prev['_explicit'] and ppm < prev['mrl_mg_kg']):
                    best[crop] = {
                        'substance': sub, 'market': 'US', 'crop': crop, 'mrl_mg_kg': ppm, 'default_loq': False,
                        'source': URL.format(n=cfr) + f'  (40 CFR {cfr})', 'retrieved_on': RETRIEVED,
                        'commodity': commodity + (f' — {note}' if note else ''), 'year_adopted': '',
                        '_explicit': explicit,
                    }
        for r in best.values():
            r.pop('_explicit')
            rows.append(r)
    return rows, unmapped


def main():
    d = json.load(open(JSON, encoding='utf-8'))
    names = {s['name_en'] for s in d['substances']}
    missing = [s for s in RAW if s not in names]
    if missing:
        sys.exit(f'مواد غير موجودة في السجل: {missing}')
    rows, unmapped = build()
    d['mrls'] = [m for m in d['mrls'] if m['market'] != 'US'] + rows
    prog = d['progress']
    prog.setdefault('mrl_done', {})['US'] = sorted(RAW)
    prog['us_checked_no_rows'] = NO_ROWS
    prog['us_source_note'] = 'US tolerances read from 40 CFR 180 text via Cornell LII (ecfr.gov blocks automated access). Crop-group → crop mapping per EPA crop group definitions; explicit commodity names override group values.'
    if not any(s['id'] == 'cfr180' for s in d['sources']):
        d['sources'].append({'id': 'cfr180', 'title': 'US EPA tolerances — 40 CFR Part 180 Subpart C (text as published in eCFR; read via Cornell LII mirror)',
                             'url': 'https://www.ecfr.gov/current/title-40/chapter-I/subchapter-E/part-180/subpart-C'})
    json.dump(d, open(JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'US rows: {len(rows)} من {len(RAW)} مادة؛ بدون تحويل: {len(unmapped)}')
    for u in unmapped:
        print('  لم يُحوَّل:', u)


if __name__ == '__main__':
    main()
