'use client';

import { useState, useEffect } from 'react';
import { money } from '../../lib/format';

export default function PublicMenu({ business, products }) {
  const [cart, setCart] = useState({});
  const [sending, setSending] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('micd_customer') || 'null');
      if (saved && saved.name) setClientName(saved.name);
      if (saved && saved.phone) setClientPhone(saved.phone);
    } catch {
      // Sin datos guardados
    }
  }, []);

  const addItem = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeItem = (id) => {
    setCart((c) => {
      const n = (c[id] || 0) - 1;
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });
  };

  const lines = products
    .filter((p) => p.active)
    .map((p) => ({ ...p, qty: cart[p.id] || 0 }))
    .filter((p) => p.qty > 0);

  const total = lines.reduce((s, p) => s + p.price * p.qty, 0);

  const orderText = lines
    .map((p) => `• ${p.qty} × ${p.name} (${money(p.price)} c/u) = ${money(p.price * p.qty)}`)
    .join('\n');

  const waHref = `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(
    `Hola ${business.name}! 👋\nQuiero pedir:\n${orderText}\n\nTotal: ${money(total)}\n\nMi nombre: ${clientName}${clientPhone ? `\nMi WhatsApp: ${clientPhone}` : ''}\n¿Me lo confirmas? 🙏`
  )}`;

  const sendOrder = async () => {
    if (sending) return;
    const digits = clientPhone.replace(/\D/g, '');
    if (!clientName.trim()) {
      setError('Escribe tu nombre para que el negocio sepa quién eres.');
      return;
    }
    if (!digits || digits.length < 10) {
      setError('Escribe tu WhatsApp (10 dígitos, ej. 8095551234) para confirmar el pedido.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: business.slug,
          items: orderText,
          total,
          name: clientName.trim(),
          phone: digits,
        }),
      });
    } catch {
      // Si falla el registro, igual abrimos WhatsApp para no perder la venta.
    }
    try {
      localStorage.setItem('micd_customer', JSON.stringify({ name: clientName.trim(), phone: digits }));
    } catch {
      // Sin almacenamiento disponible
    }
    window.open(waHref, '_blank', 'noopener,noreferrer');
    setTimeout(() => setSending(false), 1500);
  };

  return (
    <div className="pub">
      <div className="pub-head">
        <div className="name">{business.name}</div>
        <div className="sub">📲 Pide por WhatsApp · toca los productos y agrega a tu pedido</div>
      </div>

      <div className="pub-body">
        {products.filter((p) => p.active).length === 0 ? (
          <div className="card empty">
            <span className="e">🛒</span>
            El negocio aún está preparando su catálogo. ¡Vuelve pronto!
          </div>
        ) : (
          products
            .filter((p) => p.active)
            .map((p) => (
              <div key={p.id} className="pub-product">
                <div className="ph">
                  {p.photo ? <img src={p.photo} alt={p.name} /> : <span>🛒</span>}
                </div>
                <div className="body">
                  <div className="cat">{p.category || 'General'}</div>
                  <div className="pname">{p.name}</div>
                  <div className="pprice">{money(p.price)}</div>
                  <div className="qty">
                    <button onClick={() => removeItem(p.id)} disabled={!cart[p.id]}>−</button>
                    <span>{cart[p.id] || 0}</span>
                    <button onClick={() => addItem(p.id)}>+</button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {lines.length > 0 && (
        <div className="cart-bar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div>
              <div className="small" style={{ opacity: 0.85 }}>{lines.reduce((s, l) => s + l.qty, 0)} productos</div>
              <div className="total">{money(total)}</div>
            </div>
            <button onClick={sendOrder} disabled={sending} className="btn btn-wa">
              {sending ? 'Enviando…' : 'WhatsApp'}
            </button>
          </div>
          <div className="cart-fields">
            <input
              className="cart-input"
              placeholder="Tu nombre *"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              maxLength={60}
            />
            <input
              className="cart-input"
              placeholder="Tu WhatsApp *"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              inputMode="tel"
              type="tel"
              maxLength={20}
              required
            />
          </div>
          {error && <div style={{ color: '#ffd0c8', fontSize: 12, marginTop: 6 }}>{error}</div>}
          <div className="small" style={{ opacity: 0.75, marginTop: 6 }}>🔁 Guardamos tus datos y los rellenamos solos en tu próximo pedido.</div>
        </div>
      )}
    </div>
  );
}