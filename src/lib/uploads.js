import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

export const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads');

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export async function saveUpload(file) {
  if (!file || typeof file.arrayBuffer !== 'function' || !file.size) {
    return { error: 'No se recibió ninguna imagen.' };
  }
  if (file.size > MAX_BYTES) {
    return { error: 'La imagen es muy grande (máximo 3 MB).' };
  }

  const nameExt = (file.name || '').split('.').pop().toLowerCase();
  const ext = ALLOWED[file.type] || (['jpg', 'jpeg', 'png'].includes(nameExt) ? nameExt : null);
  if (!ext) {
    return { error: 'Formato no válido. Solo se aceptan JPG o PNG.' };
  }
  const finalExt = ext === 'jpeg' ? 'jpg' : ext;

  const filename = `${Date.now()}-${randomBytes(4).toString('hex')}.${finalExt}`;
  fs.mkdirSync(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadDir, filename), buffer);

  return { url: `/api/uploads/${filename}` };
}