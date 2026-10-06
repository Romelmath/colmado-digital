import db from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'JSON inválido.' }, { status: 400 });
  }

  const slug = String(body.slug || '').trim();
  const business = db.prepare('SELECT id FROM businesses WHERE slug = ?').get(slug);
  if (!business) {
    return Response.json({ ok: false, error: 'Negocio no encontrado.' }, { status: 404 });
  }

  const items = String(body.items || '').trim();
  const total = parseInt(String(body.total || '0'), 10);
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const phoneDigits = phone.replace(/\D/g, '');

  if (!items || isNaN(total) || total <= 0) {
    return Response.json({ ok: false, error: 'Pedido sin productos o monto inválido.' }, { status: 400 });
  }

  // Guardar/actualizar al cliente para reconocerlo en pedidos futuros (dedup por teléfono)
  if (phoneDigits.length >= 10) {
    const existing = db
      .prepare('SELECT id FROM clients WHERE business_id = ? AND phone = ?')
      .get(business.id, phoneDigits);
    if (existing) {
      if (name) db.prepare('UPDATE clients SET name = ? WHERE id = ?').run(name, existing.id);
    } else if (name) {
      db.prepare('INSERT INTO clients (business_id, name, phone) VALUES (?, ?, ?)').run(
        business.id,
        name,
        phoneDigits
      );
    }
  }

  const info = db
    .prepare(
      `INSERT INTO orders (business_id, client_name, client_phone, items, total, status)
       VALUES (?, ?, ?, ?, ?, 'nuevo')`
    )
    .run(business.id, name, phoneDigits, items, total);

  return Response.json({ ok: true, orderId: Number(info.lastInsertRowid) });
}