import './globals.css';

export const metadata = {
  title: 'Mi Colmado Digital — Vende y cobra por WhatsApp',
  description:
    'Tu catálogo online, pedidos por WhatsApp y control de fiado. Hecho para colmados y negocios de barrio en República Dominicana.',
  manifest: '/manifest.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a6e3d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}