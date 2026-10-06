import db from '../../../lib/db';
import { getCurrentBusiness } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import { addClient, addFiadoEntry, deleteClient } from '../../../lib/actions';
import { money } from '../../../lib/format';

export const dynamic = 'force-dynamic';

export default async function FiadoPage() {
  const biz = await getCurrentBusiness();
  if (!biz) redirect('/ingreso');

  const clients = db
    .prepare(
      `SELECT c.id, c.name, c.phone,
        COALESCE(SUM(CASE WHEN f.kind='cargo' THEN f.amount ELSE -f.amount END),0) AS saldo
       FROM clients c
       LEFT JOIN fiados f ON f.client_id = c.id
       WHERE c.business_id = ?
       GROUP BY c.id
       ORDER BY saldo DESC, c.name`
    )
    .all(biz.id);

  return (
    <>
      <div className="row-b">
        <h1 className="title" style={{ fontSize: 20 }}>📒 Control de fiado</h1>
        <span className="pill pill-green">{clients.length} clientes</span>
      </div>

      <div className="card">
        <h2 className="section" style={{ margin: '0 0 10px' }}>Nuevo cliente</h2>
        <form action={addClient}>
          <div className="field-row">
            <label className="field">
              Nombre del cliente *
              <input name="name" required placeholder="Ej: María Gómez" />
            </label>
            <label className="field">
              WhatsApp (sin 1) — para recordatorios
              <input name="phone" placeholder="8095551234" inputMode="tel" />
            </label>
          </div>
          <button className="btn btn-primary">+ Agregar cliente</button>
        </form>
      </div>

      <h2 className="section">Clientes</h2>
      {clients.length === 0 ? (
        <div className="card empty">
          <span className="e">📒</span>
          Agrega tus clientes y anota sus fiados. Olvídate de la libreta.
        </div>
      ) : (
        clients.map((c) => (
          <div key={c.id} className="card">
            <div className="row-b">
              <div>
                <strong>{c.name}</strong>
                <div className="small muted">{c.phone}</div>
              </div>
              <span className={`pill ${c.saldo > 0 ? 'pill-red' : 'pill-green'}`}>
                {c.saldo > 0 ? `Debe ${money(c.saldo)}` : 'Al día'}
              </span>
            </div>

            <form action={addFiadoEntry} style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'flex-end' }}>
              <input type="hidden" name="client_id" value={c.id} />
              <div style={{ flex: 1 }}>
                <label className="field" style={{ margin: 0 }}>
                  <select name="kind" style={{ padding: '8px' }}>
                    <option value="cargo">+ Fiado (debe)</option>
                    <option value="abono">− Cobro (pagó)</option>
                  </select>
                </label>
              </div>
              <input
                name="amount"
                type="number"
                min="1"
                placeholder="RD$"
                required
                style={{ width: 90, padding: '8px', borderRadius: 8, border: '1.5px solid var(--line)' }}
              />
              <input name="note" placeholder="Nota (opc.)" style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid var(--line)' }} />
              <button className="btn btn-primary btn-sm">Guardar</button>
            </form>

            {c.saldo > 0 && (
              <a
                href={`https://wa.me/${c.phone}?text=${encodeURIComponent(
                  `Hola ${c.name}, te saluda ${biz.name} 👋\nTe recordamos tu fiado pendiente de *${money(c.saldo)}*. 🙏\nPuedes pagar por Transferencias 24/7 o en el negocio. ¡Gracias!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-wa btn-sm"
                style={{ marginTop: 10 }}
              >
                💬 Enviar recordatorio por WhatsApp
              </a>
            )}

            <form action={deleteClient.bind(null, c.id)} style={{ marginTop: 8 }}>
              <button className="btn btn-danger btn-sm">Eliminar cliente</button>
            </form>
          </div>
        ))
      )}
    </>
  );
}