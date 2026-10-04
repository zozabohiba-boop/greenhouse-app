import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { supabase } from '../lib/supabase';
import { db, getMeta, setMeta } from '../lib/db';
import { setCurrentUser } from '../lib/repo';
import { pendingSummary, startAutoSync, syncNow } from '../lib/sync';
import type { Row } from '../lib/schema';

type Role = Row<'farm_members'>['role'];

export interface Identity {
  id: string;
  email: string;
}

interface AppCtx {
  ready: boolean;
  user: Identity | null;
  /** الجلسة صالحة للمزامنة (وليس مجرد هوية محفوظة للعمل أوفلاين) */
  hasLiveSession: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
  farmId: string | null;
  setFarmId: (id: string | null) => void;
  farm: Row<'farms'> | undefined;
  role: Role | null;
  can: {
    manage: boolean; // تعديل هيكل المزرعة
    record: boolean; // التسجيل الميداني
    admin: boolean;
    invite: boolean;
    /** تعديل سجلات الآخرين الميدانية (مدير المزرعة/النظام) */
    supervise: boolean;
    /** كتابة التوصيات وإدارة الكتالوج */
    advise: boolean;
  };
  toast: (msg: string) => void;
}

const Ctx = createContext<AppCtx | null>(null);
const IDENTITY_KEY = 'gh.identity';
const FARM_KEY = 'gh.farm';

function readIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Identity | null>(readIdentity);
  const [hasLiveSession, setLive] = useState(false);
  const [farmId, setFarmIdState] = useState<string | null>(() => localStorage.getItem(FARM_KEY));
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  useEffect(() => {
    setCurrentUser(user?.id ?? null);
  }, [user]);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setLive(!!data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setLive(!!session);
      if (session?.user) {
        const id = { id: session.user.id, email: session.user.email ?? '' };
        localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
        setUser(id);
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    return startAutoSync();
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) {
      if (error && /fetch|network/i.test(error.message)) return 'لا يوجد اتصال بالإنترنت. أول تسجيل دخول يحتاج إنترنت.';
      return 'الإيميل أو كلمة المرور غير صحيحة';
    }
    // جهاز مشترك: لو مستخدم مختلف، نبدأ بقاعدة محلية نظيفة
    const owner = await getMeta<string | null>('owner', null);
    if (owner && owner !== data.user.id) {
      await db.delete();
      await db.open();
      localStorage.removeItem(FARM_KEY);
      setFarmIdState(null);
    }
    await setMeta('owner', data.user.id);
    const id = { id: data.user.id, email: data.user.email ?? email };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
    setUser(id);
    setCurrentUser(id.id);
    void syncNow(); // التحميل الأول يكمل في الخلفية — لا ننتظره حتى لا نقاطع المستخدم
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await syncNow();
    const { pending, rejected } = await pendingSummary();
    if (pending + rejected.length > 0) {
      return `فيه ${pending + rejected.length} سجل لم يُرفع بعد. اتصل بالإنترنت وزامن قبل تسجيل الخروج حتى لا تضيع البيانات.`;
    }
    await supabase.auth.signOut();
    localStorage.removeItem(IDENTITY_KEY);
    setUser(null);
    setLive(false);
    return null;
  }, []);

  const setFarmId = useCallback((id: string | null) => {
    if (id) localStorage.setItem(FARM_KEY, id);
    else localStorage.removeItem(FARM_KEY);
    setFarmIdState(id);
  }, []);

  const farm = useLiveQuery(() => (farmId ? db.farms.get(farmId) : undefined), [farmId]);
  const membership = useLiveQuery(
    () => (farmId && user ? db.farm_members.get([farmId, user.id]) : undefined),
    [farmId, user?.id],
  );
  const role = membership?.role ?? null;

  const value = useMemo<AppCtx>(
    () => ({
      ready,
      user,
      hasLiveSession,
      signIn,
      signOut,
      farmId,
      setFarmId,
      farm,
      role,
      can: {
        manage: role === 'admin' || role === 'farm_manager' || role === 'consultant',
        record: !!role && role !== 'executive',
        admin: role === 'admin',
        invite: role === 'admin' || role === 'farm_manager',
        supervise: role === 'admin' || role === 'farm_manager',
        advise: role === 'admin' || role === 'farm_manager' || role === 'consultant',
      },
      toast,
    }),
    [ready, user, hasLiveSession, signIn, signOut, farmId, setFarmId, farm, role, toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {toastMsg && (
        <div className="toast-wrap" role="status" aria-live="polite">
          <div className="toast">{toastMsg}</div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'مدير النظام',
  farm_manager: 'مدير المزرعة',
  consultant: 'استشاري',
  scout: 'مهندس فحص',
  executive: 'إدارة تنفيذية',
};
