import crypto from 'node:crypto';
import mongoose from 'mongoose';
import multer from 'multer';

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

function getImageBucket(): InstanceType<typeof mongoose.mongo.GridFSBucket> {
  const database = mongoose.connection.db;
  if (!database || mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB is unavailable. Car images cannot be stored right now.');
  }
  return new mongoose.mongo.GridFSBucket(database, { bucketName: 'carImages' });
}

export async function persistImageBuffer(
  buffer: Buffer,
  mimetype: string,
  filename: string,
  metadata: Record<string, unknown> = {},
): Promise<string> {
  const bucket = getImageBucket();
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const upload = bucket.openUploadStream(filename, {
    metadata: { ...metadata, contentType: mimetype, sha256 },
  });
  await new Promise<void>((resolve, reject) => {
    upload.once('error', reject);
    upload.once('finish', resolve);
    upload.end(buffer);
  });
  return `/api/images/${(upload.id as mongoose.mongo.ObjectId).toHexString()}`;
}

export async function persistUploadedImage(file: Express.Multer.File): Promise<string> {
  const ext = ALLOWED_MIME_TO_EXT[file.mimetype];
  if (!ext) {
    throw new Error('Unsupported image format.');
  }
  const filename = `car_${crypto.randomUUID()}${ext}`;
  return persistImageBuffer(file.buffer, file.mimetype, filename, { purpose: 'car-image' });
}

export async function getStoredImage(
  id: string,
): Promise<{ stream: NodeJS.ReadableStream; contentType: string } | null> {
  if (!mongoose.mongo.ObjectId.isValid(id)) return null;
  const bucket = getImageBucket();
  const objectId = new mongoose.mongo.ObjectId(id);
  const [file] = await bucket.find({ _id: objectId }).toArray();
  if (!file) return null;
  return {
    stream: bucket.openDownloadStream(objectId),
    contentType:
      typeof file.metadata?.contentType === 'string'
        ? file.metadata.contentType
        : 'application/octet-stream',
  };
}
