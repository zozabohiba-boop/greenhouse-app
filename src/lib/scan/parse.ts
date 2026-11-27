// استخراج حقول المنتج من نص العبوة المقروء (بدون مطابقة مع الكتاب — انظر match.ts)
import { digits, key, soft, fuzzyHas } from './text';
import type { Product, Substance } from '../catalog';

export type DoseUnit = NonNullable<Product['default_dose_unit']>;
export type ProductType = Product['product_type'];

export interface Dose { value: number; unit: DoseUnit; raw: string }

const FORMS = ['WP', 'WG', 'WDG', 'SC', 'EC', 'SL', 'SP', 'SG', 'SE', 'EW', 'FS', 'GR', 'DC', 'CS', 'OD', 'ME', 'DP', 'EWH', 'ZC', 'OF'] as const;

const FORM_AR: [RegExp, string][] = [
  [/كبسولات?.{0,2}معلق/, 'CS'],
  [/معلق.{0,2}مركز/, 'SC'],
  [/قابل.{0,3}للاستحلاب/, 'EC'],
  [/مسحوق.{0,3}قابل.{0,6}بلل|مسحوق.{0,3}قابل.{0,6}ابتلال/, 'WP'],
  [/حبيبات.{0,3}قابل.{0,3}للتشتت|حبيبات.{0,3}قابل.{0,3}للانتشار/, 'WG'],
  [/سائل.{0,3}قابل.{0,3}للذوبان/, 'SL'],
];

/** التركيز والمستحضر: "25 % WP" — يختار أول نسبة مرتبطة بشكل مستحضر، وإلا أول نسبة معقولة */
export function findConcentration(text: string): { concentration?: string; formulation?: string; percent?: string } {
  const t = digits(text);
  const alt = FORMS.join('|');
  // نسبة ثم شكل (حتى 12 حرف بينهما) أو العكس
  const m1 = new RegExp(`(\\d{1,3}(?:[.,]\\d{1,2})?)\\s*%\\s*(?:w\\/[wv]\\s*)?[-:]?\\s*(${alt})\\b`, 'i').exec(t);
  if (m1) return { percent: m1[1].replace(',', '.'), formulation: m1[2].toUpperCase(), concentration: `${m1[1].replace(',', '.')}% ${m1[2].toUpperCase()}` };
  const m2 = new RegExp(`\\b(${alt})\\b\\s*[-:]?\\s*(\\d{1,3}(?:[.,]\\d{1,2})?)\\s*%`, 'i').exec(t);
  if (m2) return { percent: m2[2].replace(',', '.'), formulation: m2[1].toUpperCase(), concentration: `${m2[2].replace(',', '.')}% ${m2[1].toUpperCase()}` };
  const k = key(t);
  let form: string | undefined;
  for (const [re, f] of FORM_AR) if (re.test(k)) { form = f; break; }
  if (!form) {
    const mf = new RegExp(`\\b(${alt})\\b`).exec(t);
    if (mf) form = mf[1];
  }
  const mp = /(\d{1,3}(?:[.,]\d{1,2})?)\s*%/.exec(t);
  const percent = mp ? mp[1].replace(',', '.') : undefined;
  if (percent && Number(percent) > 100) return { formulation: form };
  return { percent, formulation: form, concentration: percent || form ? [percent && `${percent}%`, form].filter(Boolean).join(' ') : undefined };
}

/** رقم التسجيل لدى لجنة المبيدات */
export function findRegNo(text: string): string | undefined {
  const t = digits(text);
  const m = /(?:رقم\s*التسجيل|تسجيل\s*رقم|Reg(?:istration)?\.?\s*(?:No|Number|#)?\.?)\s*[:\-–]?\s*(\d{3,5})\b/i.exec(t);
  return m?.[1];
}

const UNIT_RE = '(سم\\s*3|سم³|cm3|cc|ml|مل|كجم|kg|جم|جرام|gm|g|لتر|ل|L|l)';
const PER_RE = '(100\\s*(?:لتر|ل|l|liter|litre)|(?:1\\s*)?(?:لتر|ل|l)|فدان|feddan|ha|هكتار)';

/** يحوّل نص جرعة ("20 جم/100 لتر ماء") إلى قيمة ووحدة النظام */
export function parseDose(raw: string): Dose | undefined {
  const t = soft(raw).replace(/,/g, '.').replace(/ ?\/ ?/g, '/');
  if (/(تقاوي|بذور|بذره|seed)/.test(t)) return undefined; // معاملة بذور ليست جرعة رش
  const re = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${UNIT_RE}\\s*(?:/|لكل|per)\\s*${PER_RE}`, 'i');
  const m = re.exec(t);
  if (!m) return undefined;
  const v = Number(m[1]);
  if (!Number.isFinite(v) || v <= 0) return undefined;
  const u = m[2].toLowerCase().replace(/\s+/g, '').replace('³', '3');
  const p = m[3].toLowerCase().replace(/\s+/g, '').replace(/^1(?!00)/, '');
  const vol = /^(سم3|سم³|cm3|cc|ml|مل)$/.test(u) ? 'ml' : /^(لتر|ل|l)$/.test(u) ? 'l' : /^(كجم|kg)$/.test(u) ? 'kg' : /^(جم|جرام|gm|g)$/.test(u) ? 'g' : '';
  const per = p.startsWith('100') ? '100l' : /^(لتر|ل|l)/.test(p) ? 'l' : /^(فدان|feddan)/.test(p) ? 'fed' : /^(ha|هكتار)/.test(p) ? 'ha' : '';
  const unit = ({
    'ml|l': 'ml_per_l', 'g|l': 'g_per_l', 'ml|100l': 'ml_per_100l', 'g|100l': 'g_per_100l',
    'l|fed': 'l_per_feddan', 'kg|fed': 'kg_per_feddan', 'ml|fed': 'ml_per_feddan', 'g|fed': 'g_per_feddan',
    'l|ha': 'l_per_ha', 'kg|ha': 'kg_per_ha',
  } as Record<string, DoseUnit>)[`${vol}|${per}`];
  return unit ? { value: v, unit, raw } : undefined;
}

/** كل الجرعات المكتوبة على العبوة */
export function findDoses(text: string): Dose[] {
  const out: Dose[] = [];
  const t = digits(text).replace(/\n+/g, ' ');
  const re = new RegExp(`\\d+(?:[.,]\\d+)?\\s*${UNIT_RE}\\s*(?:/|لكل|per)\\s*${PER_RE}`, 'gi');
  for (const m of t.matchAll(re)) {
    const d = parseDose(m[0].replace(',', '.'));
    if (d) out.push(d);
  }
  return out;
}

// ── المنتجات الحيوية (أعداء حيوية وكائنات مفيدة) ──────────────────────
const BIO: { re: RegExp; species: string; type: ProductType }[] = [
  { re: /swirsk/i, species: 'Amblyseius swirskii', type: 'biocontrol_agent' },
  { re: /cucumeris/i, species: 'Neoseiulus cucumeris', type: 'biocontrol_agent' },
  { re: /californicus/i, species: 'Neoseiulus californicus', type: 'biocontrol_agent' },
  { re: /(phytoseiulus|persimilis)/i, species: 'Phytoseiulus persimilis', type: 'biocontrol_agent' },
  { re: /(orius|laevigatus)/i, species: 'Orius laevigatus', type: 'biocontrol_agent' },
  { re: /(encarsia|formosa)/i, species: 'Encarsia formosa', type: 'biocontrol_agent' },
  { re: /(eretmocerus|mundus)/i, species: 'Eretmocerus mundus', type: 'biocontrol_agent' },
  { re: /(macrolophus|pygmaeus|caliginosus)/i, species: 'Macrolophus pygmaeus', type: 'biocontrol_agent' },
  { re: /(aphidius|colemani|ervi)/i, species: 'Aphidius colemani', type: 'biocontrol_agent' },
  { re: /(aphidoletes|aphidimyza)/i, species: 'Aphidoletes aphidimyza', type: 'biocontrol_agent' },
  { re: /(chrysoperla|chrysopa)/i, species: 'Chrysoperla carnea', type: 'biocontrol_agent' },
  { re: /(dacnusa|diglyphus)/i, species: 'Diglyphus isaea', type: 'biocontrol_agent' },
  { re: /trichogramma/i, species: 'Trichogramma spp.', type: 'biocontrol_agent' },
  { re: /(bombus|terrestris)/i, species: 'Bombus terrestris', type: 'pollinator' },
  { re: /(سويرسكي|سويرسكى|امبليسيوس|أمبليسيوس)/, species: 'Amblyseius swirskii', type: 'biocontrol_agent' },
];

/** كائنات دقيقة/بيولوجية أخرى (مبيدات ميكروبية) — نوع المنتج يبقى «عدو حيوي» ويُترك للمهندس تعديله */
const MICROBIAL = /(bacillus|thuringiensis|beauveria|metarhizium|trichoderma|paecilomyces|verticillium|lecanicillium|pseudomonas|streptomyces|بكتيريا|فطر مفيد)/i;

export function findBio(text: string): { species?: string; type?: ProductType; microbial?: boolean } {
  for (const b of BIO) if (b.re.test(text)) return { species: b.species, type: b.type };
  if (MICROBIAL.test(text)) return { microbial: true, type: 'biocontrol_agent' };
  return {};
}

const TYPE_BY_CLASS: [RegExp, ProductType][] = [
  [/nematic/i, 'nematicide'],
  [/acaric|miticid/i, 'acaricide'],
  [/insectic/i, 'insecticide'],
  [/fungic/i, 'fungicide'],
  [/bacteric/i, 'bactericide'],
  [/herbic/i, 'herbicide'],
];

export function typeOfSubstances(subs: Substance[]): ProductType | undefined {
  const classes = subs.flatMap((s) => s.classes ?? []);
  for (const [re, t] of TYPE_BY_CLASS) if (classes.some((c) => re.test(c))) return t;
  return undefined;
}

/** كلمات تدل على نوع المنتج مكتوبة على العبوة */
export function typeFromWords(text: string): ProductType | undefined {
  const k = key(text);
  if (/مبيد\s*(فطري|فطريات)|fungicide/.test(k)) return 'fungicide';
  if (/مبيد\s*(نيماتودا|نيماتوده)|nematicide/.test(k)) return 'nematicide';
  if (/مبيد\s*(اكاروسي|اكاروس)|acaricide|miticide/.test(k)) return 'acaricide';
  if (/مبيد\s*(حشري|حشرات)|insecticide/.test(k)) return 'insecticide';
  if (/مبيد\s*(بكتيري|بكتريا)|bactericide/.test(k)) return 'bactericide';
  if (/مبيد\s*(حشائش|اعشاب)|herbicide/.test(k)) return 'herbicide';
  if (/(سماد|npk|fertili[sz]er)/.test(k)) return 'fertilizer';
  return undefined;
}

/** رموز IRAC/FRAC على العبوة: "IRAC 1B" / "FRAC M5" / "Group 4A" */
export function findMoa(text: string): string | undefined {
  const m = /(?:IRAC|FRAC|HRAC|Group|مجموعة)\s*[:\-]?\s*([0-9]{1,2}[A-Z]?|M\d{1,2}|U\d{0,2}|P\d{1,2})\b/.exec(digits(text));
  return m?.[1];
}

/** شركة مصنّعة/موزّعة: سطر بعد "تصنيع/إنتاج/Manufactured by/Produced by" */
export function findManufacturer(text: string): string | undefined {
  const lines = digits(text).split(/\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const m = /^(?:Manufactured|Produced|Formulated|Distributed|Marketed|Imported)\s+by\s*[:\-]?\s*(.*)$/i.exec(lines[i])
      || /^(?:تصنيع|إنتاج|انتاج|شركة|تسويق|توزيع)\s*[:\-]?\s*(.*)$/.exec(lines[i]);
    if (!m) continue;
    const rest = (m[1] || lines[i + 1] || '').replace(/[|_]+/g, ' ').trim();
    if (rest.length >= 3 && rest.length <= 60 && /\p{L}{3}/u.test(rest)) return rest;
  }
  return undefined;
}

/** المواد الفعالة من سجلنا المذكورة في النص (عربي/إنجليزي) */
export function findSubstances(text: string, substances: Substance[]): Substance[] {
  const out: Substance[] = [];
  const hay = key(text);
  const cand = substances
    .flatMap((s) => [s.name_en, s.name_ar].filter((n): n is string => !!n).map((n) => ({ n, s })))
    .sort((a, b) => key(b.n).length - key(a.n).length);
  let rest = hay;
  for (const { n, s } of cand) {
    if (out.includes(s)) continue;
    if (fuzzyHas(rest, n)) {
      out.push(s);
      const kn = key(n);
      rest = rest.replace(kn, ' ');
    }
  }
  return out;
}

/** أسماء كيميائية (IUPAC) تُكتب على الملصقات بدل الاسم الشائع. أجزاء مميزة فقط، ولا نخمّن ما لا نعرفه */
const IUPAC: { frag: string; name: string; also?: string }[] = [
  { frag: '2cyano2methoxyiminoacetyl3ethylurea', name: 'cymoxanil' },
  { frag: 'methoxyacetylN2,6xylyldlalaninate', name: 'metalaxyl' },
  { frag: 'methoxyacetylN2,6xylyldalaninate', name: 'metalaxyl-M' },
  { frag: 'methoxyacetylN2,6xylylralaninate', name: 'metalaxyl-M' },
  { frag: 'manganeseethylenebis', name: 'mancozeb', also: 'zinc' },
  { frag: '6chloro3pyridylmethylNnitroimidazolidin', name: 'imidacloprid' },
  { frag: 'N2cyanoN1methylacetamidine', name: 'acetamiprid' },
  { frag: '5methyl135oxadiazinan', name: 'thiamethoxam' },
  { frag: '2cyanophenoxypyrimidin4yloxy', name: 'azoxystrobin' },
  { frag: '44dimethyl3--1h124triazol1ylmethylpentan3ol', name: 'tebuconazole' },
  { frag: '2oxo13thiazolidin3yl', name: 'fosthiazate' },
];
const squash = (t: string) => t.toLowerCase().replace(/[^a-z0-9,]/g, '');

/** مواد فعالة مذكورة بأسمائها الكيميائية: يُرجع الاسم الشائع */
export function findIupac(text: string): string[] {
  const t = squash(text);
  const out: string[] = [];
  for (const e of IUPAC) {
    const f = squash(e.frag).replace(/-/g, '');
    if (t.includes(f) && (!e.also || t.includes(e.also)) && !out.includes(e.name)) out.push(e.name);
  }
  // metalaxyl-M يطابق جزءًا من metalaxyl العادي؛ نفضّل الأدق إن وُجدا
  return out.length > 1 && out.includes('metalaxyl') && out.includes('metalaxyl-M') ? out.filter((n) => n !== 'metalaxyl-M') : out;
}
