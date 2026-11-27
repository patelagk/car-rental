import mongoose from 'mongoose';
import { DEFAULT_SITE_SETTINGS } from '../src/data/fleet.ts';
import { slugify } from '../src/data/seo.ts';
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

const mongoModels = [
  CarModel,
  BookingModel,
  InquiryModel,
  SiteSettingsModel,
  AdminUserModel,
];

function requireMongoConnection(): void {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB is unavailable. Check the MONGODB_URI and Atlas network access.');
  }
}

function normalizeSettings(settings: Partial<SiteSettings>): SiteSettings {
  return { ...DEFAULT_SITE_SETTINGS, ...settings };
}

function normalizeCar(raw: Record<string, unknown>): Car {
  const id = String(raw.id || '');
  const name = String(raw.name || '');
  const normalizeImageUrl = (value: string) =>
    value.startsWith('/src/assets/images/') ? value.replace(/\.jpe?g$/i, '.webp') : value;
  const images = Array.isArray(raw.images)
    ? raw.images.map((image) => normalizeImageUrl(String(image)))
    : raw.imageUrl
      ? [normalizeImageUrl(String(raw.imageUrl))]
      : [];
  const imageUrl = normalizeImageUrl(String(raw.imageUrl || images[0] || ''));

  return {
    id,
    slug: String(raw.slug || `${slugify(name) || 'car'}-${id}`),
    name,
    brand: String(raw.brand || ''),
    model: String(raw.model || ''),
    modelYear: Number(raw.modelYear || 2025),
    variant: String(raw.variant || 'Standard'),
    category: raw.category as Car['category'],
    transmission: raw.transmission as Car['transmission'],
    fuelType: raw.fuelType as Car['fuelType'],
    seats: Number(raw.seats || 5),
    acAvailable: raw.acAvailable !== undefined ? Boolean(raw.acAvailable) : true,
    dailyRateInr: Number(raw.dailyRateInr || 0),
    weeklyRateInr: raw.weeklyRateInr !== undefined ? Number(raw.weeklyRateInr) : undefined,
    monthlyRateInr: raw.monthlyRateInr !== undefined ? Number(raw.monthlyRateInr) : undefined,
    securityDepositInr: Number(raw.securityDepositInr || 3000),
    extraHourRateInr: Number(raw.extraHourRateInr || 200),
    freeKmPerDay: Number(raw.freeKmPerDay || 300),
    extraKmRateInr: Number(raw.extraKmRateInr || 10),
    mileageKmpl: String(raw.mileageKmpl || '16 km/l'),
    luggageCapacity: String(raw.luggageCapacity || '3 Bags'),
    registrationCode: String(raw.registrationCode || 'MP-04 Series'),
    description: String(raw.description || ''),
    seoTitle: String(raw.seoTitle || ''),
    seoDescription: String(raw.seoDescription || ''),
    imageAltText: String(raw.imageAltText || ''),
    imageUrl,
    images: images.length > 0 ? images : imageUrl ? [imageUrl] : [],
    highlights: Array.isArray(raw.highlights) ? raw.highlights.map(String) : [],
    featured: Boolean(raw.featured),
    status: (raw.status as Car['status']) || 'Available',
    isArchived: Boolean(raw.isArchived),
    blockedDates: Array.isArray(raw.blockedDates)
      ? (raw.blockedDates as Car['blockedDates'])
      : [],
    createdAt: raw.createdAt
      ? new Date(String(raw.createdAt)).toISOString()
      : new Date().toISOString(),
    updatedAt: raw.updatedAt
      ? new Date(String(raw.updatedAt)).toISOString()
      : new Date().toISOString(),
  };
}

export async function initDatabase(): Promise<{ engine: 'mongodb' }> {
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required. JSON/local filesystem storage is disabled.');
  }

  mongoose.connection.on('disconnected', () => {
    console.error('MongoDB connection lost; database operations are paused until it reconnects.');
  });
  mongoose.connection.on('error', (error: Error) => {
    console.error(`MongoDB connection error (${error.name}).`);
  });

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryReads: true,
      retryWrites: true,
    });
    await Promise.all(mongoModels.map((model) => model.init()));
  } catch (error) {
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      const errorName =
        disconnectError instanceof Error ? disconnectError.name : 'UnknownError';
      console.error(`MongoDB connection cleanup failed (${errorName}).`);
    }
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    throw new Error(
      `Unable to connect to MongoDB (${errorName}). Check the Render MONGODB_URI and Atlas network access.`,
    );
  }

  console.log('Database connected: MongoDB');
  return { engine: 'mongodb' };
}

export const db = {
  isMongo(): boolean {
    return mongoose.connection.readyState === 1;
  },

  async getAllCars(includeArchived = false): Promise<Car[]> {
    requireMongoConnection();
    const filter = includeArchived ? {} : { isArchived: { $ne: true } };
    const docs = await CarModel.find(filter).sort({ updatedAt: -1 }).lean();
    return docs.map((doc) => normalizeCar(doc as unknown as Record<string, unknown>));
  },

  async getCarById(id: string): Promise<Car | null> {
    requireMongoConnection();
    const doc = await CarModel.findOne({ id }).lean();
    return doc ? normalizeCar(doc as unknown as Record<string, unknown>) : null;
  },

  async createCar(car: Car): Promise<Car> {
    requireMongoConnection();
    const created = await CarModel.create(car);
    return normalizeCar(created.toObject() as unknown as Record<string, unknown>);
  },

  async updateCar(id: string, patch: Partial<Car>): Promise<Car | null> {
    requireMongoConnection();
    const updatedPatch = Object.fromEntries(
      Object.entries({ ...patch, updatedAt: new Date() }).filter(([, value]) => value !== undefined),
    );
    const doc = await CarModel.findOneAndUpdate(
      { id },
      { $set: updatedPatch },
      { new: true, runValidators: true },
    ).lean();
    return doc ? normalizeCar(doc as unknown as Record<string, unknown>) : null;
  },

  async archiveCar(id: string): Promise<Car | null> {
    return this.updateCar(id, { isArchived: true, featured: false, status: 'Unavailable' });
  },

  async getAllBookings(): Promise<BookingRecord[]> {
    requireMongoConnection();
    const docs = await BookingModel.find({}).sort({ createdAt: -1 }).lean();
    return docs as unknown as BookingRecord[];
  },

  async findBookings(query: string): Promise<BookingRecord[]> {
    const q = query.trim().toUpperCase();
    const digitsOnly = q.replace(/\D/g, '');
    const all = await this.getAllBookings();
    return all.filter(
      (booking) =>
        booking.bookingCode.toUpperCase() === q ||
        (digitsOnly.length >= 10 && booking.customerPhone === digitsOnly.slice(-10)),
    );
  },

  async createBooking(booking: BookingRecord): Promise<BookingRecord> {
    requireMongoConnection();
    const created = await BookingModel.create(booking);
    return created.toObject() as unknown as BookingRecord;
  },

  async getAllInquiries(): Promise<InquiryRecord[]> {
    requireMongoConnection();
    const docs = await InquiryModel.find({}).sort({ createdAt: -1 }).lean();
    return docs as unknown as InquiryRecord[];
  },

  async createInquiry(inquiry: InquiryRecord): Promise<InquiryRecord> {
    requireMongoConnection();
    const created = await InquiryModel.create(inquiry);
    return created.toObject() as unknown as InquiryRecord;
  },

  async getSettings(): Promise<SiteSettings> {
    requireMongoConnection();
    const doc = await SiteSettingsModel.findOne({ key: 'primary' }).lean();
    return normalizeSettings((doc ?? {}) as Partial<SiteSettings>);
  },

  async updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
    requireMongoConnection();
    const set = Object.fromEntries(
      Object.entries({ ...patch, updatedAt: new Date() }).filter(([, value]) => value !== undefined),
    );
    const setKeys = new Set(Object.keys(set));
    const defaults = Object.fromEntries(
      Object.entries(DEFAULT_SITE_SETTINGS).filter(([key]) => !setKeys.has(key)),
    );
    const doc = await SiteSettingsModel.findOneAndUpdate(
      { key: 'primary' },
      {
        $set: set,
        $setOnInsert: { key: 'primary', ...defaults },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    return normalizeSettings((doc ?? {}) as Partial<SiteSettings>);
  },

  async getAdminUsers(): Promise<AdminUserRecord[]> {
    requireMongoConnection();
    const docs = await AdminUserModel.find({}).lean();
    return docs as unknown as AdminUserRecord[];
  },

  async createAdminUser(admin: AdminUserRecord): Promise<AdminUserRecord> {
    requireMongoConnection();
    const created = await AdminUserModel.create(admin);
    return created.toObject() as unknown as AdminUserRecord;
  },
};
