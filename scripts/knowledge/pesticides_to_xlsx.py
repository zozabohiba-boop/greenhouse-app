# -*- coding: utf-8 -*-
"""
يحوّل scripts/knowledge/pesticides_data.json إلى ملف Excel واضح (يُحدَّث بعد كل دفعة بيانات):
  /mnt/user-data/outputs/سجل_المبيدات_المصادر_الرسمية.xlsx  (+ نسخة في scripts/knowledge/)
الأوراق: المواد الفعالة | حدود المتبقيات MRL (وسوق EG = أيام الأمان من كتاب التوصيات) | مقارنة الأسواق | التسجيل في مصر | تسجيلات الكتاب 2026 | مواد الكتاب خارج السجل | المصادر | التقدم والناقص
تشغيل: python3 scripts/knowledge/pesticides_to_xlsx.py
"""
import json, os, shutil, sys
from datetime import date
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'pesticides_data.json')
NAME = 'سجل_المبيدات_المصادر_الرسمية.xlsx'
OUTS = [os.path.join('/mnt/user-data/outputs', NAME), os.path.join(HERE, NAME)]

CROPS = ['tomato', 'pepper', 'cucumber', 'strawberry', 'eggplant', 'melon', 'green_bean']
CROP_AR = {'tomato': 'طماطم', 'pepper': 'فلفل', 'cucumber': 'خيار', 'strawberry': 'فراولة', 'eggplant': 'باذنجان', 'melon': 'كنتالوب', 'green_bean': 'فاصوليا'}
MARKETS = ['EU', 'CODEX', 'US', 'JP', 'UK', 'GCC']  # EG لا يدخل المقارنة: لا يحمل MRL بل أيام أمان
EU_AR = {'approved': 'معتمدة', 'not_approved': 'غير معتمدة', 'pending': 'قيد المراجعة', 'unknown': 'غير محدد'}

def load():
    with open(SRC, encoding='utf-8') as f:
        return json.load(f)

def style_header(ws, ncol):
    fill = PatternFill('solid', fgColor='0A6F94')
    for c in range(1, ncol + 1):
        cell = ws.cell(row=1, column=c)
        cell.font = Font(bold=True, color='FFFFFF')
        cell.fill = fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.freeze_panes = 'A2'
    ws.sheet_view.rightToLeft = True

def autosize(ws, maxw=60):
    for col in ws.columns:
        w = max((len(str(c.value)) if c.value is not None else 0) for c in col)
        ws.column_dimensions[get_column_letter(col[0].column)].width = min(maxw, max(10, w + 2))

def main():
    d = load()
    subs = d.get('substances', [])
    mrls = d.get('mrls', [])
    eg = d.get('egypt', [])
    wb = Workbook()

    ws = wb.active
    ws.title = 'المواد الفعالة'
    hdr = ['المادة (EN)', 'المادة (عربي)', 'CAS', 'الاستخدام', 'نظام المجموعة', 'المجموعة', 'المجموعة الكيميائية',
           'الاتحاد الأوروبي', 'انتهاء الاعتماد', 'مرشحة للاستبدال', 'ملاحظات', 'المصدر']
    ws.append(hdr)
    for s in subs:
        ws.append([s.get('name_en'), s.get('name_ar'), s.get('cas'), '، '.join(s.get('classes') or []), s.get('moa_system'),
                   s.get('moa_code'), s.get('chemical_group'), EU_AR.get(s.get('eu_status'), s.get('eu_status')), s.get('eu_expiry'),
                   {True: 'نعم', False: 'لا'}.get(s.get('eu_cfs'), ''), s.get('notes'), s.get('eu_source')])
        if s.get('eu_status') == 'not_approved':
            ws.cell(row=ws.max_row, column=8).font = Font(bold=True, color='C0392B')
    style_header(ws, len(hdr)); autosize(ws)

    ws2 = wb.create_sheet('حدود المتبقيات MRL')
    hdr2 = ['المادة', 'السوق', 'المحصول', 'MRL (مجم/كجم)', 'أيام الأمان PHI (EG)', 'حد الكشف الافتراضي', 'تاريخ الاسترجاع', 'المصدر', 'ملاحظة']
    ws2.append(hdr2)
    for m in sorted(mrls, key=lambda x: (x.get('substance', ''), x.get('market', ''), CROPS.index(x['crop']) if x.get('crop') in CROPS else 99)):
        ws2.append([m.get('substance'), m.get('market'), CROP_AR.get(m.get('crop'), m.get('crop')), m.get('mrl_mg_kg'), m.get('phi_days'),
                    'نعم' if m.get('default_loq') else '', m.get('retrieved_on'),
                    'كتاب التوصيات المعتمدة 2026 (لجنة المبيدات)' if str(m.get('source', '')).startswith('book:') else m.get('source'),
                    m.get('commodity') if str(m.get('source', '')).startswith('book:') else ''])
    style_header(ws2, len(hdr2)); autosize(ws2)

    # جدول مقارنة: مادة × (سوق/محصول)
    ws3 = wb.create_sheet('مقارنة الأسواق')
    cols = [(mk, c) for mk in MARKETS for c in CROPS if any(x.get('market') == mk and x.get('crop') == c for x in mrls)]
    ws3.append(['المادة', 'الاتحاد الأوروبي'] + [f'{mk} — {CROP_AR[c]}' for mk, c in cols])
    idx = {(x.get('substance'), x.get('market'), x.get('crop')): x for x in mrls}
    for s in subs:
        row = [s.get('name_ar') or s.get('name_en'), EU_AR.get(s.get('eu_status'), '')]
        for mk, c in cols:
            x = idx.get((s.get('name_en'), mk, c))
            row.append('' if not x else (f"{x.get('mrl_mg_kg')}*" if x.get('default_loq') else x.get('mrl_mg_kg')))
        ws3.append(row)
    style_header(ws3, 2 + len(cols)); autosize(ws3, 22)

    ws4 = wb.create_sheet('التسجيل في مصر')
    ws4.append(['المادة', 'مسجلة في مصر', 'أسماء تجارية', 'المصدر'])
    for e in eg:
        ws4.append([e.get('substance'), {True: 'نعم', False: 'لا'}.get(e.get('registered'), ''), '، '.join(e.get('trade_names') or []), e.get('source')])
    style_header(ws4, 4); autosize(ws4)

    # تسجيلات الكتاب (استخراج جداول PDF): صف لكل رقم تسجيل × محصول
    bk = os.path.join(HERE, 'eg_recommendations_extract.json')
    if os.path.exists(bk):
        with open(bk, encoding='utf-8') as f:
            ex = json.load(f)
        ws7 = wb.create_sheet('تسجيلات الكتاب 2026')
        hdr7 = ['المحصول', 'صفحة الكتاب', 'رقم التسجيل', 'المواد الفعالة', 'فترة الأمان (يوم)', 'ملاحظة الأمان', 'تصنيف السمية WHO',
                'EPA', 'EU', 'Codex', 'طريقة القراءة']
        ws7.append(hdr7)
        for r in ex['rows']:
            vals = r.get('values') or []
            ws7.append([CROP_AR.get(r.get('crop'), r.get('crop')), r.get('book_page'), r.get('reg_no'), ' + '.join(r.get('actives') or []),
                        r.get('phi_days'), r.get('phi_note'), r.get('who'),
                        ' | '.join(str(v.get('epa') or '-') for v in vals), ' | '.join(str(v.get('eu') or '-') for v in vals),
                        ' | '.join(str(v.get('codex') or '-') for v in vals),
                        'جدول PDF' if r.get('read_by') == 'table' else 'قراءة بصرية'])
        style_header(ws7, len(hdr7)); autosize(ws7, 50)
        ws7.sheet_properties.tabColor = '0A6F94'
        note = ex.get('meta') or {}
        ws7.append([])
        ws7.append(['المصدر', note.get('source')])
        ws7.append(['ملاحظة', 'أرقام التسجيل ليست فريدة في الكتاب (بعضها يتكرر على منتجات مختلفة). أسماء المنتجات والجرعات غير مستخرجة لأن طبقة النص العربية في الـPDF مشوهة.'])
        miss = (d.get('progress') or {}).get('eg_book', {}).get('actives_in_book_not_in_registry') or []
        if miss:
            ws8 = wb.create_sheet('مواد الكتاب خارج السجل')
            ws8.append(['مادة فعالة موجودة في الكتاب وغير موجودة في سجلنا (تحتاج إضافة)'])
            for n in miss:
                ws8.append([n])
            style_header(ws8, 1); autosize(ws8, 60)

    ws5 = wb.create_sheet('المصادر')
    ws5.append(['الرمز', 'العنوان', 'الرابط'])
    for s in d.get('sources', []):
        ws5.append([s.get('id'), s.get('title'), s.get('url')])
    style_header(ws5, 3); autosize(ws5, 90)

    ws6 = wb.create_sheet('التقدم والناقص')
    ws6.append(['البند', 'القيمة'])
    ws6.append(['آخر تحديث', d.get('generated_on') or str(date.today())])
    ws6.append(['عدد المواد الفعالة', len(subs)])
    ws6.append(['مواد حالتها في الاتحاد الأوروبي محددة', sum(1 for s in subs if s.get('eu_status') in ('approved', 'not_approved', 'pending'))])
    for mk in MARKETS:
        n = sum(1 for m in mrls if m.get('market') == mk)
        if n: ws6.append([f'أرقام MRL — {mk}', n])
    missing_mrl = [s.get('name_en') for s in subs if not any(m.get('substance') == s.get('name_en') for m in mrls)]
    ws6.append(['مواد بدون أي رقم MRL بعد', '، '.join(missing_mrl)])
    ws6.append(['التسجيل في مصر', f'{len(eg)} مادة' if eg else 'لم يُجمع بعد (موقع لجنة المبيدات غير متاح أو يحتاج ملف رسمي)'])
    for k, v in (d.get('progress') or {}).items():
        ws6.append([k, json.dumps(v, ensure_ascii=False) if not isinstance(v, (str, int, float)) else v])
    style_header(ws6, 2); autosize(ws6, 100)

    for out in OUTS:
        os.makedirs(os.path.dirname(out), exist_ok=True)
        tmp = out + '.tmp.xlsx'
        wb.save(tmp)
        shutil.move(tmp, out)
    print(f'saved {len(subs)} substances, {len(mrls)} MRL rows → {OUTS[0]}', file=sys.stderr)

if __name__ == '__main__':
    main()
