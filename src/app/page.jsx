import Link from 'next/link';

export default function Home() {
  return (
    <div className="landing">
      <div className="hero">
        <div className="emoji">🏪📲</div>
        <h1>Tu colmado, en el WhatsApp de tus clientes</h1>
        <p>
          Catálogo digital, pedidos por WhatsApp y control del fiado en una sola app.
          Hecho para colmados y negocios de barrio de República Dominicana.
        </p>
        <Link href="/registro" className="btn btn-yellow" style={{ width: 'auto', padding: '14px 28px' }}>
          Crear mi negocio gratis →
        </Link>
        <div className="cta" style={{ marginTop: 12 }}>
          <Link href="/ingreso" className="hero-input">Inicia sesión</Link>
        </div>
      </div>

      <section>
        <h2 className="title" style={{ textAlign: 'center', marginBottom: 16 }}>¿Qué hace por ti?</h2>
        <div className="features">
          <div className="feature">
            <div className="e">🛒</div>
            <h3>Catálogo digital</h3>
            <p>Sube tus productos con foto y precio en minutos. Tus clientes te ven desde su celular.</p>
          </div>
          <div className="feature">
            <div className="e">💬</div>
            <h3>Pedidos por WhatsApp</h3>
            <p>Cada producto tiene su botón „Pedir por WhatsApp". El pedido llega directo a tu número.</p>
          </div>
          <div className="feature">
            <div className="e">📒</div>
            <h3>Control de fiado</h3>
            <p>Adiós a la libreta. Lleva quién te debe, cuánto y manda recordatorios por WhatsApp en un tap.</p>
          </div>
          <div className="feature">
            <div className="e">✅</div>
            <h3>0 % comisión</h3>
            <p>Sin porcentaje por venta. Tú cobras directo: efectivo, Transferencias 24/7 o lo que prefieras.</p>
          </div>
        </div>
      </section>

      <section style={{ textAlign: 'center' }}>
        <h2 className="title">Empieza en 2 minutos</h2>
        <p className="muted" style={{ margin: '8px 0 14px' }}>
          Sin tarjeta de crédito, sin contrato. Plan gratuito para empezar a vender.
        </p>
        <div className="cta">
          <Link href="/registro" className="btn btn-primary" style={{ width: 'auto', padding: '14px 30px' }}>
            Crear mi negocio gratis
          </Link>
        </div>
      </section>
    </div>
  );
}