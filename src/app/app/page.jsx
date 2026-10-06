import Link from 'next/link';
import db from '../../lib/db';
import { getCurrentBusiness } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { money, todayStr, formatDateTime } from '../../lib/format';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const biz = await getCurrentBusiness();
  if (!biz) redirect('/ingreso');

  const today = todayStr();

  // Ventas de hoy: pedidos no cancelados
  const ventasHoy = db
    .prepare(
      `SELECT COALESCE(SUM(total),0) AS total FROM orders
       WHERE business_id = ? AND date(created_at) = date('now','localtime') AND status != 'cancelado'`
    )
    .get(biz.id)?.total || 0;

  // Cobrado hoy: abonos anotados hoy
  const cobradoHoy = db
    .prepare(
      `SELECT COALESCE(SUM(amount),0) AS total FROM fiados
       WHERE business_id = ? AND kind = 'abono' AND date(created_at) = date('now','localtime')`
    )
    .get(biz.id)?.total || 0;

  // Fiado pendiente total
  const fiadoPendiente = db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN kind='cargo' THEN amount ELSE -amount END),0) AS total
       FROM fiados WHERE business_id = ?`
    )
    .get(biz.id)?.total || 0;

  const productCount = db.prepare('SELECT COUNT(*) AS c FROM products WHERE business_id = ? AND active = 1').get(biz.id)?.c || 0;
  const clientCount = db.prepare('SELECT COUNT(*) AS c FROM clients WHERE business_id = ?').get(biz.id)?.c || 0;

  // Últimos pedidos
  const pedidos = db
    .prepare('SELECT * FROM orders WHERE business_id = ? ORDER BY id DESC LIMIT 5')
    .all(biz.id);

  // Recordatorios por cliente con saldo
  const deudores = db
    .prepare(
      `SELECT c.id, c.name, c.phone,
        COALESCE(SUM(CASE WHEN f.kind='cargo' THEN f.amount ELSE -f.amount END),0) AS saldo
       FROM clients c
       LEFT JOIN fiados f ON f.client_id = c.id
       WHERE c.business_id = ?
       GROUP BY c.id HAVING saldo > 0
       ORDER BY saldo DESC`
    )
    .all(biz.id);

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <h1 className="title" style={{ fontSize: 20 }}>👋 Hola, {biz.owner || 'bienvenido'}</h1>
        <p className="muted small">Resumen de {biz.name} · hoy</p>
      </div>

      <div className="stats">
        <div className="stat green">
          <div className="lbl">Ventas hoy</div>
          <div className="num">{money(ventasHoy)}</div>
        </div>
        <div className="stat">
          <div className="lbl">Cobrado hoy (fiado)</div>
          <div className="num">{money(cobradoHoy)}</div>
        </div>
        <div className="stat red">
          <div className="lbl">Fiado pendiente</div>
          <div className="num">{money(fiadoPendiente)}</div>
        </div>
        <div className="stat">
          <div className="lbl">Productos / Clientes</div>
          <div className="num">{productCount} / {clientCount}</div>
        </div>
      </div>

      <div className="row" style={{ margin: '16px 0 10px' }}>
        <h2 className="section" style={{ margin: 0 }}>Tu página pública</h2>
        <Link href={`/s/${biz.slug}`} className="badge-link">Ver catálogo →</Link>
      </div>
      <div className="card">
        <p className="small">
          Comparte este enlace con tus clientes para que puedan pedirte por WhatsApp:
        </p>
        <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '10px 12px', marginTop: 8, fontSize: 14, wordBreak: 'break-all' }}>
          /s/{biz.slug}
        </div>
      </div>

      <h2 className="section">📦 Últimos pedidos</h2>
      {pedidos.length === 0 ? (
        <div className="card empty">
          <span className="e">🛍️</span>
          Sin pedidos todavía. Comparte tu catálogo para recibir tu primer pedido por WhatsApp.
        </div>
      ) : (
        <div className="card">
          <table className="list">
            <thead>
              <tr><th>Pedido</th><th>Total</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.client_name ? <strong>👤 {p.client_name} </strong> : null}
                    {p.items.slice(0, 32)}{p.items.length > 32 ? '…' : ''}
                    <div className="small muted">🕒 {formatDateTime(p.created_at)}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{money(p.total)}</td>
                  <td><span className={`pill pill-${p.status === 'cancelado' ? 'red' : 'green'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="section">🔔 Recordar fiado (1 tap → WhatsApp)</h2>
      {deudores.length === 0 ? (
        <div className="card empty"><span className="e">📒</span>Nadie te debe ahora mismo. ¡Buen trabajo!</div>
      ) : (
        <div className="card">
          {deudores.map((d) => (
            <div key={d.id} className="row-b" style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{d.name}</div>
                <div className="small muted">debe {money(d.saldo)}</div>
              </div>
              <a
                href={`https://wa.me/${d.phone}?text=${encodeURIComponent(
                  `Hola ${d.name}, te saluda ${biz.name} 👋\nTe recordamos tu fiado pendiente de *${money(d.saldo)}*. 🙏\n¡Gracias!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-wa btn-sm"
              >
                💬 Recordar
              </a>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Link href="/app/menu" className="btn btn-yellow">🛒 Administrar menú</Link>
        <Link href="/app/pedidos" className="btn btn-primary">📦 Registrar pedido</Link>
      </div>
    </>
  );
}