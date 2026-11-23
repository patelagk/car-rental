import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';

export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
const CARS_UPLOAD_DIR = path.join(UPLOADS_ROOT, 'cars');

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per compressed image
    files: 8,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TO_EXT[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
  },
});

async function uploadToCloudinary(buffer: Buffer, mimetype: string): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'bhopal-wheel-cars';
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

  const form = new FormData();
  const ext = ALLOWED_MIME_TO_EXT[mimetype] || '.webp';
  const blob = new Blob([new Uint8Array(buffer)], { type: mimetype });
  form.append('file', blob, `car_${timestamp}${ext}`);
  form.append('folder', folder);
  form.append('timestamp', String(timestamp));
  form.append('api_key', apiKey);
  form.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    throw new Error('Cloud image upload failed.');
  }

  const data = (await response.json()) as { secure_url?: string };
  return data.secure_url || null;
}

export async function persistUploadedImage(file: Express.Multer.File): Promise<string> {
  const ext = ALLOWED_MIME_TO_EXT[file.mimetype];
  if (!ext) {
    throw new Error('Unsupported image format.');
  }

  const cloudUrl = await uploadToCloudinary(file.buffer, file.mimetype);
  if (cloudUrl) {
    return cloudUrl;
  }

  await fs.mkdir(CARS_UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const targetPath = path.resolve(CARS_UPLOAD_DIR, filename);

  // Path confinement check
  if (!targetPath.startsWith(CARS_UPLOAD_DIR + path.sep)) {
    throw new Error('Invalid upload path.');
  }

  await fs.writeFile(targetPath, file.buffer);
  return `/uploads/cars/${filename}`;
}
