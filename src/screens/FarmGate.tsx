import { useEffect, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { db } from '../lib/db';
import { useSync } from '../components/Sync';
import { syncNow } from '../lib/sync';
import { ProjectsBoard } from './Projects';

/** يضمن اختيار مزرعة قبل أي شاشة. لو المستخدم عضو في مزرعة واحدة تُختار تلقائيًا */
export function FarmGate({ children }: { children: ReactNode }) {
  const { user, farmId, setFarmId, isSystemAdmin } = useApp();
  const sync = useSync();
  const options = useLiveQuery(async () => {
    // مدير النظام: كل المشاريع، وغيره: المشاريع اللي هو عضو فيها فقط
    if (isSystemAdmin) {
      const farms = (await db.farms.toArray()).filter((f) => !f.deleted_at);
      return farms.map((f) => ({ m: { farm_id: f.id, role: 'admin' as const }, f }));
    }
    const mem = await db.farm_members.where('user_id').equals(user!.id).toArray();
    const farms = await db.farms.bulkGet(mem.map((m) => m.farm_id));
    return mem
      .map((m, i) => ({ m: { farm_id: m.farm_id, role: m.role }, f: farms[i] }))
      .filter((x) => x.f && !x.f.deleted_at);
  }, [user?.id, isSystemAdmin]);

  useEffect(() => {
    if (!options) return;
    if (farmId && !options.some((o) => o.f!.id === farmId) && sync.lastSyncAt) setFarmId(null);
    if (!farmId && options.length === 1) setFarmId(options[0].f!.id);
  }, [options, farmId, setFarmId, sync.lastSyncAt]);

  if (farmId && options?.some((o) => o.f!.id === farmId)) return <>{children}</>;
  if (!options) return null;
  if (options.length === 1) return null; // يُختار تلقائيًا في الـ effect

  if (options.length === 0) {
    return (
      <main className="page">
        <div className="panel empty">
          {sync.status === 'offline' && !sync.lastSyncAt ? (
            <>
              <h3>الجهاز غير متصل بالإنترنت</h3>
              <p>أول تحميل لبيانات المزرعة يحتاج إنترنت. اتصل بالشبكة وسيبدأ التحميل تلقائيًا.</p>
            </>
          ) : sync.status === 'error' ? (
            <>
              <h3>تعذر تحميل بيانات المزرعة</h3>
              <p>{sync.lastError}</p>
              <button className="btn primary" onClick={() => syncNow()}>إعادة المحاولة</button>
            </>
          ) : sync.status === 'syncing' || !sync.lastSyncAt ? (
            <>
              <h3>جاري تحميل بيانات المزرعة…</h3>
              <p>أول تحميل يحتاج اتصال بالإنترنت.</p>
            </>
          ) : (
            <>
              <h3>حسابك غير مرتبط بأي مشروع</h3>
              <p>اطلب من مدير الشركة أو مدير النظام إضافة بريدك ({user?.email}) من شاشة فريق العمل.</p>
            </>
          )}
        </div>
      </main>
    );
  }

  return <ProjectsBoard canCreate={isSystemAdmin} />;
}
