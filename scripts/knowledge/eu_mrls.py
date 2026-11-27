#!/usr/bin/env python3
"""حدود المتبقيات في الاتحاد الأوروبي (EU MRL) من تنزيل قاعدة بيانات المبيدات الرسمية (DG SANTE).

المصدر: ملف التنزيل الرسمي pesticide-residues-mrls-download (api-version v3.0) — لقطة بتاريخ 2026-09-13
منشورة كما هي في مستودع عام (github.com/BriceZemba/residuecheck, data/eu_snapshot/2026-09-13, رخصة MIT)
لأن خادم الـ API الأوروبي محجوب من بيئة التطوير. كل صف فيه رقم اللائحة الأوروبية ورابطها على EUR-Lex.

  python3 scripts/knowledge/eu_mrls.py <مسار مجلد اللقطة>

- يكتب مستخلصًا صغيرًا قابلًا للمراجعة: scripts/knowledge/eu_snapshot_extract.json
- يدمج صفوف السوق EU في pesticides_data.json (idempotent: يستبدل صفوف EU السابقة فقط).
قواعد الاختيار (لكل مادة × محصول):
- تعريف المتبقي الحالي: لو تعريف يحل محل تعريف أقدم (replaces) يُفضّل الأحدث؛ تُستبعد المستقلبات المنفصلة (DFA، TMS).
- الصف "Applicable" فقط، وعند التعدد الأحدث تاريخ تطبيق. الصف "Not yet applicable" يُذكر في الملاحظة كتغيير قادم.
- mrl_lod = "*" يعني الحد عند حد الكشف (LOQ) ← default_loq = true.
"""
import gzip, hashlib, json, os, sys
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SNAP_DATE = '2026-09-13'
MIRROR = 'https://github.com/BriceZemba/residuecheck/tree/ed9292f3f1f02f444ecc8a75d99c38024cd0666b/data/eu_snapshot/2026-09-13'
OFFICIAL_DL = 'https://api.datalake.sante.service.ec.europa.eu/sante/pesticides/pesticide-residues-mrls-download?format=json&language_code=EN&api-version=v3.0'
CROPS = {'0231010': 'tomato', '0231020': 'pepper', '0231030': 'eggplant', '0232010': 'cucumber',
         '0233010': 'melon', '0152000': 'strawberry', '0260010': 'green_bean'}
EXCLUDE = {2383, 223}  # Difluoroacetic acid (مستقلب flupyradifurone)، Trimethyl-sulfonium (glyphosate)

# مواد اسمها في قاعدة البيانات الأوروبية مختلف عن اسمنا → معرّفات تعريف المتبقي
EXPLICIT = {
    'abamectin': [8], 'emamectin benzoate': [3010, 2037], 'flonicamid': [778],
    'alpha-cypermethrin': [65], 'boscalid': [244], 'sulfur': [377], 'azadirachtin': [239],
    'paraffin oil (cas 8042-47-5)': [2411], 'paraffin oil (cas 64742-46-7)': [2409],
    'fatty acids potassium salts': [413], 'copper sulphate tribasic': [4050, 262],
}
NOTE_FOR = {'alpha-cypermethrin': 'تعريف المتبقي: سيبرمثرين ومخاليط أيزومراته',
            'mancozeb': 'تعريف المتبقي: ثنائيات الكاربامات معبّرًا عنها كـ CS2',
            'copper hydroxide': 'تعريف المتبقي: النحاس الكلي', 'copper oxychloride': 'تعريف المتبقي: النحاس الكلي',
            'bordeaux mixture': 'تعريف المتبقي: النحاس الكلي', 'copper sulphate tribasic': 'تعريف المتبقي: النحاس الكلي'}

RESIDUE_NOTE = {3430: 'تعريف المتبقي: حمض الفوسفونيك وأملاحه معبّرًا عنه كحمض فوسفونيك (يشمل الفوسيتيل)'}


def dmy(s):
    return datetime.strptime(s, '%d/%m/%Y').date() if s else None


def main(snap):
    subs = json.load(gzip.open(os.path.join(snap, 'substances.json.gz')))
    rn = json.load(gzip.open(os.path.join(snap, 'residue_names.json.gz')))
    rows = [json.loads(l) for l in gzip.open(os.path.join(snap, 'mrls.jsonl.gz'))]
    sha = {f: hashlib.sha256(open(os.path.join(snap, f), 'rb').read()).hexdigest()
           for f in ('mrls.jsonl.gz', 'substances.json.gz', 'residue_names.json.gz', 'manifest.json')}
    replaces = {int(k): v.get('replaces') for k, v in rn.items()}
    by_name = {}
    for s in subs:
        by_name.setdefault(s['substance_name'].strip().lower(), s)
        # الأسماء الأوروبية بصيغة "Abamectin (aka avermectin)" → الاسم قبل القوس
        by_name.setdefault(s['substance_name'].split('(')[0].strip().lower(), s)
    idx = {}
    for r in rows:
        if r['product_code'] in CROPS:
            idx.setdefault((r['pesticide_residue_id'], r['product_code']), []).append(r)

    path = os.path.join(HERE, 'pesticides_data.json')
    d = json.load(open(path, encoding='utf-8'))
    out, extract, unmatched, eu_meta, no_req = [], [], [], {}, {}
    for s in d['substances']:
        n = s['name_en'].lower()
        es = by_name.get(n)
        ids = EXPLICIT.get(n) or (es['pesticide_residue_ids'] if es else [])
        ids = [i for i in ids if i not in EXCLUDE]
        # تتبّع سلسلة الاستبدال للأمام: تعريف جديد حلّ محل تعريف عندنا (مثل 152 → 3370 للميتالاكسيل)
        changed = True
        while changed:
            changed = False
            for new, old in replaces.items():
                if old in ids and new not in ids and new not in EXCLUDE:
                    ids.append(new)
                    changed = True
        # الأحدث أولًا: التعريف الذي يحل محل تعريف آخر في القائمة
        ids.sort(key=lambda i: 0 if replaces.get(i) in ids else 1)
        if not ids:
            unmatched.append(s['name_en'])
            continue
        page = (es or {}).get('pest_res_mrl_webpage') or \
            'https://ec.europa.eu/food/plant/pesticides/eu-pesticides-database/start/screen/mrls/details?lg_code=EN&pest_res_id_list=' + ','.join(map(str, ids))
        if es:
            eu_meta[s['name_en']] = {'status': es['substance_status'], 'expiry': es['expiry_date'], 'eu_name': es['substance_name']}
        for code, crop in CROPS.items():
            cand = None
            for rid in ids:
                allapp = [r for r in idx.get((rid, code), []) if r['applicability_text'] == 'Applicable']
                app = [r for r in allapp if r['mrl_value_only'] is not None]
                if len(app) != len(allapp):
                    print('تحذير: صف بدون قيمة', s['name_en'], code, file=sys.stderr)
                if app:
                    cand = max(app, key=lambda r: dmy(r['application_date']) or datetime.min.date())
                    break
            if not cand:
                continue
            upcoming = [r for rid in ids for r in idx.get((rid, code), []) if r['applicability_text'] == 'Not yet applicable']
            page = 'https://ec.europa.eu/food/plant/pesticides/eu-pesticides-database/start/screen/mrls/details?lg_code=EN&pest_res_id_list=' + str(cand['pesticide_residue_id'])
            note = [cand['product_name'].replace('(b)', '').strip(), cand['regulation_number'] or '', 'تطبيق ' + (cand['application_date'] or '')]
            if NOTE_FOR.get(n):
                note.append(NOTE_FOR[n])
            if cand['pesticide_residue_id'] in RESIDUE_NOTE:
                note.append(RESIDUE_NOTE[cand['pesticide_residue_id']])
            for u in upcoming:
                if u['mrl_value_only'] is None or (u['mrl_value_only'] == cand['mrl_value_only'] and u['mrl_lod'] == cand['mrl_lod']):
                    continue  # نفس القيمة الحالية: لا تغيير يستحق التنبيه
                when = ('يُطبّق من ' + u['application_date']) if u['application_date'] else 'مقترح لم يُعتمد بعد'
                note.append('تغيير قادم: ' + u['mrl_value_only'] + ('*' if u['mrl_lod'] == '*' else '') + ' — ' + when + ' (' + (u['regulation_number'] or '') + ')')
            if cand['mrl_value_only'] == 'No MRL required':
                # الملحق IV: مادة منخفضة الخطورة لا يلزم لها حد — لا نخزّن رقمًا مخترعًا
                no_req.setdefault(s['name_en'], []).append(crop)
                continue
            val = float(cand['mrl_value_only'])
            out.append({'substance': s['name_en'], 'market': 'EU', 'crop': crop, 'mrl_mg_kg': val,
                        'default_loq': cand['mrl_lod'] == '*', 'source': page, 'retrieved_on': SNAP_DATE,
                        'commodity': ' — '.join(x for x in note if x), 'regulation_url': cand['regulation_url'],
                        'eu_residue_id': cand['pesticide_residue_id']})
            extract.append({k: cand[k] for k in ('pesticide_residue_id', 'pesticide_residue_name', 'product_code', 'product_name',
                                                 'mrl_value_only', 'mrl_lod', 'application_date', 'applicability_text',
                                                 'regulation_number', 'regulation_url', 'footnote_text')} | {'substance': s['name_en']})
    d['mrls'] = [m for m in d['mrls'] if m['market'] != 'EU'] + out
    p = d.setdefault('progress', {})
    p.setdefault('mrl_done', {})['EU'] = sorted({m['substance'] for m in out})
    p['eu_source_note'] = ('EU MRLs from the official DG SANTE download (' + OFFICIAL_DL + '), snapshot ' + SNAP_DATE +
                           ' read from a public mirror (' + MIRROR + ') because the EU API host is blocked from the build environment. '
                           'Each row keeps its EU regulation and EUR-Lex link. Values may have changed after the snapshot date.')
    p['eu_no_mrl'] = unmatched
    p['eu_no_mrl_required'] = no_req
    p['eu_no_value_in_download'] = sorted({s['name_en'] for s in d['substances'] if s['name_en'] not in unmatched
                                           and s['name_en'] not in no_req and not any(m['substance'] == s['name_en'] for m in out)})
    p['eu_status_snapshot'] = eu_meta
    p['blocked_sources'] = [b for b in p.get('blocked_sources', []) if 'datalake' not in b] + \
        ['api.datalake.sante.service.ec.europa.eu: still blocked from shell (proxy 403); EU data taken from the official-download snapshot mirror instead']
    json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump({'snapshot_date': SNAP_DATE, 'official_download': OFFICIAL_DL, 'mirror': MIRROR, 'sha256': sha,
               'crops': CROPS, 'rows': extract}, open(os.path.join(HERE, 'eu_snapshot_extract.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print('EU rows', len(out), 'substances', len(p['mrl_done']['EU']), 'loq', sum(m['default_loq'] for m in out))
    print('no EU MRL rows/definition:', unmatched)


if __name__ == '__main__':
    main(sys.argv[1])
