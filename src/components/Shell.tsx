import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/context';
import { roleLabels } from '../lib/access';
import { db } from '../lib/db';
import { SyncPill } from './Sync';
import { Sheet } from './Sheet';
import { Icon } from './Icon';
import { FarmMark } from './LogoPicker';
import { UpdatePrompt } from './UpdatePrompt';
import { ChangePassword } from '../screens/Team';
import { NewFarmSheet } from '../screens/Farm';

export function Shell() {
  const { farm, roles, user } = useApp();
  const [menu, setMenu] = useState(false);
  // خارج المشاريع (شاشة المشاريع) يفضل لوجو التطبيق؛ داخل مشروع يحل لوجو شركته مكانه
  const outside = useLocation().pathname.startsWith('/projects');
  const logo = outside ? null : farm?.logo_data ?? null;
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="الرئيسية">
          {logo ? <FarmMark logo={logo} name={farm?.name} /> : <img src="./icons/icon-192.png" alt="" />}
          <span>
            <b>{outside ? 'Greenhouse Assistant' : farm?.name ?? 'Greenhouse Assistant'}</b>
            <small>{roles.length ? roleLabels(roles) : user?.email}</small>
          </span>
        </Link>
        <span className="spacer" />
        <SyncPill />
        <button className="iconbtn" onClick={() => setMenu(true)} aria-label="القائمة">
          <Icon name="settings" size={22} />
        </button>
      </header>
      <UpdatePrompt />
      <Outlet />
      {menu && <Menu onClose={() => setMenu(false)} />}
    </div>
  );
}

function Menu({ onClose }: { onClose: () => void }) {
  const { user, signOut, can, isSystemAdmin } = useApp();
  const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [pw, setPw] = useState(false);
  const [newFarm, setNewFarm] = useState(false);
  const farms = useLiveQuery(
    async () => isSystemAdmin
      ? (await db.farms.toArray()).filter((f) => !f.deleted_at).length
      : db.farm_members.where('user_id').equals(user?.id ?? '').count(),
    [user?.id, isSystemAdmin],
  );
  const go = (to: string) => { onClose(); nav(to); };
  return (
    <Sheet title="القائمة" onClose={onClose}>
      <p className="muted" style={{ marginBottom: 12 }}>{user?.email}</p>
      <ul className="list panel">
        <li><button className="list-item btn ghost block" onClick={() => go('/farm')}><Icon name="pin" /> <span className="grow" style={{ textAlign: 'start' }}>بيانات الموقع</span></button></li>
        {can.manage && <li><button className="list-item btn ghost block" onClick={() => go('/setup')}><Icon name="layers" /> <span className="grow" style={{ textAlign: 'start' }}>هيكل الموقع والصوب</span></button></li>}
        {can.store && <li><button className="list-item btn ghost block" onClick={() => go('/store')}><Icon name="store" /> <span className="grow" style={{ textAlign: 'start' }}>المخزن والحصاد</span></button></li>}
        {can.requestPurchase && <li><button className="list-item btn ghost block" onClick={() => go('/purchases')}><Icon name="cart" /> <span className="grow" style={{ textAlign: 'start' }}>المشتريات</span></button></li>}
        <li><button className="list-item btn ghost block" onClick={() => go('/products')}><Icon name="box" /> <span className="grow" style={{ textAlign: 'start' }}>كتالوج المواد</span></button></li>
        <li><button className="list-item btn ghost block" onClick={() => go('/registry')}><Icon name="globe" /> <span className="grow" style={{ textAlign: 'start' }}>سجل المبيدات والتصدير</span></button></li>
        <li><button className="list-item btn ghost block" onClick={() => go('/files')}><Icon name="folder" /> <span className="grow" style={{ textAlign: 'start' }}>الملفات والتقارير</span></button></li>
        <li><button className="list-item btn ghost block" onClick={() => go('/weather')}><Icon name="sun" /> <span className="grow" style={{ textAlign: 'start' }}>الطقس والمناخ</span></button></li>
        {!can.full && <li><button className="list-item btn ghost block" onClick={() => go('/overview')}><Icon name="eye" /> <span className="grow" style={{ textAlign: 'start' }}>لوحة المزرعة العامة</span></button></li>}
        {can.invite && <li><button className="list-item btn ghost block" onClick={() => go('/team')}><Icon name="users" /> <span className="grow" style={{ textAlign: 'start' }}>فريق العمل</span></button></li>}
        {((farms ?? 0) > 1 || can.admin) && <li><button className="list-item btn ghost block" onClick={() => go('/projects')}><Icon name="map" /> <span className="grow" style={{ textAlign: 'start' }}>كل المشاريع{(farms ?? 0) > 1 ? ` (${farms})` : ''}</span></button></li>}
        {can.admin && <li><button className="list-item btn ghost block" onClick={() => setNewFarm(true)}><Icon name="plus" /> <span className="grow" style={{ textAlign: 'start' }}>مشروع جديد</span></button></li>}
        {can.admin && <li><button className="list-item btn ghost block" onClick={() => go('/admins')}><Icon name="shield" /> <span className="grow" style={{ textAlign: 'start' }}>مديرو النظام</span></button></li>}
        <li><button className="list-item btn ghost block" onClick={() => setPw(true)}><Icon name="lock" /> <span className="grow" style={{ textAlign: 'start' }}>تغيير كلمة المرور</span></button></li>
        <li><button className="list-item btn ghost block" style={{ color: 'var(--tomato)' }} onClick={async () => {
          const e = await signOut();
          if (e) setErr(e); else { onClose(); nav('/login'); }
        }}><Icon name="logout" /> <span className="grow" style={{ textAlign: 'start' }}>تسجيل الخروج</span></button></li>
      </ul>
      {err && <p className="form-error" style={{ marginTop: 12 }}>{err}</p>}
      <p className="faint" style={{ marginTop: 14, fontSize: 'var(--fs-xs)' }}>الإصدار {__APP_VERSION__}</p>
      {pw && <ChangePassword onClose={() => setPw(false)} />}
      {newFarm && <NewFarmSheet onClose={() => { setNewFarm(false); onClose(); }} />}
    </Sheet>
  );
}
