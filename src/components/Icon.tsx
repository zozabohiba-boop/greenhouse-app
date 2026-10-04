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
};

export function Icon({ name, size = 24, stroke = 2 }: { name: keyof typeof P | string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] ?? ''} />
    </svg>
  );
}
