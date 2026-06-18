import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

export async function resolveImageUrl(localFilePath: string): Promise<string> {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const filename = path.basename(localFilePath);
    return `/uploads/${filename}`;
  }

  try {
    const { v2: cld } = await import('cloudinary');
    cld.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
    const result = await cld.uploader.upload(localFilePath, { folder: 'beautyos/nail-designs', quality: 'auto', fetch_format: 'auto' });
    fs.unlink(localFilePath, () => {});
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary upload failed, using local:', err);
    return `/uploads/${path.basename(localFilePath)}`;
  }
}
