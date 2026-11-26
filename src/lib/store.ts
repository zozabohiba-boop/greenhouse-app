// حساب أرصدة المخزن من الحركات (بدون اعتماد على الواجهة — قابل للاختبار)
import { alive } from './repo';
import type { Row } from './schema';

type Movement = Row<'stock_movements'>;
const IN_TYPES = ['receipt', 'return', 'adjust_in', 'transfer_in'];
export const sign = (t: string) => (IN_TYPES.includes(t) ? 1 : -1);

export interface Balance {
  product_id: string;
  warehouse_id: string;
  qty: number;
  unit: string;
  batches: { batch: string; qty: number; expiry: string | null }[];
}

/** الرصيد لكل صنف في كل مخزن + الرصيد لكل تشغيلة (للصرف بالأقرب انتهاءً) */
export function computeBalances(moves: Movement[]): Balance[] {
  const map = new Map<string, Balance & { b: Map<string, { qty: number; expiry: string | null }> }>();
  for (const m of moves.filter(alive).sort((a, b) => (a.moved_on < b.moved_on ? -1 : 1))) {
    const k = `${m.product_id}|${m.warehouse_id}`;
    if (!map.has(k)) map.set(k, { product_id: m.product_id, warehouse_id: m.warehouse_id, qty: 0, unit: m.unit, batches: [], b: new Map() });
    const x = map.get(k)!;
    const d = Number(m.qty) * sign(m.movement_type);
    x.qty += d;
    x.unit = m.unit || x.unit;
    const bk = m.batch_no?.trim() || '—';
    if (!x.b.has(bk)) x.b.set(bk, { qty: 0, expiry: null });
    const bb = x.b.get(bk)!;
    bb.qty += d;
    if (m.expiry_date && sign(m.movement_type) > 0) bb.expiry = !bb.expiry || m.expiry_date < bb.expiry ? m.expiry_date : bb.expiry;
  }
  return [...map.values()].map(({ b, ...x }) => ({
    ...x,
    qty: Math.round(x.qty * 1000) / 1000,
    batches: [...b.entries()].map(([batch, v]) => ({ batch, qty: Math.round(v.qty * 1000) / 1000, expiry: v.expiry }))
      .filter((v) => v.qty > 0.0005)
      .sort((a, b2) => (a.expiry ?? '9999') < (b2.expiry ?? '9999') ? -1 : 1),
  }));
}

