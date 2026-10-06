export function normalizePhone(phone) {
  let p = (phone || '').replace(/\D/g, '');
  if (p.length === 10) p = '1' + p;
  if (!p.startsWith('1')) p = '1' + p;
  return p;
}

export function waLink(phone, text) {
  const p = normalizePhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

export function waLinkProduct(phone, businessName, productName, price) {
  const msg = `Hola ${businessName}! 👋\nQuiero pedir:\n• ${productName}\nPrecio: RD$${price}\n\n¿Me confirmas disponibilidad?`;
  return waLink(phone, msg);
}

export function waLinkReminder(phone, businessName, clientName, amount) {
  const msg = `Hola ${clientName}, te saluda ${businessName} 👋\nTe recordamos tu fiado pendiente de *RD$${amount.toLocaleString('es-DO')}*. 🙏\nPuedes pagar por Transferencias 24/7 o en el establecimiento. ¡Gracias!`;
  return waLink(phone, msg);
}

export function waLinkOrder(phone, businessName, itemsText, total) {
  const msg = `Hola ${businessName}! 👋\nQuiero pedir:\n${itemsText}\n\nTotal estimado: RD$${total.toLocaleString('es-DO')}\n¿Me confirmas?`;
  return waLink(phone, msg);
}