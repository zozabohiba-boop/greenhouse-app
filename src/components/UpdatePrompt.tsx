import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/** يسجّل الـ Service Worker، ولما ينزل إصدار جديد يعرض زر تحديث بدل ما يقطع شغل المهندس */
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;

export function UpdatePrompt() {
  const [need, setNeed] = useState(false);
  useEffect(() => {
    if (updateSW || !('serviceWorker' in navigator)) return;
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh: () => setNeed(true),
      onRegisteredSW: (_url, reg) => {
        if (reg) setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      },
    });
  }, []);
  if (!need) return null;
  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <div className="banner info">
        <span className="grow">نسخة جديدة من التطبيق جاهزة.</span>
        <button className="btn primary" onClick={() => updateSW?.(true)}>تحديث الآن</button>
      </div>
    </div>
  );
}
