// جلب توقعات الطقس عبر دالة weather على السيرفر، مع آخر نسخة محفوظة على الجهاز للعمل بدون إنترنت
import { useCallback, useEffect, useState } from 'react';
import { getMeta, setMeta } from './db';
import { supabase } from './supabase';
import type { Forecast } from './weather';

// ── جلب التوقعات مع ذاكرة على الجهاز ───────────────────────────────
export interface WeatherState {
  forecast: Forecast | null;
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
}

const FRESH_MS = 60 * 60 * 1000;

export function useForecast(farmId: string | null, coords: { lat: number; lon: number } | null) {
  const [st, setSt] = useState<WeatherState>({ forecast: null, fetchedAt: null, loading: false, error: null });
  const key = `weather:${farmId}`;

  const load = useCallback(async (force = false) => {
    if (!farmId || !coords) return;
    const cached = await getMeta<{ forecast: Forecast; fetchedAt: string; lat: number; lon: number } | null>(key, null);
    const sameSpot = cached && Math.abs(cached.lat - coords.lat) < 1e-4 && Math.abs(cached.lon - coords.lon) < 1e-4;
    if (cached && sameSpot) setSt((s) => ({ ...s, forecast: cached.forecast, fetchedAt: cached.fetchedAt }));
    const stale = !cached || !sameSpot || Date.now() - Date.parse(cached.fetchedAt) > FRESH_MS;
    if (!force && !stale) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSt((s) => ({ ...s, error: cached && sameSpot ? null : 'التوقعات تحتاج اتصال بالإنترنت أول مرة' }));
      return;
    }
    setSt((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase.functions.invoke('weather', { body: { farm_id: farmId, force } });
    if (error || !data?.payload) {
      let code = '';
      try { code = (await (error as any)?.context?.json())?.error ?? ''; } catch { /* ignore */ }
      setSt((s) => ({
        ...s, loading: false,
        error: code === 'no_location' ? 'حدّد إحداثيات الموقع أولًا' : 'تعذر تحديث التوقعات الآن — المعروض آخر تحديث محفوظ',
      }));
      return;
    }
    const fetchedAt = data.fetched_at ?? new Date().toISOString();
    await setMeta(key, { forecast: data.payload, fetchedAt, lat: coords.lat, lon: coords.lon });
    setSt({ forecast: data.payload as Forecast, fetchedAt, loading: false, error: null });
  }, [farmId, coords?.lat, coords?.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSt({ forecast: null, fetchedAt: null, loading: false, error: null });
    void load(false);
  }, [load]);

  return { ...st, refresh: () => load(true) };
}
