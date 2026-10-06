'use client';

import { useActionState } from 'react';
import { loginBusiness } from '../../lib/actions';
import Link from 'next/link';

export default function IngresoPage() {
  const [state, formAction, pending] = useActionState(loginBusiness, undefined);

  return (
    <main className="page">
      <div style={{ textAlign: 'center', margin: '20px 0 14px' }}>
        <div style={{ fontSize: 40 }}>🔐</div>
        <h1 className="title">Inicia sesión</h1>
        <p className="muted small">Entra a tu panel de negocio.</p>
      </div>

      {state?.error && <div className="alert-error">{state.error}</div>}

      <form action={formAction} className="card">
        <label className="field">
          Correo electrónico *
          <input name="email" required type="email" autoComplete="email" placeholder="tu@correo.com" />
        </label>
        <label className="field">
          Contraseña *
          <input name="password" required type="password" autoComplete="current-password" />
        </label>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="small muted" style={{ textAlign: 'center', marginTop: 12 }}>
          ¿Nuevo aquí? <Link href="/registro" style={{ color: 'var(--green)', fontWeight: 700 }}>Crea tu negocio gratis</Link>
        </p>
      </form>
    </main>
  );
}