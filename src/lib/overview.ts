// اللوحة العامة للمزرعة (للقراءة فقط): أرقام مجمّعة من السيرفر (farm_overview)
// تُحفظ على الجهاز وتُعرض أوفلاين بتاريخ آخر تحديث.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { todayLocal } from './dates';

export interface OverviewGh {
  id: string;
  scouted: boolean;
  worst: number;
  has_cycle: boolean;
  registered: boolean;
  balance: string | null;
  harvest_allowed_from: string | null;
  last: Record<string, string>;
  open_recs: number;
}
export interface Overview {
  farm_id: string;
  week_start: string;
  generated_at: string;
  totals: {
    greenhouses: number;
    active_cycles: number;
    scouted: number;
    registered: number;
    worst: number;
    in_phi: number;
    activities_week: Record<string, number>;
    open_recs: Record<string, number>;
  };
  top_pests: { name: string; worst: number; greenhouses: number }[];
  greenhouses: OverviewGh[];
}

const key = (farmId: string) => `gh.overview.${farmId}`;

export function cachedOverview(farmId: string | null): Overview | null {
  if (!farmId) return null;
  try {
    const raw = localStorage.getItem(key(farmId));
    return raw ? (JSON.parse(raw) as Overview) : null;
  } catch {
    return null;
  }
}

export function useOverview(farmId: string | null, enabled = true) {
  const [data, setData] = useState<Overview | null>(() => cachedOverview(farmId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!farmId || !enabled) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    setLoading(true);
    const { data: d, error: e } = await supabase.rpc('farm_overview', { p_farm: farmId, p_date: todayLocal() });
    setLoading(false);
    if (e) {
      setError('تعذر تحديث اللوحة العامة');
      return;
    }
    setError(null);
    const ov = d as unknown as Overview;
    setData(ov);
    try { localStorage.setItem(key(farmId), JSON.stringify(ov)); } catch { /* المساحة ممتلئة */ }
  }, [farmId, enabled]);
  useEffect(() => {
    setData(cachedOverview(farmId));
    void refresh();
  }, [farmId, refresh]);
  useEffect(() => {
    const on = () => void refresh();
    window.addEventListener('online', on);
    return () => window.removeEventListener('online', on);
  }, [refresh]);
  return { data, loading, error, refresh };
}
