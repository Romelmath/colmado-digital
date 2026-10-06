export function money(n) {
  return `RD$${Number(n || 0).toLocaleString('es-DO')}`;
}

export function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function timeAgo(iso) {
  const d = new Date(iso.replace(' ', 'T'));
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function formatDateTime(utc, withTime = true) {
  if (!utc) return '';
  const base = String(utc).replace(' ', 'T');
  const d = new Date(base.endsWith('Z') ? base : `${base}Z`);
  const opts = {
    timeZone: 'America/Santo_Domingo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  if (withTime) {
    opts.hour = '2-digit';
    opts.minute = '2-digit';
    opts.hour12 = true;
  }
  return new Intl.DateTimeFormat('es-DO', opts).format(d);
}