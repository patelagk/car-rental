import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { DEFAULT_SITE_SETTINGS, FLEET_CARS } from '../src/data/fleet.ts';
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

interface StoreData {
  cars: Car[];
  bookings: BookingRecord[];
  inquiries: InquiryRecord[];
  settings: SiteSettings;
  adminUsers: AdminUserRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

const SEED_BOOKINGS: BookingRecord[] = [
  {
    bookingCode: 'BW-2026-4108',
    carId: 'audi-a4-executive',
    carName: 'Audi A4 Executive',
    pickupHubId: 'mp-nagar',
    pickupHubName: 'MP Nagar Zone II Hub',
    pickupDate: '2026-11-28',
    returnDate: '2026-11-30',
    customerName: 'Vikramaditya Joshi',
    customerPhone: '9826054321',
    customerEmail: 'vikram.joshi@example.in',
    drivingLicenceNo: 'MP0420190048123',
    tripPurpose: 'Outstation MP',
    days: 2,
    rentalSubtotalInr: 5998,
    deliveryFeeInr: 0,
    securityDepositInr: 5000,
    totalPayableInr: 10998,
    status: 'Confirmed',
    createdAt: '2026-11-22T10:30:00.000Z',
  },
];

let useMongo = false;
let initialized = false;

function normalizeCar(raw: Record<string, unknown>): Car {
  const id = String(raw.id || '');
  const images = Array.isArray(raw.images)
    ? raw.images.map(String)
    : raw.imageUrl
      ? [String(raw.imageUrl)]
      : [];
  const imageUrl = String(raw.imageUrl || images[0] || '');

  return {
    id,
    name: String(raw.name || ''),
    brand: String(raw.brand || ''),
    model: String(raw.model || ''),
    modelYear: Number(raw.modelYear || 2025),
    variant: String(raw.variant || 'Standard'),
    category: (raw.category as Car['category']) || 'Hatchback',
    transmission: (raw.transmission as Car['transmission']) || 'Manual',
    fuelType: (raw.fuelType as Car['fuelType']) || 'Petrol',
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
    imageUrl,
    images: images.length > 0 ? images : imageUrl ? [imageUrl] : [],
    highlights: Array.isArray(raw.highlights) ? raw.highlights.map(String) : [],
    featured: Boolean(raw.featured),
    status: (raw.status as Car['status']) || 'Available',
    isArchived: Boolean(raw.isArchived),
    blockedDates: Array.isArray(raw.blockedDates)
      ? (raw.blockedDates as Car['blockedDates'])
      : [],
    createdAt: raw.createdAt ? new Date(String(raw.createdAt)).toISOString() : new Date().toISOString(),
    updatedAt: raw.updatedAt ? new Date(String(raw.updatedAt)).toISOString() : new Date().toISOString(),
  };
}

async function readJsonStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const cars =
      Array.isArray(parsed.cars) && parsed.cars.length > 0
        ? parsed.cars.map((c) => normalizeCar(c as unknown as Record<string, unknown>))
        : FLEET_CARS.map((c) => ({ ...c }));
    const bookings = Array.isArray(parsed.bookings) ? parsed.bookings : [...SEED_BOOKINGS];
    const inquiries = Array.isArray(parsed.inquiries) ? parsed.inquiries : [];
    const settings: SiteSettings = parsed.settings
      ? { ...DEFAULT_SITE_SETTINGS, ...parsed.settings }
      : { ...DEFAULT_SITE_SETTINGS };
    const adminUsers = Array.isArray(parsed.adminUsers) ? parsed.adminUsers : [];
    return { cars, bookings, inquiries, settings, adminUsers };
  } catch {
    const initial: StoreData = {
      cars: FLEET_CARS.map((c) => ({ ...c })),
      bookings: [...SEED_BOOKINGS],
      inquiries: [],
      settings: { ...DEFAULT_SITE_SETTINGS },
      adminUsers: [],
    };
    await writeJsonStore(initial);
    return initial;
  }
}

async function writeJsonStore(data: StoreData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function initDatabase(): Promise<{ engine: 'mongodb' | 'json-store' }> {
  if (initialized) {
    return { engine: useMongo ? 'mongodb' : 'json-store' };
  }

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      useMongo = true;

      const existingCars = await CarModel.countDocuments();
      if (existingCars === 0) {
        await CarModel.insertMany(FLEET_CARS);
      }

      const existingBookings = await BookingModel.countDocuments();
      if (existingBookings === 0) {
        await BookingModel.insertMany(SEED_BOOKINGS);
      }

      const existingSettings = await SiteSettingsModel.findOne({ key: 'primary' });
      if (!existingSettings) {
        await SiteSettingsModel.create({ key: 'primary', ...DEFAULT_SITE_SETTINGS });
      } else if (existingSettings.whatsappNumber === '919826012345') {
        await SiteSettingsModel.updateOne(
          { _id: existingSettings._id },
          { $set: { whatsappNumber: DEFAULT_SITE_SETTINGS.whatsappNumber } },
        );
      }

      initialized = true;
      console.log('Database connected: MongoDB');
      return { engine: 'mongodb' };
    } catch (err) {
      console.warn('MongoDB connection failed, using persistent local store fallback:', err);
    }
  }

  await readJsonStore();
  initialized = true;
  console.log('Database ready: Persistent JSON repository (set MONGODB_URI to enable MongoDB)');
  return { engine: 'json-store' };
}

export const db = {
  isMongo(): boolean {
    return useMongo;
  },

  async getAllCars(includeArchived = false): Promise<Car[]> {
    if (useMongo) {
      const filter = includeArchived ? {} : { isArchived: { $ne: true } };
      const docs = await CarModel.find(filter).sort({ updatedAt: -1 }).lean();
      return docs.map((d) => normalizeCar(d as unknown as Record<string, unknown>));
    }
    const store = await readJsonStore();
    return store.cars
      .filter((c) => includeArchived || !c.isArchived)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getCarById(id: string): Promise<Car | null> {
    if (useMongo) {
      const doc = await CarModel.findOne({ id }).lean();
      return doc ? normalizeCar(doc as unknown as Record<string, unknown>) : null;
    }
    const store = await readJsonStore();
    const found = store.cars.find((c) => c.id === id);
    return found ? normalizeCar(found as unknown as Record<string, unknown>) : null;
  },

  async createCar(car: Car): Promise<Car> {
    if (useMongo) {
      const created = await CarModel.create(car);
      return normalizeCar(created.toObject() as unknown as Record<string, unknown>);
    }
    const store = await readJsonStore();
    store.cars.unshift(car);
    await writeJsonStore(store);
    return car;
  },

  async updateCar(id: string, patch: Partial<Car>): Promise<Car | null> {
    const updatedPatch = { ...patch, updatedAt: new Date().toISOString() };
    if (useMongo) {
      const doc = await CarModel.findOneAndUpdate({ id }, { $set: updatedPatch }, { new: true }).lean();
      return doc ? normalizeCar(doc as unknown as Record<string, unknown>) : null;
    }
    const store = await readJsonStore();
    const idx = store.cars.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    store.cars[idx] = normalizeCar({ ...store.cars[idx], ...updatedPatch });
    await writeJsonStore(store);
    return store.cars[idx];
  },

  async archiveCar(id: string): Promise<Car | null> {
    return this.updateCar(id, { isArchived: true, featured: false, status: 'Unavailable' });
  },

  async getAllBookings(): Promise<BookingRecord[]> {
    if (useMongo) {
      const docs = await BookingModel.find({}).sort({ createdAt: -1 }).lean();
      return docs as unknown as BookingRecord[];
    }
    const store = await readJsonStore();
    return [...store.bookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async findBookings(query: string): Promise<BookingRecord[]> {
    const q = query.trim().toUpperCase();
    const digitsOnly = q.replace(/\D/g, '');
    const all = await this.getAllBookings();
    return all.filter(
      (b) =>
        b.bookingCode.toUpperCase() === q ||
        (digitsOnly.length >= 10 && b.customerPhone === digitsOnly.slice(-10)),
    );
  },

  async createBooking(booking: BookingRecord): Promise<BookingRecord> {
    if (useMongo) {
      const created = await BookingModel.create(booking);
      return created.toObject() as unknown as BookingRecord;
    }
    const store = await readJsonStore();
    store.bookings.unshift(booking);
    await writeJsonStore(store);
    return booking;
  },

  async getAllInquiries(): Promise<InquiryRecord[]> {
    if (useMongo) {
      const docs = await InquiryModel.find({}).sort({ createdAt: -1 }).lean();
      return docs as unknown as InquiryRecord[];
    }
    const store = await readJsonStore();
    return [...store.inquiries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async createInquiry(inquiry: InquiryRecord): Promise<InquiryRecord> {
    if (useMongo) {
      const created = await InquiryModel.create(inquiry);
      return created.toObject() as unknown as InquiryRecord;
    }
    const store = await readJsonStore();
    store.inquiries.unshift(inquiry);
    await writeJsonStore(store);
    return inquiry;
  },

  async getSettings(): Promise<SiteSettings> {
    if (useMongo) {
      const doc = await SiteSettingsModel.findOne({ key: 'primary' }).lean();
      if (doc) {
        return { ...DEFAULT_SITE_SETTINGS, ...(doc as unknown as SiteSettings) };
      }
      return { ...DEFAULT_SITE_SETTINGS };
    }
    const store = await readJsonStore();
    return { ...DEFAULT_SITE_SETTINGS, ...store.settings };
  },

  async updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
    const nextPatch = { ...patch, updatedAt: new Date().toISOString() };
    if (useMongo) {
      const doc = await SiteSettingsModel.findOneAndUpdate(
        { key: 'primary' },
        { $set: { key: 'primary', ...nextPatch } },
        { new: true, upsert: true },
      ).lean();
      return { ...DEFAULT_SITE_SETTINGS, ...(doc as unknown as SiteSettings) };
    }
    const store = await readJsonStore();
    store.settings = { ...store.settings, ...nextPatch };
    await writeJsonStore(store);
    return store.settings;
  },

  async getAdminUsers(): Promise<AdminUserRecord[]> {
    if (useMongo) {
      const docs = await AdminUserModel.find({}).lean();
      return docs as unknown as AdminUserRecord[];
    }
    const store = await readJsonStore();
    return store.adminUsers;
  },

  async createAdminUser(admin: AdminUserRecord): Promise<AdminUserRecord> {
    if (useMongo) {
      const created = await AdminUserModel.create(admin);
      return created.toObject() as unknown as AdminUserRecord;
    }
    const store = await readJsonStore();
    store.adminUsers.push(admin);
    await writeJsonStore(store);
    return admin;
  },
};
