import { useState, useSyncExternalStore } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { discardRejected, pendingSummary, syncNow, syncStore } from '../lib/sync';
import { relativeTime } from '../lib/dates';
import { db } from '../lib/db';
import { useApp } from '../app/context';
import { Sheet } from './Sheet';
import { Icon } from './Icon';

const TABLE_LABEL: Record<string, string> = {
  greenhouses: 'صوبة', crop_cycles: 'دورة زراعية', reference_plants: 'نبات مرجعي', balance_targets: 'قيم مستهدفة',
  crop_registration_sessions: 'جلسة تسجيل', plant_measurements: 'قياس نبات', scouting_sessions: 'جولة فحص',
  scouting_observations: 'ملاحظة فحص', activities: 'معاملة', activity_greenhouses: 'صوبة معاملة',
  activity_products: 'مادة معاملة', recommendations: 'توصية', varieties: 'صنف', pests: 'آفة', products: 'منتج',
  operation_types: 'عملية', attachments: 'صورة',
};

export function useSync() {
  const s = useSyncExternalStore(syncStore.subscribe, syncStore.get);
  // تُعاد القراءة مع أي تغيير في القاعدة المحلية
  const summary = useLiveQuery(() => pendingSummary(), [], { pending: 0, rejected: [] });
  return { ...s, ...summary };
}

export function SyncPill() {
  const s = useSync();
  const [open, setOpen] = useState(false);
  let key = 'ok';
  let text = 'متزامن';
  if (s.status === 'syncing') { key = 'syncing'; text = 'جاري المزامنة…'; }
  else if (s.rejected.length) { key = 'error'; text = `${s.rejected.length} مرفوض`; }
  else if (s.status === 'error') { key = 'error'; text = 'تعذرت المزامنة'; }
  else if (s.status === 'offline') { key = 'offline'; text = s.pending ? `بدون إنترنت، ${s.pending} معلّق` : 'بدون إنترنت'; }
  else if (s.status === 'signed_out') { key = 'error'; text = 'سجّل الدخول للمزامنة'; }
  else if (s.pending) { key = 'pending'; text = `${s.pending} معلّق`; }
  return (
    <>
      <button className="sync-pill" data-s={key} onClick={() => setOpen(true)} aria-label={`حالة المزامنة: ${text}`}>
        <span className="dot" />
        {text}
      </button>
      {open && <SyncSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function SyncSheet({ onClose }: { onClose: () => void }) {
  const s = useSync();
  const { hasLiveSession } = useApp();
  const counts = useLiveQuery(async () => ({
    measurements: await db.plant_measurements.count(),
    greenhouses: await db.greenhouses.count(),
  }), []);
  return (
    <Sheet title="المزامنة" onClose={onClose}>
      <div className="form">
        <div className="stats">
          <div className="stat"><span className="k">آخر مزامنة</span><span className="v" style={{ fontSize: 18 }}>{relativeTime(s.lastSyncAt)}</span></div>
          <div className="stat"><span className="k">في انتظار الرفع</span><span className="v">{s.pending}</span></div>
          <div className="stat"><span className="k">محفوظ على الجهاز</span><span className="v" style={{ fontSize: 18 }}>{counts ? `${counts.measurements} قياس` : '—'}</span></div>
        </div>
        {s.status === 'offline' && (
          <div className="banner info"><Icon name="cloudoff" /> الجهاز غير متصل. كل التسجيلات محفوظة على التابلت وسترفع تلقائيًا عند رجوع الإنترنت.</div>
        )}
        {!hasLiveSession && s.status !== 'offline' && (
          <div className="banner warn"><Icon name="alert" /> انتهت جلسة الدخول. سجّل خروج ثم دخول مرة أخرى وأنت متصل بالإنترنت لتكمل المزامنة.</div>
        )}
        {s.lastError && <div className="banner bad"><Icon name="alert" /> {s.lastError}</div>}
        {s.clockSkewSec != null && Math.abs(s.clockSkewSec) > 600 && (
          <div className="banner warn"><Icon name="alert" /> ساعة التابلت مختلفة عن الوقت الصحيح بحوالي {Math.round(Math.abs(s.clockSkewSec) / 60)} دقيقة. اضبط التاريخ والوقت تلقائيًا من إعدادات الجهاز.</div>
        )}
        {s.rejected.length > 0 && (
          <div>
            <h3 style={{ fontSize: 'var(--fs-md)', marginBottom: 8 }}>سجلات رفضها السيرفر</h3>
            <ul className="list panel">
              {s.rejected.map((r) => (
                <li key={r.id} className="list-item">
                  <div className="grow">
                    <b>{TABLE_LABEL[r.table] ?? r.table}</b>
                    <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{r.message}</p>
                  </div>
                  <button className="btn danger" onClick={() => discardRejected(r.table, r.id)}>تجاهل التعديل</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="form-actions">
          <button className="btn primary" onClick={() => syncNow()} disabled={s.status === 'syncing'}>
            <Icon name="sync" /> {s.status === 'syncing' ? s.phase ?? 'جاري المزامنة…' : 'زامن الآن'}
          </button>
          <button className="btn" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </Sheet>
  );
}
