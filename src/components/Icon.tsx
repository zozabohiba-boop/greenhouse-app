const P: Record<string, string> = {
  plant: 'M12 21v-9m0 0c0-4 3-7 7-7 0 4-3 7-7 7Zm0 3c0-3.5-2.6-6-6-6 0 3.4 2.6 6 6 6Z',
  bug: 'M8 7a4 4 0 0 1 8 0M7 10h10v4a5 5 0 0 1-10 0v-4Zm5 0v9M3 13h4m10 0h4M4 8l3 2m13-2-3 2M4 19l3-2m13 2-3-2',
  spray: 'M9 8h6v12a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V8Zm1-4h4v4h-4zM14 5h3m2-2 1 1m0 3 1 0m-2 3 1 1',
  sync: 'M20 11a8 8 0 0 0-14.3-4.6L4 8m0-5v5h5M4 13a8 8 0 0 0 14.3 4.6L20 16m0 5v-5h-5',
  plus: 'M12 5v14M5 12h14',
  chevron: 'M14 6l-6 6 6 6',
  back: 'M10 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m6.5-9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 19v-1a4 4 0 0 0-3-3.9M15.5 3.1a3.5 3.5 0 0 1 0 6.8',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11',
  house: 'M3 20V11c0-4.4 4-8 9-8s9 3.6 9 8v9M3 20h18M9 20v-6h6v6',
  ruler: 'M4 17 17 4l3 3L7 20l-3-3Zm4-4 2 2m1-5 2 2m1-5 2 2',
  close: 'M6 6l12 12M18 6 6 18',
  alert: 'M12 9v4m0 4h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  cloudoff: 'M3 3l18 18M8.5 8.6A5 5 0 0 0 6 18h11m3.3-2.4A4 4 0 0 0 17 10h-1.3A6 6 0 0 0 10 5.6',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4',
  chart: 'M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-3',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4V8Zm8 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
  trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3',
  flag: 'M5 21V4m0 0h11l-2 4 2 4H5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2',
  shield: 'M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4',
  note: 'M5 4h14v12l-4 4H5V4Zm10 16v-4h4M8 9h8m-8 4h5',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4.3-4.3',
  box: 'M4 8l8-4 8 4v8l-8 4-8-4V8Zm0 0 8 4m0 0 8-4m-8 4v8',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
  layers: 'M12 3 2 8l10 5 10-5-10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5',
  file: 'M14 3H6v18h12V7l-4-4Zm0 0v4h4M9 12h6m-6 4h6',
  upload: 'M12 16V4m0 0-5 5m5-5 5 5M4 16v4h16v-4',
  download: 'M12 4v12m0 0-5-5m5 5 5-5M4 16v4h16v-4',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-14v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  wind: 'M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8',
  thermo: 'M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0ZM12 9v7',
  cloud: 'M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18Z',
  pin: 'M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  folder: 'M3 6h6l2 2h10v11H3V6Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-11v6m0-9h.01',
};

export function Icon({ name, size = 24, stroke = 2 }: { name: keyof typeof P | string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] ?? ''} />
    </svg>
  );
}
