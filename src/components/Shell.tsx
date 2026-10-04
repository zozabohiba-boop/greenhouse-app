import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp, ROLE_LABEL } from '../app/context';
import { db } from '../lib/db';
import { SyncPill } from './Sync';
import { Sheet } from './Sheet';
import { Icon } from './Icon';
import { UpdatePrompt } from './UpdatePrompt';
import { ChangePassword } from '../screens/Team';

export function Shell() {
  const { farm, role, user } = useApp();
  const [menu, setMenu] = useState(false);
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="الرئيسية">
          <img src="./icons/icon-192.png" alt="" />
          <span>
            <b>{farm?.name ?? 'سجل الصوب'}</b>
            <small>{role ? ROLE_LABEL[role] : user?.email}</small>
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
  const { user, signOut, setFarmId, can } = useApp();
  const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [pw, setPw] = useState(false);
  const farms = useLiveQuery(() => db.farm_members.where('user_id').equals(user?.id ?? '').count(), [user?.id]);
  const go = (to: string) => { onClose(); nav(to); };
  return (
    <Sheet title="القائمة" onClose={onClose}>
      <p className="muted" style={{ marginBottom: 12 }}>{user?.email}</p>
      <ul className="list panel">
        <li><button className="list-item btn ghost block" onClick={() => go('/setup')}><Icon name="house" /> <span className="grow" style={{ textAlign: 'start' }}>الصوب والدورات الزراعية</span></button></li>
        {can.invite && <li><button className="list-item btn ghost block" onClick={() => go('/team')}><Icon name="users" /> <span className="grow" style={{ textAlign: 'start' }}>فريق العمل والدعوات</span></button></li>}
        {(farms ?? 0) > 1 && <li><button className="list-item btn ghost block" onClick={() => { setFarmId(null); go('/'); }}><Icon name="sync" /> <span className="grow" style={{ textAlign: 'start' }}>تغيير المزرعة</span></button></li>}
        <li><button className="list-item btn ghost block" onClick={() => setPw(true)}><Icon name="edit" /> <span className="grow" style={{ textAlign: 'start' }}>تغيير كلمة المرور</span></button></li>
        <li><button className="list-item btn ghost block" style={{ color: 'var(--tomato)' }} onClick={async () => {
          const e = await signOut();
          if (e) setErr(e); else { onClose(); nav('/login'); }
        }}><Icon name="logout" /> <span className="grow" style={{ textAlign: 'start' }}>تسجيل الخروج</span></button></li>
      </ul>
      {err && <p className="form-error" style={{ marginTop: 12 }}>{err}</p>}
      <p className="faint" style={{ marginTop: 14, fontSize: 'var(--fs-xs)' }}>الإصدار {__APP_VERSION__}</p>
      {pw && <ChangePassword onClose={() => setPw(false)} />}
    </Sheet>
  );
}
