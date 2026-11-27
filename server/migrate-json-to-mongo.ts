import 'dotenv/config';
import crypto from 'node:crypto';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import mongoose from 'mongoose';
import { DEFAULT_SITE_SETTINGS } from '../src/data/fleet.ts';
import type {
  AdminUserRecord,
  BookingRecord,
  Car,
  InquiryRecord,
  SiteSettings,
} from '../src/types/rental.ts';
import {
  AdminUserModel,
  BookingModel,
  CarModel,
  InquiryModel,
  SiteSettingsModel,
} from './models.ts';
import { persistImageBuffer } from './upload.ts';

interface LegacyStore {
  cars: Car[];
  bookings: BookingRecord[];
  inquiries: InquiryRecord[];
  settings: Partial<SiteSettings>;
  adminUsers: AdminUserRecord[];
}

const STORE_PATH = path.resolve(process.cwd(), 'data', 'store.json');
const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
const ASSET_IMAGES_ROOT = path.resolve(process.cwd(), 'src', 'assets', 'images');
const models = {
  cars: CarModel,
  bookings: BookingModel,
  inquiries: InquiryModel,
  settings: SiteSettingsModel,
  adminUsers: AdminUserModel,
};

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function normalizeForComparison(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeForComparison);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .filter((key) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key))
        .sort()
        .map((key) => [key, normalizeForComparison(record[key])]),
    );
  }
  return value;
}

function recordsMatch(existing: Record<string, unknown>, incoming: Record<string, unknown>) {
  const keys = Object.keys(incoming).filter(
    (key) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key),
  );
  return keys.every(
    (key) =>
      JSON.stringify(normalizeForComparison(existing[key])) ===
      JSON.stringify(normalizeForComparison(incoming[key])),
  );
}

function hasNewerTimestamp(incoming: Record<string, unknown>, existing: Record<string, unknown>) {
  const incomingDate = new Date(String(incoming.updatedAt || incoming.createdAt || 0)).getTime();
  const existingDate = new Date(String(existing.updatedAt || existing.createdAt || 0)).getTime();
  return Number.isFinite(incomingDate) && incomingDate > existingDate;
}

function assertUniqueValues(records: Record<string, unknown>[], key: string, collection: string) {
  const values = records.map((record) => String(record[key] ?? '')).filter(Boolean);
  if (values.length !== records.length || new Set(values).size !== values.length) {
    throw new Error(`The JSON source contains missing or duplicate ${collection} keys.`);
  }
}

function validateSource(value: unknown): LegacyStore {
  if (!value || typeof value !== 'object') throw new Error('The JSON store is not an object.');
  const store = value as Partial<LegacyStore>;
  if (
    !Array.isArray(store.cars) ||
    !Array.isArray(store.bookings) ||
    !Array.isArray(store.inquiries) ||
    !Array.isArray(store.adminUsers) ||
    !store.settings ||
    typeof store.settings !== 'object'
  ) {
    throw new Error('The JSON store is missing one or more application collections.');
  }
  assertUniqueValues(store.cars as unknown as Record<string, unknown>[], 'id', 'car');
  assertUniqueValues(
    store.bookings as unknown as Record<string, unknown>[],
    'bookingCode',
    'booking',
  );
  assertUniqueValues(
    store.inquiries as unknown as Record<string, unknown>[],
    'inquiryId',
    'inquiry',
  );
  assertUniqueValues(
    store.adminUsers as unknown as Record<string, unknown>[],
    'email',
    'admin user',
  );
  return {
    cars: store.cars,
    bookings: store.bookings,
    inquiries: store.inquiries,
    settings: store.settings,
    adminUsers: store.adminUsers,
  };
}

async function sha256(filePath: string): Promise<string> {
  return crypto.createHash('sha256').update(await fs.readFile(filePath)).digest('hex');
}

async function createBackup(backupRoot: string): Promise<string> {
  const source = await fs.readFile(STORE_PATH);
  await fs.mkdir(backupRoot, { recursive: true });
  const runDirectory = path.join(
    backupRoot,
    `migration-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}`,
  );
  await fs.mkdir(runDirectory, { recursive: false });
  const jsonBackup = path.join(runDirectory, 'store.json');
  await fs.writeFile(jsonBackup, source, { flag: 'wx' });
  if (crypto.createHash('sha256').update(source).digest('hex') !== (await sha256(jsonBackup))) {
    throw new Error('The source JSON backup could not be verified.');
  }
  try {
    await fs.access(UPLOADS_ROOT);
    const uploadsBackup = path.join(runDirectory, 'uploads');
    await fs.cp(UPLOADS_ROOT, uploadsBackup, { recursive: true, errorOnExist: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  try {
    await fs.access(ASSET_IMAGES_ROOT);
    const assetsBackup = path.join(runDirectory, 'source-images');
    await fs.cp(ASSET_IMAGES_ROOT, assetsBackup, { recursive: true, errorOnExist: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  return runDirectory;
}

async function backupMongoDatabase(directory: string) {
  const database = mongoose.connection.db;
  if (!database) throw new Error('MongoDB is not connected.');
  const snapshot: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    collections: {},
  };
  const collectionSnapshot = snapshot.collections as Record<string, unknown>;
  for (const [name, model] of Object.entries(models)) {
    collectionSnapshot[name] = await model.find({}).lean().exec();
  }

  const bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: 'carImages' });
  const imageFiles = await bucket.find({}).toArray();
  const imageDirectory = path.join(directory, 'carImages');
  await fs.mkdir(imageDirectory, { recursive: true });
  const imageManifest = [];
  for (const file of imageFiles) {
    const id = String(file._id);
    await pipeline(
      bucket.openDownloadStream(file._id),
      createWriteStream(path.join(imageDirectory, `${id}.bin`), {
        flags: 'wx',
      }),
    );
    imageManifest.push({
      id,
      filename: file.filename,
      length: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
    });
  }
  snapshot.carImages = imageManifest;
  await fs.writeFile(
    path.join(directory, 'mongodb-before-migration.json'),
    JSON.stringify(snapshot, null, 2),
    { flag: 'wx' },
  );
}

function getLocalImagePath(url: string): string | null {
  const locations = [
    { prefix: '/uploads/', root: UPLOADS_ROOT },
    { prefix: '/src/assets/images/', root: ASSET_IMAGES_ROOT },
  ];
  const location = locations.find(({ prefix }) => url.startsWith(prefix));
  if (!location) return null;
  const relativePath = url.slice(location.prefix.length);
  const resolved = path.resolve(location.root, relativePath);
  if (!resolved.startsWith(`${location.root}${path.sep}`)) {
    throw new Error('A local image URL escapes its source directory.');
  }
  return resolved;
}

function getImageMimeType(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      throw new Error('A legacy upload has an unsupported image format.');
  }
}

function carImageUrls(car: Partial<Car>): string[] {
  return [car.imageUrl, ...(car.images ?? [])].filter(
    (url): url is string => typeof url === 'string',
  );
}

function settingsImageUrls(settings: Partial<SiteSettings>): string[] {
  const urls = [settings.logoUrl];
  for (const override of Object.values(settings.pageSeo ?? {})) {
    urls.push(override?.ogImage);
  }
  return urls.filter((url): url is string => typeof url === 'string');
}

async function migrateLegacyImages(urls: string[]): Promise<Map<string, string>> {
  const mapping = new Map<string, string>();
  const sources = new Map<string, { localPath: string; buffer: Buffer }>();
  for (const url of new Set(urls)) {
    const localPath = getLocalImagePath(url);
    if (!localPath) continue;
    try {
      sources.set(url, { localPath, buffer: await fs.readFile(localPath) });
    } catch {
      throw new Error('A referenced local image is missing; image migration was stopped.');
    }
  }

  const database = mongoose.connection.db;
  if (!database) throw new Error('MongoDB is not connected.');
  const bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: 'carImages' });

  for (const [url, source] of sources) {
    const { localPath, buffer } = source;
    const sha = crypto.createHash('sha256').update(buffer).digest('hex');
    const existing = await bucket.find({ 'metadata.migrationSourcePath': url }).toArray();
    if (existing.length > 1) {
      throw new Error('Duplicate GridFS records exist for a legacy image path.');
    }
    if (existing[0]) {
      if (existing[0].metadata?.sha256 !== sha) {
        throw new Error('A legacy image has changed since its prior migration.');
      }
      mapping.set(url, `/api/images/${String(existing[0]._id)}`);
      continue;
    }

    const durableUrl = await persistImageBuffer(
      buffer,
      getImageMimeType(localPath),
      path.basename(localPath),
      { purpose: 'migrated-car-image', migrationSourcePath: url },
    );
    mapping.set(url, durableUrl);
  }
  return mapping;
}

function rewriteCarImages(car: Car, mapping: Map<string, string>): Car {
  return {
    ...car,
    imageUrl: mapping.get(car.imageUrl) ?? car.imageUrl,
    images: car.images.map((image) => mapping.get(image) ?? image),
  };
}

function rewriteSettingsImages(
  settings: Partial<SiteSettings>,
  mapping: Map<string, string>,
): Partial<SiteSettings> {
  const pageSeo = settings.pageSeo
    ? Object.fromEntries(
        Object.entries(settings.pageSeo).map(([key, override]) => [
          key,
          {
            ...override,
            ogImage:
              override?.ogImage && mapping.has(override.ogImage)
                ? mapping.get(override.ogImage)
                : override?.ogImage,
          },
        ]),
      )
    : undefined;
  return {
    ...settings,
    logoUrl: settings.logoUrl ? mapping.get(settings.logoUrl) ?? settings.logoUrl : '',
    ...(pageSeo ? { pageSeo } : {}),
  };
}

async function rewriteExistingMongoImages(mapping: Map<string, string>) {
  if (mapping.size === 0) return;
  const cars = await CarModel.find({}).lean();
  for (const rawCar of cars) {
    const car = rawCar as unknown as Car;
    const updated = rewriteCarImages(car, mapping);
    if (
      updated.imageUrl !== car.imageUrl ||
      JSON.stringify(updated.images) !== JSON.stringify(car.images)
    ) {
      await CarModel.updateOne(
        { id: car.id },
        { $set: { imageUrl: updated.imageUrl, images: updated.images } },
        { timestamps: false },
      );
    }
  }
  const settings = await SiteSettingsModel.findOne({ key: 'primary' }).lean();
  if (settings) {
    const current = settings as unknown as SiteSettings;
    const updated = rewriteSettingsImages(current, mapping);
    if (
      updated.logoUrl !== current.logoUrl ||
      JSON.stringify(updated.pageSeo) !== JSON.stringify(current.pageSeo)
    ) {
      await SiteSettingsModel.updateOne(
        { key: 'primary' },
        { $set: { logoUrl: updated.logoUrl, pageSeo: updated.pageSeo } },
        { timestamps: false },
      );
    }
  }
}

async function upsertSafely(
  model: (typeof models)[keyof typeof models],
  key: string,
  record: Record<string, unknown>,
  allowNewerUpdate: boolean,
): Promise<'inserted' | 'updated' | 'unchanged' | 'conflict'> {
  const filter = { [key]: record[key] };
  const existing = (await model.findOne(filter).lean()) as
    | Record<string, unknown>
    | null;
  if (!existing) {
    const result = await model.updateOne(
      filter,
      { $setOnInsert: record },
      { upsert: true, timestamps: false },
    );
    return result.upsertedCount > 0 ? 'inserted' : 'unchanged';
  }
  if (recordsMatch(existing, record)) return 'unchanged';
  if (allowNewerUpdate && hasNewerTimestamp(record, existing)) {
    const { _id: _ignoredId, ...fields } = record;
    await model.updateOne(filter, { $set: fields }, { runValidators: true, timestamps: false });
    return 'updated';
  }
  return 'conflict';
}

async function importRecords(store: LegacyStore, mapping: Map<string, string>) {
  const counts = {
    inserted: 0,
    updated: 0,
    unchanged: 0,
    conflicts: 0,
  };
  const collections = [
    {
      model: CarModel,
      key: 'id',
      records: store.cars.map((car) => rewriteCarImages(car, mapping)),
      allowNewerUpdate: true,
    },
    {
      model: BookingModel,
      key: 'bookingCode',
      records: store.bookings,
      allowNewerUpdate: false,
    },
    {
      model: InquiryModel,
      key: 'inquiryId',
      records: store.inquiries,
      allowNewerUpdate: false,
    },
    {
      model: SiteSettingsModel,
      key: 'key',
      records: [{ ...DEFAULT_SITE_SETTINGS, ...rewriteSettingsImages(store.settings, mapping), key: 'primary' }],
      allowNewerUpdate: true,
    },
    {
      model: AdminUserModel,
      key: 'email',
      records: store.adminUsers,
      allowNewerUpdate: false,
    },
  ];

  for (const collection of collections) {
    for (const record of collection.records) {
      const outcome = await upsertSafely(
        collection.model,
        collection.key,
        record as unknown as Record<string, unknown>,
        collection.allowNewerUpdate,
      );
      counts[outcome === 'conflict' ? 'conflicts' : outcome] += 1;
    }
  }
  return counts;
}

async function runMigration() {
  const backupArgument = getArgument('--backup-dir');
  if (!backupArgument || !path.isAbsolute(backupArgument)) {
    throw new Error('Pass an absolute --backup-dir outside the application repository.');
  }
  const backupRoot = path.resolve(backupArgument);
  const repositoryRoot = path.resolve(process.cwd());
  if (backupRoot === repositoryRoot || backupRoot.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new Error('The backup directory must be outside the application repository.');
  }
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error('MONGODB_URI is required for migration.');

  const backupDirectory = await createBackup(backupRoot);
  const source = validateSource(JSON.parse(await fs.readFile(STORE_PATH, 'utf8')) as unknown);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    maxPoolSize: 5,
    retryReads: true,
    retryWrites: true,
  });

  try {
    await backupMongoDatabase(backupDirectory);
    await Promise.all(Object.values(models).map((model) => model.init()));

    const currentCars = (await CarModel.find({}).lean()) as unknown as Car[];
    const currentSettings = (await SiteSettingsModel.find({}).lean()) as unknown as SiteSettings[];
    const sourceSlugs = new Map<string, string>();
    for (const car of source.cars) {
      if (!car.slug) continue;
      const owner = sourceSlugs.get(car.slug);
      if (owner && owner !== car.id) {
        throw new Error('The JSON source contains duplicate car slugs.');
      }
      sourceSlugs.set(car.slug, car.id);
    }
    const existingSlugs = new Map(
      currentCars.filter((car) => car.slug).map((car) => [car.slug!, car.id]),
    );
    for (const [slug, id] of sourceSlugs) {
      const owner = existingSlugs.get(slug);
      if (owner && owner !== id) {
        throw new Error('A car slug in JSON is already assigned to a different MongoDB car.');
      }
    }
    const imageUrls = [
      ...source.cars.flatMap(carImageUrls),
      ...currentCars.flatMap(carImageUrls),
      ...settingsImageUrls(source.settings),
      ...currentSettings.flatMap(settingsImageUrls),
    ];
    const imageMapping = await migrateLegacyImages(imageUrls);
    await rewriteExistingMongoImages(imageMapping);

    const counts = await importRecords(source, imageMapping);
    const report = {
      completedAt: new Date().toISOString(),
      sourceCounts: {
        cars: source.cars.length,
        bookings: source.bookings.length,
        inquiries: source.inquiries.length,
        adminUsers: source.adminUsers.length,
        settings: 1,
      },
      imagePathsMigrated: imageMapping.size,
      outcomes: counts,
      sourceJsonRetained: true,
      databaseBackup: 'mongodb-before-migration.json',
    };
    await fs.writeFile(
      path.join(backupDirectory, 'migration-report.json'),
      JSON.stringify(report, null, 2),
      { flag: 'wx' },
    );
    console.log(
      `Migration complete. Imported ${counts.inserted}, updated ${counts.updated}, preserved ${counts.unchanged}; conflicts: ${counts.conflicts}.`,
    );
    console.log(`Backups and report are retained at the requested backup directory.`);
    if (counts.conflicts > 0) {
      throw new Error(
        'Some existing MongoDB records differ from the JSON source. Both copies and the backup were retained; review the migration report before proceeding.',
      );
    }
  } finally {
    await mongoose.disconnect();
  }
}

runMigration().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown migration error.';
  console.error(`Migration stopped: ${message}`);
  process.exitCode = 1;
});
