// مطابقة نص العبوة مع كتاب التوصيات المعتمدة 2026 (أسماء تجارية مسجلة) وسجل المواد الفعالة
import { digits, key, ngrams, similarity, soft } from './text';
import {
  findBio, findConcentration, findDoses, findIupac, findManufacturer, findMoa, findRegNo, findSubstances, parseDose,
  typeFromWords, typeOfSubstances, type Dose, type ProductType,
} from './parse';
import type { Product, Substance } from '../catalog';

/** صف منتج في فهرس الكتاب (src/data/eg_trade_index.json) */
export interface BookUse { crop: string; pest: string; rate: string; phi: number | null }
export interface BookProduct { reg: string; n: string; f: string; c: string; a: string; u: BookUse[] }
export interface BookIndex { source: string; crops: string[]; products: BookProduct[] }

let bookPromise: Promise<BookIndex> | null = null;
/** تحميل الفهرس عند الحاجة فقط (158KB) */
export function loadBook(): Promise<BookIndex> {
  bookPromise ??= import('../../data/eg_trade_index.json').then((m) => (m.default ?? m) as unknown as BookIndex);
  return bookPromise;
}

const CROP_AR: Record<string, string> = {
  tomato: 'طماطم', pepper: 'فلفل', eggplant: 'باذنجان', cucumber: 'خيار', green_bean: 'فاصوليا', strawberry: 'فراولة', melon: 'كنتالوب',
};

export interface BookCandidate { product: BookProduct; score: number; why: string[] }

const strip = (s: string) => key(s).replace(/ /g, '');

/** أقرب منتجات الكتاب لنص العبوة. التطابق الاسمي وحده لا يكفي: نضيف نقاطًا للتركيز والشكل والمادة الفعالة */
export function matchBook(text: string, book: BookIndex, substances: Substance[], limit = 3): BookCandidate[] {
  const grams = ngrams(text, 3).filter((g) => g.length >= 3);
  const gramsNoSpace = grams.map((g) => g.replace(/ /g, ''));
  const conc = findConcentration(text);
  const reg = findRegNo(text);
  const found = findSubstances(text, substances).map((s) => key(s.name_en));
  const out: BookCandidate[] = [];
  for (const p of book.products) {
    const n = strip(p.n);
    if (n.length < 3) continue;
    let best = 0;
    for (const g of gramsNoSpace) {
      if (Math.abs(g.length - n.length) > 2) continue;
      const sim = similarity(g, n);
      if (sim > best) best = sim;
    }
    const why: string[] = [];
    let score = 0;
    const nameOk = best >= (n.length <= 4 ? 0.99 : n.length <= 6 ? 0.82 : 0.78);
    if (nameOk) { score += best; why.push(`الاسم يشبه «${p.n}»`); }
    if (reg && reg === p.reg) { score += 0.6; why.push(`رقم التسجيل ${p.reg}`); }
    if (!nameOk && !(reg && reg === p.reg)) continue;
    const pc = p.c.replace(/\s/g, '').toLowerCase();
    if (conc.percent && pc.startsWith(`${conc.percent}%`.toLowerCase())) { score += 0.15; why.push('نفس التركيز'); }
    if (conc.formulation && conc.formulation === p.f) { score += 0.1; why.push('نفس الشكل'); }
    const num = /^[\d.]+/.exec(p.c.replace(/\s/g, ''))?.[0];
    if (num && !(conc.percent && pc.startsWith(`${conc.percent}%`.toLowerCase())) && new RegExp(`(^|[^\\d.])${num.replace('.', '\\.')}([^\\d.]|$)`).test(digits(text))) { score += 0.08; why.push('نفس الرقم'); }
    const act = key(p.a);
    if (found.length && found.some((f) => act.includes(f))) { score += 0.2; why.push('نفس المادة الفعالة'); }
    out.push({ product: p, score, why });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

/** اسم المادة الفعالة المعروض: عربي من السجل إن وُجد، وإلا الإنجليزي كما في الكتاب */
function activeLabel(a: string, substances: Substance[]): string {
  const parts = a.split('+').map((x) => x.trim());
  return parts.map((part) => {
    const pk = key(part.replace(/[\d.]+\s*%/g, ''));
    const s = substances.find((x) => key(x.name_en) === pk);
    const pct = /[\d.]+\s*%/.exec(part)?.[0];
    return `${s?.name_ar ?? part.replace(/[\d.]+\s*%/g, '').trim()}${pct ? ` ${pct}` : ''}`;
  }).join(' + ');
}

/** الجرعة الأكثر تكرارًا بين استخدامات المنتج في الكتاب (للرش فقط) */
export function bookDose(p: BookProduct): { dose?: Dose; others: string[] } {
  const doses = p.u.map((u) => ({ u, d: parseDose(u.rate) })).filter((x): x is { u: BookUse; d: Dose } => !!x.d);
  if (!doses.length) return { others: [] };
  const tally = new Map<string, { n: number; d: Dose }>();
  for (const { d } of doses) {
    const k = `${d.value}|${d.unit}`;
    const cur = tally.get(k);
    if (cur) cur.n++; else tally.set(k, { n: 1, d });
  }
  const top = [...tally.values()].sort((a, b) => b.n - a.n)[0].d;
  const others = [...new Set(doses.map((x) => x.d.raw))].filter((r) => r !== top.raw);
  return { dose: top, others };
}

// ── حقول النموذج الناتجة ────────────────────────────────────────────
export interface ScanFields {
  name?: string;
  product_type?: ProductType;
  active_ingredient?: string;
  concentration?: string;
  moa_code?: string;
  phi_days?: number;
  bio_species?: string;
  default_dose?: number;
  default_dose_unit?: Dose['unit'];
  targets?: string;
  manufacturer?: string;
  eg_reg_no?: string;
  eg_registered_crops?: string;
  is_bio?: boolean;
  notes?: string;
}

export type FieldSource = 'label' | 'book' | 'registry';
export interface ScanResult {
  fields: ScanFields;
  /** مصدر كل حقل: من العبوة مباشرة، أو من كتاب التوصيات، أو من سجل المواد */
  sources: Partial<Record<keyof ScanFields, FieldSource>>;
  candidates: BookCandidate[];
  chosen: BookCandidate | null;
  substances: Substance[];
  warnings: string[];
  /** حقول مهمة لم تُقرأ */
  missing: string[];
}

export const FIELD_LABEL: Record<keyof ScanFields, string> = {
  name: 'الاسم التجاري', product_type: 'النوع', active_ingredient: 'المادة الفعالة', concentration: 'التركيز والمستحضر',
  moa_code: 'مجموعة IRAC/FRAC', phi_days: 'فترة الأمان', bio_species: 'النوع العلمي', default_dose: 'الجرعة', default_dose_unit: 'وحدة الجرعة',
  targets: 'الآفات المستهدفة', manufacturer: 'الشركة', eg_reg_no: 'رقم التسجيل', eg_registered_crops: 'المحاصيل المسجّلة',
  is_bio: 'منتج حيوي', notes: 'ملاحظات',
};

export interface BuildInput {
  /** نصوص كل الصور المقروءة (مفصولة) */
  texts: string[];
  book: BookIndex | null;
  substances: Substance[];
  /** اختيار المهندس لمرشح معيّن من الكتاب (وإلا نختار الأفضل لو كان مطابقًا بثقة) */
  chosenReg?: string | null;
  /** منتجات موجودة مسبقًا في الكتالوج لتنبيه التكرار */
  existing?: Pick<Product, 'name' | 'eg_reg_no'>[];
}

/** يبني الحقول المقترحة. لا يخترع شيئًا: كل حقل إمّا مقروء من العبوة أو منقول من الكتاب/السجل بمصدر معلن */
export function buildScan({ texts, book, substances, chosenReg, existing = [] }: BuildInput): ScanResult {
  const text = texts.join('\n\n');
  const fields: ScanFields = {};
  const sources: ScanResult['sources'] = {};
  const warnings: string[] = [];
  const put = <K extends keyof ScanFields>(k: K, v: ScanFields[K] | undefined, src: FieldSource) => {
    if (v == null || v === '' || fields[k] != null) return;
    fields[k] = v;
    sources[k] = src;
  };

  const conc = findConcentration(text);
  const subs = findSubstances(text, substances);
  // أسماء كيميائية على الملصق ← الاسم الشائع (من السجل إن وُجد)
  const extraNames: string[] = [];
  for (const n of findIupac(text)) {
    const hit = substances.find((x) => key(x.name_en) === key(n));
    if (hit) { if (!subs.includes(hit)) subs.push(hit); } else extraNames.push(n);
  }
  const bio = findBio(text);
  const candidates = book ? matchBook(text, book, substances) : [];

  let chosen: BookCandidate | null = null;
  if (chosenReg != null) chosen = chosenReg ? candidates.find((c) => c.product.reg === chosenReg) ?? null : null;
  else if (candidates[0] && candidates[0].score >= 0.85 && (!candidates[1] || candidates[0].score - candidates[1].score >= 0.1)) chosen = candidates[0];

  // 1) المقروء من العبوة نفسها
  put('eg_reg_no', findRegNo(text), 'label');
  put('concentration', conc.concentration, 'label');
  put('moa_code', findMoa(text), 'label');
  put('manufacturer', findManufacturer(text), 'label');
  if (subs.length || extraNames.length) put('active_ingredient', [...subs.map((s) => s.name_ar ?? s.name_en), ...extraNames].join(' + '), 'label');
  if (extraNames.length) warnings.push(`المادة الفعالة ${extraNames.join('، ')} مش موجودة في سجل المواد — فحوصات التصدير مش هتشملها.`);
  // تركيز مقروء بدون نسبة لا يمنع تركيز الكتاب الكامل
  if (chosen && !/%/.test(fields.concentration ?? '')) { delete fields.concentration; delete sources.concentration; }

  // 2) من الكتاب (اسم تجاري + رقم تسجيل + جرعة + فترة أمان + محاصيل)
  if (chosen) {
    const p = chosen.product;
    put('name', p.n, 'book');
    put('eg_reg_no', p.reg, 'book');
    put('concentration', `${p.c.replace(/\s+/g, '')} ${p.f}`.replace('%', '%'), 'book');
    put('active_ingredient', activeLabel(p.a, substances), 'book');
    const phis = p.u.map((u) => u.phi).filter((x): x is number => x != null);
    if (phis.length) put('phi_days', Math.max(...phis), 'book');
    const { dose, others } = bookDose(p);
    if (dose) { put('default_dose', dose.value, 'book'); put('default_dose_unit', dose.unit, 'book'); }
    const crops = [...new Set(p.u.map((u) => CROP_AR[u.crop] ?? u.crop))];
    put('eg_registered_crops', crops.join('، '), 'book');
    const pests = [...new Set(p.u.map((u) => u.pest).filter(Boolean))].slice(0, 8);
    put('targets', pests.join('، '), 'book');
    const note = [`البيانات من مسح العبوة + ${book?.source ?? 'كتاب التوصيات المعتمدة 2026'}`];
    if (others.length) note.push(`جرعات أخرى في الكتاب: ${others.slice(0, 4).join(' | ')}`);
    if (phis.length > 1) note.push(`فترة الأمان المسجلة هي الأعلى بين استخدامات الكتاب (${Math.min(...phis)}–${Math.max(...phis)} يوم)`);
    put('notes', note.join('. '), 'book');
  }

  // 3) من سجل المواد (نوع المنتج + مجموعة المادة)
  const regSubs = subs.length ? subs : chosen ? findSubstances(chosen.product.a, substances) : [];
  if (!subs.length && regSubs.length) put('active_ingredient', regSubs.map((s) => s.name_ar ?? s.name_en).join(' + '), 'registry');
  const sType = typeOfSubstances(regSubs);
  if (bio.type) {
    put('product_type', bio.type, 'label');
    put('is_bio', true, 'label');
    if (bio.species) put('bio_species', bio.species, 'label');
  } else {
    const t = typeFromWords(text) ?? sType;
    put('product_type', t, typeFromWords(text) ? 'label' : 'registry');
  }
  if (!fields.moa_code && regSubs.length === 1 && !extraNames.length && regSubs[0].moa_code) put('moa_code', regSubs[0].moa_code, 'registry');

  // ── تحذيرات وملاحظات الجودة ────────────────────────────────────
  if (bio.microbial) warnings.push('يبدو منتجًا حيويًا (كائن دقيق) — راجع النوع والاسم العلمي.');
  if (bio.species && !fields.name) warnings.push('الاسم التجاري لم يُقرأ بوضوح — اكتبه من العبوة.');
  if (!chosen && candidates.length) warnings.push('وجدت منتجات قريبة في كتاب التوصيات — اختر المنتج الصحيح لو موجود لتتعبأ الجرعة وفترة الأمان.');
  if (!chosen && !candidates.length && !bio.type) warnings.push('المنتج غير موجود في كتاب التوصيات (طماطم/فلفل/باذنجان/خيار/فاصوليا) — فترة الأمان والجرعة لازم تُراجع من ملصق العبوة.');
  const nm = fields.name ? key(fields.name) : '';
  const dup = existing.find((e) => (nm && key(e.name) === nm) || (fields.eg_reg_no && e.eg_reg_no === fields.eg_reg_no));
  if (dup) warnings.push(`يوجد في القائمة مادة بنفس الاسم/رقم التسجيل: «${dup.name}».`);
  if (fields.eg_reg_no && fields.eg_reg_no.length < 3) delete fields.eg_reg_no;

  const needed: [keyof ScanFields, boolean][] = [
    ['name', true], ['concentration', !bio.type], ['active_ingredient', !bio.type], ['phi_days', !bio.type], ['default_dose', true],
  ];
  const missing = needed.filter(([k, req]) => req && fields[k] == null).map(([k]) => FIELD_LABEL[k]);

  return { fields, sources, candidates, chosen, substances: regSubs, warnings, missing };
}

export { findDoses, soft };
