'use client';

import { useActionState } from 'react';
import { registerBusiness } from '../../lib/actions';
import Link from 'next/link';

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(registerBusiness, undefined);

  return (
    <main className="page">
      <div style={{ textAlign: 'center', margin: '20px 0 14px' }}>
        <div style={{ fontSize: 40 }}>🏪</div>
        <h1 className="title">Crea tu negocio</h1>
        <p className="muted small">Gratis. En 2 minutos tienes tu catálogo en WhatsApp.</p>
      </div>

      {state?.error && <div className="alert-error">{state.error}</div>}

      <form action={formAction} className="card">
        <label className="field">
          Nombre del negocio *
          <input name="name" required placeholder="Ej: Colmado El Progreso" autoComplete="organization" />
        </label>
        <label className="field">
          Tu nombre
          <input name="owner" placeholder="Ej: Juan Pérez" autoComplete="name" />
        </label>
        <label className="field">
          WhatsApp del negocio para recibir pedidos *
          <input name="whatsapp" required placeholder="8095551234" inputMode="tel" autoComplete="tel" />
        </label>
        <label className="field">
          Correo electrónico *
          <input name="email" required type="email" placeholder="tu@correo.com" autoComplete="email" />
        </label>
        <label className="field">
          Contraseña * <span className="muted">(mínimo 6 caracteres)</span>
          <input name="password" required type="password" minLength={6} autoComplete="new-password" />
        </label>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? 'Creando…' : 'Crear mi negocio'}
        </button>
        <p className="small muted" style={{ textAlign: 'center', marginTop: 12 }}>
          ¿Ya tienes cuenta? <Link href="/ingreso" style={{ color: 'var(--green)', fontWeight: 700 }}>Inicia sesión</Link>
        </p>
      </form>
    </main>
  );
}