'use client';

import { useState } from 'react';

export default function CatalogPicker({ catalog, action }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const filtered = catalog.filter(
    (i) => i.name.toLowerCase().includes(query) || i.category.toLowerCase().includes(query)
  );

  return (
    <div className="card">
      <h2 className="section" style={{ margin: '0 0 4px' }}>📚 Agregar desde el catálogo general</h2>
      <p className="small muted" style={{ margin: '0 0 10px' }}>
        Productos que ya agregaron otros colmados, sin precio. Eliges el tuyo y se añaden con un clic.
      </p>
      <input
        className="cat-search"
        placeholder="Buscar producto…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {filtered.length === 0 ? (
        <div className="small muted" style={{ marginTop: 12 }}>
          {catalog.length === 0
            ? 'Aún no hay productos de otros colmados. ¡Agrega los tuyos con el formulario de arriba!'
            : 'Sin resultados para esa búsqueda.'}
        </div>
      ) : (
        <div className="cat-list">
          {filtered.map((i) => (
            <form key={i.id} action={action.bind(null, i.id)} className="cat-row">
              {i.photo ? (
                <img src={i.photo} alt={i.name} className="cat-ph" />
              ) : (
                <span className="cat-ph cat-ph-empty">🛒</span>
              )}
              <div className="cat-info">
                <b>{i.name}</b>
                {i.category && <div className="small muted">{i.category}</div>}
                {i.stock_note}
              </div>
              <div className="cat-pick">
                <input
                  className="cat-price"
                  name="price"
                  required
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="RD$"
                />
                <button className="btn btn-primary btn-sm">+ Agregar</button>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}