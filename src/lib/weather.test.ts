import { describe, expect, it } from 'vitest';
import { analyzeDay, dli, nowIndex, parseCoords, vpd, waterNeed, type Forecast } from './weather';

/** يوم صيفي حار جاف: 22° ليلًا ← 39° الظهر، رطوبة 75% ← 18% */
function hotDay(date = '2026-07-10'): Forecast {
  const time: string[] = [];
  const T: number[] = [];
  const RH: number[] = [];
  const Td: number[] = [];
  const SW: number[] = [];
  for (let h = 0; h < 24; h++) {
    time.push(`${date}T${String(h).padStart(2, '0')}:00`);
    const sun = Math.max(0, Math.sin(((h - 6) / 13) * Math.PI));
    const t = 22 + 17 * sun;
    const rh = 75 - 57 * sun;
    T.push(t);
    RH.push(rh);
    Td.push(t - 8);
    SW.push(Math.round(950 * sun));
  }
  const n = time.length;
  return {
    latitude: 29.3, longitude: 30.8, utc_offset_seconds: 3 * 3600,
    hourly: {
      time, temperature_2m: T, relative_humidity_2m: RH, dew_point_2m: Td,
      vapour_pressure_deficit: T.map((t, i) => vpd(t, RH[i])),
      wind_speed_10m: Array(n).fill(8), wind_gusts_10m: Array(n).fill(20),
      shortwave_radiation: SW, precipitation: Array(n).fill(0), precipitation_probability: Array(n).fill(0),
    },
    daily: {
      time: [date], temperature_2m_max: [39], temperature_2m_min: [22], precipitation_sum: [0],
      precipitation_probability_max: [0], wind_speed_10m_max: [12], wind_gusts_10m_max: [22],
      shortwave_radiation_sum: [29], et0_fao_evapotranspiration: [7.4],
    },
  };
}

describe('agro-climate physics', () => {
  it('computes VPD with FAO-56 saturation pressure', () => {
    expect(vpd(25, 60)).toBeCloseTo(1.27, 2);
    expect(vpd(20, 100)).toBe(0);
    expect(vpd(35, 20)).toBeCloseTo(4.5, 1);
  });

  it('converts radiation to DLI and water need', () => {
    expect(dli(20)).toBeCloseTo(41.2, 1);
    expect(waterNeed(20, 70)).toEqual([2.8, 4.2]);
  });
});

describe('analyzeDay', () => {
  it('flags heat stress and high transpiration on a hot dry day', () => {
    const a = analyzeDay(hotDay(), 0, 70);
    expect(a.level).toBe('bad');
    expect(a.alerts.map((x) => x.key)).toEqual(expect.arrayContaining(['heat', 'vpd-high']));
    expect(a.alerts[0].level).toBe('bad');
    expect(a.heatHours).toBeGreaterThan(3);
    expect(a.water).toEqual(waterNeed(29, 70));
    expect(a.dliIn).toBeCloseTo((dli(29) * 70) / 100, 0);
  });

  it('finds early-morning spray windows only when cool and calm', () => {
    const a = analyzeDay(hotDay(), 0);
    expect(a.sprayWindows.length).toBeGreaterThan(0);
    expect(a.sprayWindows[0].from).toBe('06:00');
    for (const w of a.sprayWindows) expect(Number(w.from.slice(0, 2))).toBeLessThan(18);
  });

  it('flags humid nights as disease risk and stays calm on a mild day', () => {
    const f = hotDay();
    f.hourly.relative_humidity_2m = f.hourly.relative_humidity_2m.map((_, i) => (i < 8 || i > 19 ? 95 : 70));
    f.hourly.dew_point_2m = f.hourly.temperature_2m.map((t, i) => (i < 8 || i > 19 ? t! - 0.5 : t! - 6));
    const humid = analyzeDay(f, 0);
    expect(humid.humidHours).toBe(12);
    expect(humid.alerts.map((x) => x.key)).toEqual(expect.arrayContaining(['humid', 'dew']));

    const mild = hotDay();
    mild.daily.temperature_2m_max = [27];
    mild.hourly.temperature_2m = mild.hourly.temperature_2m.map((t) => 15 + (t! - 22) * 0.7);
    mild.daily.temperature_2m_min = [15];
    mild.hourly.relative_humidity_2m = mild.hourly.relative_humidity_2m.map(() => 65);
    mild.hourly.vapour_pressure_deficit = mild.hourly.temperature_2m.map((t) => vpd(t!, 65));
    mild.hourly.dew_point_2m = mild.hourly.temperature_2m.map((t) => t! - 6);
    expect(analyzeDay(mild, 0).level).toBe('ok');
  });
});

describe('helpers', () => {
  it('locates the current hour in the farm timezone', () => {
    const f = hotDay('2026-07-10');
    // 09:30 بتوقيت القاهرة (UTC+3) = 06:30 UTC
    expect(nowIndex(f, Date.parse('2026-07-10T06:30:00Z'))).toBe(9);
    expect(nowIndex(f, Date.parse('2026-07-12T06:30:00Z'))).toBe(-1);
  });

  it('parses coordinates and map links', () => {
    expect(parseCoords('29.308, 30.842')).toEqual({ lat: 29.308, lon: 30.842 });
    expect(parseCoords('29.308،30.842')).toEqual({ lat: 29.308, lon: 30.842 });
    expect(parseCoords('https://www.google.com/maps/@29.3081234,30.8421,15z')).toEqual({ lat: 29.308123, lon: 30.8421 });
    expect(parseCoords('https://maps.google.com/?q=29.3,30.8')).toEqual({ lat: 29.3, lon: 30.8 });
    expect(parseCoords('القاهرة')).toBeNull();
    expect(parseCoords('120, 30')).toBeNull();
  });
});
