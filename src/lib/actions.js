'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import db from './db.js';
import { hashPassword, verifyPassword, createSession, destroySession, getCurrentBusiness } from './auth.js';
import { normalizePhone } from './wa.js';
import { slugify } from './format.js';
import { saveUpload } from './uploads.js';

export async function registerBusiness(prevState, formData) {
  const name = String(formData.get('name') || '').trim();
  const owner = String(formData.get('owner') || '').trim();
  const whatsapp = normalizePhone(String(formData.get('whatsapp') || '').trim());
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!name || !email || !password || !whatsapp) {
    return { error: 'Faltan datos: nombre, WhatsApp, correo y contraseña.' };
  }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  if (!/^1?\d{10}$/.test(whatsapp)) return { error: 'El número de WhatsApp no es válido (10 dígitos).' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Correo no válido.' };

  const exists = db.prepare('SELECT id FROM businesses WHERE email = ?').get(email);
  if (exists) return { error: 'Ya existe una cuenta con ese correo.' };

  let slug = slugify(name);
  if (!slug) slug = 'negocio';
  let candidate = slug;
  let n = 1;
  while (db.prepare('SELECT id FROM businesses WHERE slug = ?').get(candidate)) {
    candidate = `${slug}-${n++}`;
  }

  const info = db
    .prepare('INSERT INTO businesses (name, owner, whatsapp, email, pass, slug) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, owner, whatsapp, email, hashPassword(password), candidate);

  await createSession(Number(info.lastInsertRowid));
  redirect('/app');
}

export async function loginBusiness(prevState, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const biz = db.prepare('SELECT * FROM businesses WHERE email = ?').get(email);
  if (!biz || !verifyPassword(password, biz.pass)) {
    return { error: 'Correo o contraseña incorrectos.' };
  }
  await createSession(biz.id);
  redirect('/app');
}

export async function logoutBusiness() {
  await destroySession();
  redirect('/ingreso');
}

export async function addProduct(formData) {
  const biz = await requireBiz();
  const name = String(formData.get('name') || '').trim();
  const price = parseInt(String(formData.get('price') || '0'), 10);
  const photoUrl = String(formData.get('photo') || '').trim();
  let category = String(formData.get('category') || '').trim();
  if (!name || isNaN(price) || price < 0) return { error: 'Nombre y precio son obligatorios.' };

  let photo = photoUrl;
  const file = formData.get('photoFile');
  if (file && typeof file === 'object' && file.size > 0) {
    const saved = await saveUpload(file);
    if (saved.error) return { error: saved.error };
    photo = saved.url;
  }

  // Enlazar o crear en el catálogo general (sin precio, precio va en el menú de cada negocio)
  const existing = db
    .prepare('SELECT id, category FROM catalog_products WHERE lower(name) = lower(?)')
    .get(name);
  let catalogId = null;
  if (existing) {
    catalogId = existing.id;
    if (!category) category = existing.category;
  } else {
    const info = db
      .prepare('INSERT INTO catalog_products (name, category, photo, created_by) VALUES (?, ?, ?, ?)')
      .run(name, category, photo, biz.id);
    catalogId = Number(info.lastInsertRowid);
  }

  db.prepare(
    `INSERT INTO products (business_id, catalog_id, name, price, photo, category, stock, active)
     VALUES (?, ?, ?, ?, ?, ?, NULL, 1)`
  ).run(biz.id, catalogId, name, price, photo, category);
  revalidatePath('/app/menu');
  revalidatePath('/');
}

export async function addFromCatalog(catalogId, formData) {
  const biz = await requireBiz();
  const price = parseInt(String(formData.get('price') || '0'), 10);
  const cat = db.prepare('SELECT * FROM catalog_products WHERE id = ?').get(Number(catalogId));
  if (!cat) return { error: 'Producto no encontrado en el catálogo general.' };
  if (isNaN(price) || price <= 0) return { error: 'Escribe un precio válido.' };

  const dup =
    db.prepare('SELECT id FROM products WHERE business_id = ? AND catalog_id = ?').get(biz.id, cat.id) ||
    db.prepare('SELECT id FROM products WHERE business_id = ? AND lower(name) = lower(?)').get(biz.id, cat.name);
  if (dup) {
    revalidatePath('/app/menu');
    return { error: 'Ese producto ya está en tu catálogo.' };
  }

  db.prepare(
    `INSERT INTO products (business_id, catalog_id, name, price, photo, category, stock, active)
     VALUES (?, ?, ?, ?, ?, ?, NULL, 1)`
  ).run(biz.id, cat.id, cat.name, price, cat.photo, cat.category);
  revalidatePath('/app/menu');
  revalidatePath('/');
}

export async function toggleProduct(id) {
  const biz = await requireBiz();
  const p = db.prepare('SELECT * FROM products WHERE id = ? AND business_id = ?').get(id, biz.id);
  if (!p) return { error: 'No encontrado.' };
  db.prepare('UPDATE products SET active = ? WHERE id = ?').run(p.active ? 0 : 1, id);
  revalidatePath('/app/menu');
  revalidatePath('/');
}

export async function deleteProduct(id) {
  const biz = await requireBiz();
  db.prepare('DELETE FROM products WHERE id = ? AND business_id = ?').run(id, biz.id);
  revalidatePath('/app/menu');
  revalidatePath('/');
}

export async function addClient(formData) {
  const biz = await requireBiz();
  const name = String(formData.get('name') || '').trim();
  const phone = normalizePhone(String(formData.get('phone') || '').trim());
  if (!name) return { error: 'El nombre del cliente es obligatorio.' };
  db.prepare('INSERT INTO clients (business_id, name, phone) VALUES (?, ?, ?)').run(biz.id, name, phone);
  revalidatePath('/app/fiado');
}

export async function deleteClient(id) {
  const biz = await requireBiz();
  db.prepare('DELETE FROM clients WHERE id = ? AND business_id = ?').run(id, biz.id);
  revalidatePath('/app/fiado');
}

export async function addFiadoEntry(formData) {
  const biz = await requireBiz();
  const clientId = parseInt(String(formData.get('client_id') || '0'), 10);
  const kind = String(formData.get('kind') || 'cargo');
  const amount = parseInt(String(formData.get('amount') || '0'), 10);
  const note = String(formData.get('note') || '').trim();
  if (!clientId || isNaN(amount) || amount <= 0) return { error: 'Monto inválido.' };
  const client = db.prepare('SELECT id FROM clients WHERE id = ? AND business_id = ?').get(clientId, biz.id);
  if (!client) return { error: 'Cliente no encontrado.' };
  db.prepare(
    'INSERT INTO fiados (business_id, client_id, kind, amount, note) VALUES (?, ?, ?, ?, ?)'
  ).run(biz.id, clientId, kind, amount, note);
  revalidatePath('/app/fiado');
}

export async function addOrder(formData) {
  const biz = await requireBiz();
  const items = String(formData.get('items') || '').trim();
  const total = parseInt(String(formData.get('total') || '0'), 10);
  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const phoneDigits = phone.replace(/\D/g, '');
  if (!items || isNaN(total)) return { error: 'Detalla el pedido y su monto.' };
  if (phoneDigits.length >= 10) {
    const existing = db
      .prepare('SELECT id FROM clients WHERE business_id = ? AND phone = ?')
      .get(biz.id, phoneDigits);
    if (existing) {
      if (name) db.prepare('UPDATE clients SET name = ? WHERE id = ?').run(name, existing.id);
    } else if (name) {
      db.prepare('INSERT INTO clients (business_id, name, phone) VALUES (?, ?, ?)').run(
        biz.id,
        name,
        phoneDigits
      );
    }
  }
  db.prepare(
    'INSERT INTO orders (business_id, client_name, client_phone, items, total, status) VALUES (?, ?, ?, ?, ?, \'nuevo\')'
  ).run(biz.id, name, phoneDigits, items, total);
  revalidatePath('/app/pedidos');
}

export async function setOrderStatus(id, status) {
  const biz = await requireBiz();
  const ok = ['confirmado', 'entregado', 'cancelado'];
  if (!ok.includes(status)) return { error: 'Estado inválido.' };
  const order = db
    .prepare('SELECT id, status FROM orders WHERE id = ? AND business_id = ?')
    .get(Number(id), biz.id);
  if (!order) return { error: 'Pedido no encontrado.' };
  if (order.status === 'entregado' && status === 'cancelado') {
    return { error: 'Un pedido ya entregado no se puede cancelar.' };
  }
  db.prepare('UPDATE orders SET status = ? WHERE id = ? AND business_id = ?').run(status, id, biz.id);
  revalidatePath('/app/pedidos');
}

export async function deleteOrder(id) {
  const biz = await requireBiz();
  db.prepare('DELETE FROM orders WHERE id = ? AND business_id = ?').run(id, biz.id);
  revalidatePath('/app/pedidos');
}

export async function requireBiz() {
  const biz = await getCurrentBusiness();
  if (!biz) redirect('/ingreso');
  return biz;
}