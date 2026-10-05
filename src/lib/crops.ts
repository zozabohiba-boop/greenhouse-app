// قيم مرجعية لتوازن النبات لكل محصول + حدود منطقية لاكتشاف أخطاء الإدخال
//
// الطماطم (قيم مرجعية منشورة):
//   - الاستطالة الأسبوعية 25–30 سم للنبات السليم — HAED / Plant data collection & interpretation
//   - سمك الساق: أقل من 8 مم = ثمري، أكثر من 12 مم = خضري — UVM, Balancing vegetative and reproductive growth
//   - بُعد الزهرة المتفتحة عن القمة: 5–8 سم = ثمري، أكثر من 13 سم = خضري — UVM (نفس المصدر)
// باقي المحاصيل: لا توجد قيم منشورة موحدة → يحددها الاستشاري حسب الصنف، والتطبيق يكتفي بالتنبيه
// لو القيمة خارج المدى المنطقي (غالبًا خطأ إدخال أو وحدة).

export interface Range { min: number; max: number }
export interface CropRef {
  /** قيم مرجعية مقترحة (إن وُجدت) */
  target?: { growth?: Range; stem?: Range; flowering?: Range; source: string };
  /** أعلى قيمة منطقية — فوقها غالبًا خطأ */
  plausible: { growthMax: number; stemMax: number; floweringMax: number };
}

export const CROP_REF: Record<string, CropRef> = {
  tomato: {
    target: {
      growth: { min: 25, max: 30 }, stem: { min: 8, max: 12 }, flowering: { min: 8, max: 13 },
      source: 'مراجع إرشادية للطماطم (HAED، جامعة فيرمونت) — تُضبط حسب الصنف والموسم',
    },
    plausible: { growthMax: 45, stemMax: 20, floweringMax: 60 },
  },
  pepper: { plausible: { growthMax: 30, stemMax: 20, floweringMax: 40 } },
  eggplant: { plausible: { growthMax: 35, stemMax: 25, floweringMax: 40 } },
  cucumber: { plausible: { growthMax: 70, stemMax: 20, floweringMax: 60 } },
  melon: { plausible: { growthMax: 70, stemMax: 20, floweringMax: 60 } },
  strawberry: { plausible: { growthMax: 10, stemMax: 40, floweringMax: 30 } },
};

type T = {
  weekly_growth_min_cm?: number | null; weekly_growth_max_cm?: number | null;
  stem_diameter_min_mm?: number | null; stem_diameter_max_mm?: number | null;
  flowering_height_min_cm?: number | null; flowering_height_max_cm?: number | null;
};

/** تنبيهات على قيم مستهدفة غير منطقية للمحصول */
export function targetWarnings(cropCode: string | null | undefined, cropName: string | null | undefined, t: T): string[] {
  const ref = cropCode ? CROP_REF[cropCode] : undefined;
  if (!ref) return [];
  const out: string[] = [];
  const name = cropName ?? '';
  const hi = (v: number | null | undefined, max: number) => v != null && Number(v) > max;
  if (hi(t.weekly_growth_max_cm, ref.plausible.growthMax) || hi(t.weekly_growth_min_cm, ref.plausible.growthMax))
    out.push(`الاستطالة الأسبوعية أعلى من المعتاد لمحصول ${name} (عادة أقل من ${ref.plausible.growthMax} سم/أسبوع). راجع الرقم أو الوحدة؛ القيمة الخاطئة تجعل حكم التوازن "ثمري" دائمًا.`);
  if (hi(t.stem_diameter_max_mm, ref.plausible.stemMax) || hi(t.stem_diameter_min_mm, ref.plausible.stemMax))
    out.push(`سمك الساق أعلى من المعتاد لمحصول ${name} (عادة أقل من ${ref.plausible.stemMax} مم).`);
  if (hi(t.flowering_height_max_cm, ref.plausible.floweringMax))
    out.push(`بُعد الزهرة عن القمة أعلى من المعتاد لمحصول ${name}.`);
  return out;
}
