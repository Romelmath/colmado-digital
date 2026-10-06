import { notFound } from 'next/navigation';
import db from '../../../lib/db';
import PublicMenu from '../../components/PublicMenu';

export const dynamic = 'force-dynamic';

export default async function PublicCatalogPage({ params }) {
  const { slug } = await params;
  const biz = db.prepare('SELECT * FROM businesses WHERE slug = ?').get(slug);
  if (!biz) notFound();

  const products = db
    .prepare('SELECT * FROM products WHERE business_id = ? AND active = 1 ORDER BY category, name')
    .all(biz.id)
    .map((row) => ({ ...row }));

  return <PublicMenu business={{ ...biz }} products={products} />;
}