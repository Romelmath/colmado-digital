import Link from 'next/link';
import { getCurrentBusiness } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { logoutBusiness } from '../../lib/actions';

export default async function AppLayout({ children }) {
  const biz = await getCurrentBusiness();
  if (!biz) redirect('/ingreso');

  return (
    <div>
      <div className="nav-top">
        <div>
          <div className="brand">🏪 {biz.name}</div>
          <div className="slug">tu página: /s/{biz.slug}</div>
        </div>
        <form action={logoutBusiness}>
          <button className="btn btn-outline btn-sm" style={{ background: 'var(--green)', color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>
            Salir
          </button>
        </form>
      </div>

      <main className="page">{children}</main>

      <nav className="nav-bottom">
        <Link href="/app" className={navActive('/app')}>
          <span className="ico">📊</span>
          Panel
        </Link>
        <Link href="/app/menu" className={navActive('/app/menu')}>
          <span className="ico">🛒</span>
          Menú
        </Link>
        <Link href="/app/pedidos" className={navActive('/app/pedidos')}>
          <span className="ico">📦</span>
          Pedidos
        </Link>
        <Link href="/app/fiado" className={navActive('/app/fiado')}>
          <span className="ico">📒</span>
          Fiado
        </Link>
      </nav>
    </div>
  );
}

function navActive(path) {
  return path === '/app' ? 'active' : '';
}