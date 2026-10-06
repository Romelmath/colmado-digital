import db from '../../../lib/db';
import { getCurrentBusiness } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import { addProduct, addFromCatalog, toggleProduct, deleteProduct } from '../../../lib/actions';
import { money } from '../../../lib/format';
import CatalogPicker from '../../components/CatalogPicker';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const biz = await getCurrentBusiness();
  if (!biz) redirect('/ingreso');

  const products = db
    .prepare('SELECT * FROM products WHERE business_id = ? ORDER BY category, name')
    .all(biz.id);

  const catalog = db
    .prepare(
      `SELECT cp.* FROM catalog_products cp
       WHERE cp.id NOT IN (SELECT p.catalog_id FROM products p WHERE p.business_id = ? AND p.catalog_id IS NOT NULL)
         AND lower(cp.name) NOT IN (SELECT lower(p.name) FROM products p WHERE p.business_id = ?)
       ORDER BY cp.category, cp.name
       LIMIT 400`
    )
    .all(biz.id, biz.id)
    .map((r) => ({ ...r }));

  return (
    <>
      <div className="row-b">
        <h1 className="title" style={{ fontSize: 20 }}>🛒 Tu catálogo</h1>
        <a href={`/s/${biz.slug}`} target="_blank" className="badge-link">Ver cómo lo ven tus clientes ↗</a>
      </div>

      <div className="card">
        <h2 className="section" style={{ margin: '0 0 10px' }}>Agregar producto</h2>
        <form action={addProduct}>
          <div className="field-row">
            <label className="field">
              Nombre del producto *
              <input name="name" required placeholder="Ej: Plátanos maduros (lb)" />
            </label>
            <label className="field">
              Precio (RD$) *
              <input name="price" required type="number" min="0" inputMode="numeric" placeholder="150" />
            </label>
          </div>
          <label className="field">
            Foto del producto (JPG o PNG, opcional · máx. 3 MB)
            <input name="photoFile" type="file" accept="image/png,image/jpeg" />
          </label>
          <details style={{ marginBottom: 12 }}>
            <summary className="small muted" style={{ cursor: 'pointer' }}>…o pega una URL de imagen</summary>
            <label className="field" style={{ marginTop: 8 }}>
              URL de la foto
              <input name="photo" placeholder="https://…" />
            </label>
          </details>
          <label className="field">
            Categoría (opcional)
            <input name="category" placeholder="Ej: Víveres, Bebidas" />
          </label>
          <button className="btn btn-primary">+ Agregar al catálogo</button>
        </form>
        <p className="small muted" style={{ marginTop: 8 }}>
          Los productos que agregas también nutren el <b>catálogo general</b>, para que otros colmados
          los incorporen con su propio precio.
        </p>
      </div>

      <CatalogPicker catalog={catalog} action={addFromCatalog} />

      {products.length === 0 ? (
        <div className="card empty">
          <span className="e">🛒</span>
          Aún no tienes productos. ¡Agrega tus primeros 5 para recibir pedidos!
        </div>
      ) : (
        <div className="card">
          <table className="list">
            <thead>
              <tr><th>Producto</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ opacity: p.active ? 1 : 0.45 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.photo ? (
                        <img
                          src={p.photo}
                          alt={p.name}
                          style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <span style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--green-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🛒</span>
                      )}
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div className="small muted">{p.category}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--green)' }}>{money(p.price)}</td>
                  <td>
                    <span className={`pill ${p.active ? 'pill-green' : 'pill-red'}`}>
                      {p.active ? 'Activo' : 'Oculto'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <form action={toggleProduct.bind(null, p.id)}>
                        <button className="btn btn-outline btn-sm">{p.active ? 'Ocultar' : 'Mostrar'}</button>
                      </form>
                      <form action={deleteProduct.bind(null, p.id)}>
                        <button className="btn btn-danger btn-sm">🗑</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}