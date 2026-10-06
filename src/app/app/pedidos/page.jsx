import db from '../../../lib/db';
import { getCurrentBusiness } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import { addOrder, setOrderStatus, deleteOrder } from '../../../lib/actions';
import { money, formatDateTime } from '../../../lib/format';

export const dynamic = 'force-dynamic';

export default async function PedidosPage() {
  const biz = await getCurrentBusiness();
  if (!biz) redirect('/ingreso');

  const pedidos = db
    .prepare('SELECT * FROM orders WHERE business_id = ? ORDER BY id DESC LIMIT 50')
    .all(biz.id);

  const statusColor = { nuevo: 'yellow', confirmado: 'green', entregado: 'green', cancelado: 'red' };

  return (
    <>
      <h1 className="title" style={{ fontSize: 20 }}>📦 Pedidos</h1>
      <p className="muted small">Los pedidos llegan aquí cuando tus clientes usan tu catálogo.</p>

      <div className="card">
        <h2 className="section" style={{ margin: '0 0 10px' }}>Anotar pedido recibido por WhatsApp</h2>
        <form action={addOrder}>
          <div className="field-row">
            <label className="field">
              Nombre del cliente (opcional)
              <input name="name" placeholder="Ej: María Gómez" />
            </label>
            <label className="field">
              Teléfono / WhatsApp (opcional)
              <input name="phone" placeholder="8095551234" inputMode="tel" />
            </label>
          </div>
          <label className="field">
            Detalle del pedido *
            <textarea name="items" rows={3} required placeholder="Ej: 2 lb plátanos (150 c/u), 1 botella aceite (480)" />
          </label>
          <label className="field">
            Total en RD$ *
            <input name="total" type="number" min="0" required inputMode="numeric" placeholder="780" />
          </label>
          <button className="btn btn-primary">Registrar pedido</button>
        </form>
      </div>

      {pedidos.length === 0 ? (
        <div className="card empty">
          <span className="e">📦</span>
          Sin pedidos registrados. Comparte tu catálogo en <code>/s/{biz.slug}</code> o usa el formulario para anotar uno recibido por WhatsApp.
        </div>
      ) : (
        pedidos.map((p) => (
          <div key={p.id} className="card">
            <div className="row-b">
              <div style={{ flex: 1, minWidth: 0 }}>
                {p.client_name && (
                  <div style={{ fontWeight: 800, fontSize: 15 }}>
                    👤 {p.client_name}
                  </div>
                )}
                <div style={{ marginTop: 2 }}>{p.items}</div>
                <div className="small muted" style={{ marginTop: 4 }}>
                  🕒 {formatDateTime(p.created_at)}
                  {p.client_phone && (
                    <span> · <a href={`tel:${p.client_phone}`} style={{ color: 'var(--green)' }}>{p.client_phone}</a></span>
                  )}
                </div>
                <div className="small" style={{ marginTop: 2 }}><strong>{money(p.total)}</strong></div>
              </div>
              <span className={`pill pill-${statusColor[p.status] || 'yellow'}`}>{p.status}</span>
            </div>
            <div className="actions" style={{ marginTop: 10 }}>
              {p.status === 'nuevo' && (
                <form action={setOrderStatus.bind(null, p.id, 'confirmado')}>
                  <button className="btn btn-primary btn-sm">✔ Confirmar</button>
                </form>
              )}
              {p.status !== 'entregado' && p.status !== 'cancelado' && (
                <form action={setOrderStatus.bind(null, p.id, 'entregado')}>
                  <button className="btn btn-yellow btn-sm">Entregado</button>
                </form>
              )}
              {(p.status === 'nuevo' || p.status === 'confirmado') && (
                <form action={setOrderStatus.bind(null, p.id, 'cancelado')}>
                  <button className="btn btn-danger btn-sm">Cancelar</button>
                </form>
              )}
              {p.status !== 'entregado' && (
                <form action={deleteOrder.bind(null, p.id)}>
                  <button className="btn btn-outline btn-sm">🗑</button>
                </form>
              )}
              {p.status === 'entregado' && (
                <span className="small muted" style={{ marginTop: 6 }}>Entregado y registrado ✔</span>
              )}
            </div>
          </div>
        ))
      )}
    </>
  );
}