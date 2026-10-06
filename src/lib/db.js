import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

const dataDir = process.env.DB_DIR || path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = isBuild ? ':memory:' : process.env.DB_PATH || path.join(dataDir, 'colwa.db');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA busy_timeout = 10000;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  whatsapp TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  pass TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  photo TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  stock INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS catalog_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fiados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('cargo','abono')),
  amount INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL DEFAULT '',
  client_phone TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'nuevo',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_biz ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_clients_biz ON clients(business_id);
CREATE INDEX IF NOT EXISTS idx_fiados_client ON fiados(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_biz ON orders(business_id);
`);

// Migración: enlazar productos del menú con el catálogo general
const productCols = db.prepare('PRAGMA table_info(products)').all();
if (!productCols.some((c) => c.name === 'catalog_id')) {
  db.exec('ALTER TABLE products ADD COLUMN catalog_id INTEGER;');
}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_name ON catalog_products(lower(name));');

// Semilla mínima del catálogo general (solo si está vacío)
const SEED = [
  ['Arroz (1 lb)', 'Víveres'],
  ['Aceite (1L)', 'Abarrotes'],
  ['Azúcar (1 lb)', 'Víveres'],
  ['Habichuelas Rojas (1 lb)', 'Víveres'],
  ['Harina de Maíz (1 lb)', 'Víveres'],
  ['Fideos (1 paquete)', 'Abarrotes'],
  ['Sal (1 lb)', 'Abarrotes'],
  ['Café (1 lb)', 'Bebidas'],
  ['Leche en Polvo (1 lb)', 'Lácteos'],
  ['Queso (1 lb)', 'Lácteos'],
  ['Jamón (1 lb)', 'Embutidos'],
  ['Huevos (unidad)', 'Granos y huevos'],
  ['Plátanos Maduros (lb)', 'Víveres'],
  ['Tomates (1 lb)', 'Víveres'],
  ['Cebollas (1 lb)', 'Víveres'],
  ['Pan (unidad)', 'Panadería'],
  ['Refresco (1L)', 'Bebidas'],
  ['Agua (1L)', 'Bebidas'],
  ['Cerveza (unidad)', 'Bebidas'],
  ['Galletas (unidad)', 'Abarrotes'],
];
const seedCount = db.prepare('SELECT COUNT(*) c FROM catalog_products').get().c;
if (seedCount === 0) {
  const ins = db.prepare('INSERT INTO catalog_products (name, category, created_by) VALUES (?, ?, NULL)');
  for (const [name, category] of SEED) {
    ins.run(name, category);
  }
}

export default db;