import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { supabase } from '../lib/supabase';
import { db, getMeta, setMeta } from '../lib/db';
import { setCurrentUser } from '../lib/repo';
import { pendingSummary, startAutoSync, syncNow } from '../lib/sync';
import type { Row } from '../lib/schema';
import { accessFor, rolesOf, ROLE_LABEL, type Access, type Role } from '../lib/access';

export { ROLE_LABEL };

export interface Identity {
  id: string;
  email: string;
  /** كلمة مرور مؤقتة: لازم تتغير قبل أي عمل */
  mustChange?: boolean;
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
  roles: Role[];
  /** مدير نظام: كل المشاريع */
  isSystemAdmin: boolean;
  can: Access;
  /** تغيير كلمة المرور (ويلغي إجبار التغيير) — يرجع رسالة خطأ أو null */
  changePassword: (password: string) => Promise<string | null>;
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
  // مستخدم غيّر كلمة المرور المؤقتة في هذه الجلسة: أحداث مصادقة قديمة (SIGNED_IN عند عودة التبويب مثلًا) لا ترجّع علامة «لازم يغيّر» — تسجيل دخول جديد فقط يقدر
  const pwChanged = useRef<string | null>(null);
  // أثناء تسجيل الدخول: signIn وحده يحدد الهوية بعد فحص الجهاز المشترك (لا نفتح التطبيق قبل مسح بيانات مستخدم سابق)
  const signingIn = useRef(false);

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
      if (session?.user && !signingIn.current) {
        const id = { id: session.user.id, email: session.user.email ?? '', mustChange: !!session.user.user_metadata?.must_change_password && pwChanged.current !== session.user.id };
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

  // تسجيل الدخول الفعلي — يُستدعى من signIn فقط
  const doSignIn = async (email: string, password: string) => {
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
    const id = { id: data.user.id, email: data.user.email ?? email, mustChange: !!data.user.user_metadata?.must_change_password && pwChanged.current !== data.user.id };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
    setUser(id);
    setCurrentUser(id.id);
    void syncNow(); // التحميل الأول يكمل في الخلفية — لا ننتظره حتى لا نقاطع المستخدم
    return null;
  };

  const signIn = useCallback(async (email: string, password: string) => {
    signingIn.current = true;
    pwChanged.current = null;
    try {
      return await doSignIn(email, password);
    } finally {
      signingIn.current = false;
    }
  }, []);


  const changePassword = useCallback(async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
    if (error) {
      if (/fetch|network/i.test(error.message)) return 'تغيير كلمة المرور يحتاج اتصال بالإنترنت.';
      if (/different|same/i.test(error.message)) return 'كلمة المرور الجديدة لازم تختلف عن الحالية.';
      if (/weak|least|short|pwned|leak/i.test(error.message)) return 'كلمة المرور ضعيفة أو ظهرت في تسريبات معروفة. اختر كلمة أقوى.';
      return 'تعذر تغيير كلمة المرور. حاول مرة أخرى.';
    }
    if (data.user) {
      pwChanged.current = data.user.id;
      const id = { id: data.user.id, email: data.user.email ?? '', mustChange: false };
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
      setUser(id);
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await syncNow();
    const { pending, rejected } = await pendingSummary();
    if (pending + rejected.length > 0) {
      return `فيه ${pending + rejected.length} سجل لم يُرفع بعد. اتصل بالإنترنت وزامن قبل تسجيل الخروج حتى لا تضيع البيانات.`;
    }
    await supabase.auth.signOut();
    pwChanged.current = null;
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
  const sysRows = useLiveQuery(
    () => (user ? db.system_admins.where('user_id').equals(user.id).filter((r) => !r.deleted_at).count() : 0),
    [user?.id],
  );
  const isSystemAdmin = (sysRows ?? 0) > 0;
  const roles: Role[] = useMemo(
    () => (isSystemAdmin ? ['admin'] : membership ? rolesOf(membership) : []),
    [isSystemAdmin, membership],
  );
  const role: Role | null = roles[0] ?? null;
  const can = useMemo(() => accessFor(roles, isSystemAdmin), [roles, isSystemAdmin]);

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
      roles,
      isSystemAdmin,
      can,
      changePassword,
      toast,
    }),
    [ready, user, hasLiveSession, signIn, signOut, farmId, setFarmId, farm, role, roles, isSystemAdmin, can, changePassword, toast],
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


