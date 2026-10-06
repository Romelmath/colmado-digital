import fs from 'node:fs';
import path from 'node:path';
import { uploadDir } from '../../../../lib/uploads';

const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

export async function GET(req, { params }) {
  const { file } = await params;
  if (!/^[a-zA-Z0-9-]+\.(jpg|jpeg|png)$/i.test(file)) {
    return new Response('No encontrado', { status: 404 });
  }
  const full = path.join(uploadDir, file);
  if (!full.startsWith(uploadDir) || !fs.existsSync(full)) {
    return new Response('No encontrado', { status: 404 });
  }
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const data = fs.readFileSync(full);
  return new Response(data, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}