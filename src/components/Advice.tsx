// لوحة "خيارات المكافحة المقترحة" — تظهر في ملاحظة الفحص وتتحدث مع اختيار الشدة
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { alive } from '../lib/repo';
import { activeCycle, shadowProducts } from '../lib/hooks';
import { moaHistory } from '../lib/ipm';
import { todayLocal } from '../lib/dates';
import { SEVERITY } from '../lib/labels';
import { adviceText, buildAdvice, type Advice } from '../lib/advice';
import { Icon } from './Icon';

/** يحمّل كل ما تحتاجه التوصية لآفة في صوبة */
export function useAdviceData(farmId: string | null, pestId: string | undefined, ghId: string | undefined) {
  return useLiveQuery(async () => {
    if (!farmId || !pestId) return null;
    const [pest, controls, cycles, crops, acts, ags, aps] = await Promise.all([
      db.pests.get(pestId),
      db.pest_controls.where('pest_id').equals(pestId).toArray(),
      ghId ? db.crop_cycles.where('greenhouse_id').equals(ghId).toArray() : Promise.resolve([]),
      db.crops.toArray(),
      db.activities.where('farm_id').equals(farmId).toArray(),
      db.activity_greenhouses.where('farm_id').equals(farmId).toArray(),
      db.activity_products.where('farm_id').equals(farmId).toArray(),
    ]);
    if (!pest) return null;
    const allProds = await db.products.toArray();
    // مادة الكتالوج العام تُستبدل بنسخة المزرعة (بفترة الأمان المحلية) لو موجودة
    const visible = shadowProducts(allProds, farmId);
    const byName = new Map(visible.map((p) => [p.name.trim(), p]));
    const byId = new Map(allProds.map((p) => [p.id, p]));
    const resolved = controls.map((c) => {
      const p = byId.get(c.product_id);
      const v = p ? byName.get(p.name.trim()) : undefined;
      return v ? { ...c, product_id: v.id } : c;
    });
    const cycle = ghId ? activeCycle(cycles, ghId) : undefined;
    const cropCode = cycle ? crops.find((c) => c.id === cycle.crop_id)?.code ?? null : null;
    const history = ghId ? moaHistory(ghId, acts, ags, aps, allProds) : [];
    return { pest, controls: resolved.filter(alive), products: visible, cropCode, history };
  }, [farmId, pestId, ghId]);
}

export function AdvicePanel({ pestId, ghId, severity, obsId }: { pestId: string; ghId?: string; severity: number | null; obsId?: string }) {
  const { farmId, can } = useApp();
  const nav = useNavigate();
  const data = useAdviceData(farmId, pestId, ghId);
  const [open, setOpen] = useState<boolean | null>(null);
  if (!data) return null;
  const advice = buildAdvice({ ...data, severity, farmId, today: todayLocal() });
  if (!advice.groups.length && !advice.guidance) return null;
  const expanded = open ?? advice.needsAction;
  const tone = severity == null ? 'info' : advice.needsAction ? 'warn' : 'ok';
  const head = severity == null
    ? `حد التدخل: ${SEVERITY[advice.threshold].label}`
    : advice.needsAction
      ? `تجاوزت حد التدخل (${SEVERITY[advice.threshold].label}) — خيارات المكافحة المقترحة`
      : `أقل من حد التدخل (${SEVERITY[advice.threshold].label}) — استمر في المتابعة`;

  return (
    <section className={`advice ${tone}`} aria-label="خيارات المكافحة المقترحة">
      <button type="button" className="advice-head" aria-expanded={expanded} onClick={() => setOpen(!expanded)}>
        <Icon name={advice.needsAction ? 'alert' : 'info'} size={18} />
        <span className="grow">{head}</span>
        <Icon name="chevron" size={18} />
      </button>
      {advice.offCrop && <p className="advice-note">هذه الآفة غير معتادة على محصول هذه الصوبة — تأكد من التشخيص.</p>}
      {expanded && <AdviceBody advice={advice} />}
      {expanded && can.advise && obsId && advice.groups.length > 0 && (
        <button type="button" className="btn block" onClick={() => {
          const body = adviceText(data.pest, severity, advice);
          const qs = new URLSearchParams({ obs: obsId, pest: pestId, body });
          if (ghId) qs.set('gh', ghId);
          nav(`/recs/new?${qs.toString()}`);
        }}><Icon name="note" size={20} /> حوّلها لتوصية</button>
      )}
    </section>
  );
}

export function AdviceBody({ advice }: { advice: Advice }) {
  return (
    <div className="advice-body">
      {advice.guidance && <p className="advice-guide"><b>إجراءات زراعية:</b> {advice.guidance}</p>}
      {advice.groups.map((g) => (
        <div key={g.approach} className="advice-group" data-approach={g.approach}>
          <h4>{g.label}</h4>
          <ul>
            {g.items.slice(0, 8).map((i) => (
              <li key={i.product.id} data-repeated={i.repeated >= 2 || undefined}>
                <b>{i.product.name}</b>
                {i.dose && <span className="dose num">{i.dose}</span>}
                {i.product.moa_code && <span className="moa" title="مجموعة طريقة التأثير IRAC/FRAC">{i.product.moa_code}</span>}
                {i.repeated >= 2 && <span className="chip warn">استُخدمت {i.repeated} مرات متتالية — بدّل</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {advice.groups.some((g) => g.approach === 'chemical') && (
        <p className="advice-note">فترة الأمان والجرعة النهائية من ملصق العبوة المسجلة. الجرعات المعروضة من برنامج المكافحة المعتمد.</p>
      )}
    </div>
  );
}
