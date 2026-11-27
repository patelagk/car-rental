import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer as createViteServer } from 'vite';
import {
  hashPassword,
  issueAdminToken,
  requireAdmin,
  timingSafeStringMatch,
  verifyPassword,
} from './server/auth.ts';
import type { AuthenticatedRequest } from './server/auth.ts';
import { db, initDatabase } from './server/db.ts';
import { persistUploadedImage, uploadMiddleware, UPLOADS_ROOT } from './server/upload.ts';
import { DEFAULT_SITE_SETTINGS, PICKUP_HUBS } from './src/data/fleet.ts';
import {
  getCarSlug,
  normalizePrimaryDomainUrl,
  SEO_PAGES,
  slugify,
} from './src/data/seo.ts';
import {
  buildRobotsTxt,
  buildSitemapXml,
  getSeoStaticPaths,
  renderSeoDocument,
} from './server/seo.ts';
import type {
  AvailabilityStatus,
  BlockedDateRange,
  BookingRecord,
  BookingRequest,
  Car,
  CarCategory,
  CarWithAvailability,
  DashboardStats,
  FuelType,
  InquiryRecord,
  InquiryRequest,
  SiteSettings,
  TransmissionType,
} from './src/types/rental.ts';

const VALID_CATEGORIES: CarCategory[] = ['Hatchback', 'Sedan', 'SUV', 'Luxury'];
const VALID_TRANSMISSIONS: TransmissionType[] = ['Manual', 'Automatic'];
const VALID_FUELS: FuelType[] = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Petrol / CNG'];
const VALID_STATUSES: AvailabilityStatus[] = [
  'Available',
  'Booked',
  'Unavailable',
  'Under Maintenance',
];

function calculateDays(pickupDate: string, returnDate: string): number {
  const start = new Date(pickupDate);
  const end = new Date(returnDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }
  const diffMs = end.getTime() - start.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

function datesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA;
}

function isSafeImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:')) return false; // Never store base64 images
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  );
}

function slugifyCarId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base || 'car'}-${suffix}`;
}

async function startServer() {
  const dbInfo = await initDatabase();
  await fs.mkdir(UPLOADS_ROOT, { recursive: true });

  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use((req, res, next) => {
    if (['24selfdrive.in', 'www.24selfdrive.in'].includes(req.hostname.toLowerCase())) {
      res.redirect(301, `https://24selfdrive.com${req.originalUrl}`);
      return;
    }
    next();
  });
  app.use('/uploads', express.static(UPLOADS_ROOT));

  // -------------------- PUBLIC API ROUTES --------------------

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: '24 Self Drive',
      database: dbInfo.engine,
    });
  });

  app.get('/api/settings', async (_req, res) => {
    try {
      const settings = await db.getSettings();
      res.json({ settings });
    } catch {
      res.status(500).json({ error: 'Unable to load website settings.' });
    }
  });

  app.get('/api/fleet', async (req, res) => {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : 'All';
      const transmission =
        typeof req.query.transmission === 'string' ? req.query.transmission : 'All';
      const pickupDate = typeof req.query.pickupDate === 'string' ? req.query.pickupDate : '';
      const returnDate = typeof req.query.returnDate === 'string' ? req.query.returnDate : '';

      const [allCars, allBookings, settings] = await Promise.all([
        db.getAllCars(false),
        db.getAllBookings(),
        db.getSettings(),
      ]);

      const days = pickupDate && returnDate ? calculateDays(pickupDate, returnDate) : 1;

      const cars: CarWithAvailability[] = allCars
        .filter((car) => {
          const matchCategory = category === 'All' || car.category === category;
          const matchTransmission =
            transmission === 'All' || car.transmission === transmission;
          return matchCategory && matchTransmission;
        })
        .map((car) => {
          let available = car.status === 'Available';
          let availabilityReason: string | undefined =
            car.status !== 'Available' ? car.status : undefined;
          let conflictDates: string | undefined;

          if (available && pickupDate && returnDate) {
            const conflictingBooking = allBookings.find(
              (b) =>
                b.carId === car.id &&
                b.status === 'Confirmed' &&
                datesOverlap(pickupDate, returnDate, b.pickupDate, b.returnDate),
            );
            if (conflictingBooking) {
              available = false;
              availabilityReason = 'Booked for selected dates';
              conflictDates = `${conflictingBooking.pickupDate} to ${conflictingBooking.returnDate}`;
            } else {
              const blocked = (car.blockedDates || []).find((blk) =>
                datesOverlap(pickupDate, returnDate, blk.startDate, blk.endDate),
              );
              if (blocked) {
                available = false;
                availabilityReason = blocked.reason || 'Unavailable for selected dates';
                conflictDates = `${blocked.startDate} to ${blocked.endDate}`;
              }
            }
          }

          return {
            ...car,
            available,
            availabilityReason,
            days,
            estimatedRentalInr: car.dailyRateInr * days,
            conflictDates,
          };
        });

      res.json({ cars, hubs: PICKUP_HUBS, settings });
    } catch {
      res.status(500).json({ error: 'Unable to load fleet availability.' });
    }
  });

  app.post('/api/bookings', async (req, res) => {
    try {
      const body = req.body as Partial<BookingRequest>;
      if (!body.carId || !body.pickupHubId) {
        res.status(400).json({ error: 'Please select a valid vehicle and Bhopal pickup hub.' });
        return;
      }

      const [car, allBookings] = await Promise.all([
        db.getCarById(body.carId),
        db.getAllBookings(),
      ]);
      const hub = PICKUP_HUBS.find((h) => h.id === body.pickupHubId);

      if (!car || car.isArchived || !hub) {
        res.status(400).json({ error: 'Selected vehicle or pickup hub is unavailable.' });
        return;
      }

      if (car.status !== 'Available') {
        res.status(409).json({
          error: `${car.name} is currently marked as ${car.status}. Please select another available vehicle.`,
        });
        return;
      }

      if (
        !body.customerName ||
        body.customerName.trim().length < 2 ||
        !body.customerPhone ||
        !/^[6-9]\d{9}$/.test(body.customerPhone.replace(/\D/g, '').slice(-10)) ||
        !body.customerEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customerEmail.trim()) ||
        !body.drivingLicenceNo ||
        body.drivingLicenceNo.trim().length < 6 ||
        !body.pickupDate ||
        !body.returnDate
      ) {
        res.status(400).json({
          error:
            'Please provide a valid name, 10-digit Indian mobile number, email, driving licence number, and trip dates.',
        });
        return;
      }

      if (body.returnDate <= body.pickupDate) {
        res.status(400).json({ error: 'Return date must be at least 1 day after pickup date.' });
        return;
      }

      const conflict = allBookings.find(
        (b) =>
          b.carId === car.id &&
          b.status === 'Confirmed' &&
          datesOverlap(body.pickupDate!, body.returnDate!, b.pickupDate, b.returnDate),
      );
      if (conflict) {
        res.status(409).json({
          error: `${car.name} is already reserved from ${conflict.pickupDate} to ${conflict.returnDate}. Choose different dates or another vehicle.`,
        });
        return;
      }

      const blocked = (car.blockedDates || []).find((blk) =>
        datesOverlap(body.pickupDate!, body.returnDate!, blk.startDate, blk.endDate),
      );
      if (blocked) {
        res.status(409).json({
          error: `${car.name} is blocked (${blocked.reason}) from ${blocked.startDate} to ${blocked.endDate}.`,
        });
        return;
      }

      const days = calculateDays(body.pickupDate, body.returnDate);
      const rentalSubtotalInr = days * car.dailyRateInr;
      const deliveryFeeInr = hub.deliveryFeeInr;
      const securityDepositInr = car.securityDepositInr;
      const totalPayableInr = rentalSubtotalInr + deliveryFeeInr + securityDepositInr;

      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const booking: BookingRecord = {
        bookingCode: `BW-2026-${randomCode}`,
        carId: car.id,
        carName: car.name,
        pickupHubId: hub.id,
        pickupHubName: hub.name,
        pickupDate: body.pickupDate,
        returnDate: body.returnDate,
        customerName: body.customerName.trim(),
        customerPhone: body.customerPhone.replace(/\D/g, '').slice(-10),
        customerEmail: body.customerEmail.trim(),
        drivingLicenceNo: body.drivingLicenceNo.trim().toUpperCase(),
        tripPurpose: body.tripPurpose ?? 'Local Bhopal',
        days,
        rentalSubtotalInr,
        deliveryFeeInr,
        securityDepositInr,
        totalPayableInr,
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
      };

      await db.createBooking(booking);
      res.status(201).json({ booking });
    } catch {
      res.status(500).json({ error: 'Failed to create reservation. Please try again.' });
    }
  });

  app.get('/api/bookings/:query', async (req, res) => {
    try {
      const q = req.params.query.trim();
      if (!q) {
        res.status(400).json({ error: 'Enter a booking ID or mobile number.' });
        return;
      }
      const matches = await db.findBookings(q);
      if (matches.length === 0) {
        res.status(404).json({ error: `No reservation found for "${req.params.query}".` });
        return;
      }
      res.json({ bookings: matches });
    } catch {
      res.status(500).json({ error: 'Failed to retrieve booking.' });
    }
  });

  app.post('/api/inquiries', async (req, res) => {
    try {
      const body = req.body as Partial<InquiryRequest>;
      if (
        !body.name ||
        body.name.trim().length < 2 ||
        !body.phone ||
        !/^[6-9]\d{9}$/.test(body.phone.replace(/\D/g, '').slice(-10)) ||
        !body.route
      ) {
        res.status(400).json({
          error: 'Please enter your name, valid 10-digit mobile number, and trip route.',
        });
        return;
      }

      const inquiry: InquiryRecord = {
        inquiryId: `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
        name: body.name.trim(),
        phone: body.phone.replace(/\D/g, '').slice(-10),
        route: body.route.trim(),
        preferredCategory: body.preferredCategory ?? 'Any',
        travelDate: body.travelDate ?? '',
        notes: (body.notes ?? '').trim(),
        createdAt: new Date().toISOString(),
      };

      await db.createInquiry(inquiry);
      res.status(201).json({ inquiry });
    } catch {
      res.status(500).json({ error: 'Failed to submit inquiry.' });
    }
  });

  // -------------------- ADMIN AUTH ROUTES --------------------

  app.get('/api/admin/auth-status', async (_req, res) => {
    try {
      const envPassword = process.env.ADMIN_PASSWORD?.trim();
      const admins = await db.getAdminUsers();
      const needsSetup = !envPassword && admins.length === 0;
      res.json({
        needsSetup,
        envConfigured: Boolean(envPassword),
      });
    } catch {
      res.status(500).json({ error: 'Unable to check admin authentication status.' });
    }
  });

  app.post('/api/admin/setup', async (req, res) => {
    try {
      const envPassword = process.env.ADMIN_PASSWORD?.trim();
      if (envPassword) {
        res.status(403).json({
          error: 'Admin credentials are configured via server environment variables.',
        });
        return;
      }

      const existing = await db.getAdminUsers();
      if (existing.length > 0) {
        res.status(409).json({
          error: 'An admin account has already been claimed. Please sign in.',
        });
        return;
      }

      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        res.status(400).json({ error: 'Please enter a valid admin email address.' });
        return;
      }
      if (!password || password.length < 8) {
        res.status(400).json({ error: 'Admin password must be at least 8 characters.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const { hash, salt } = hashPassword(password);
      await db.createAdminUser({
        email: normalizedEmail,
        passwordHash: hash,
        salt,
        role: 'admin',
        createdAt: new Date().toISOString(),
      });

      const token = issueAdminToken(normalizedEmail);
      res.status(201).json({
        token,
        admin: { email: normalizedEmail, role: 'admin' },
      });
    } catch {
      res.status(500).json({ error: 'Failed to complete admin setup.' });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const envPassword = process.env.ADMIN_PASSWORD?.trim();
      const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

      if (envPassword) {
        const emailMatches = envEmail ? timingSafeStringMatch(normalizedEmail, envEmail) : true;
        const passMatches = timingSafeStringMatch(password, envPassword);
        if (!emailMatches || !passMatches) {
          res.status(401).json({ error: 'Invalid admin email or password.' });
          return;
        }
        const token = issueAdminToken(normalizedEmail);
        res.json({ token, admin: { email: normalizedEmail, role: 'admin' } });
        return;
      }

      const admins = await db.getAdminUsers();
      const admin = admins.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!admin || !verifyPassword(password, admin.passwordHash, admin.salt)) {
        res.status(401).json({ error: 'Invalid admin email or password.' });
        return;
      }

      const token = issueAdminToken(admin.email);
      res.json({ token, admin: { email: admin.email, role: 'admin' } });
    } catch {
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  });

  app.get('/api/admin/me', requireAdmin, (req: AuthenticatedRequest, res) => {
    res.json({ admin: req.adminUser });
  });

  // -------------------- PROTECTED ADMIN API ROUTES --------------------

  app.get('/api/admin/dashboard', requireAdmin, async (_req, res) => {
    try {
      const [cars, bookings, inquiries] = await Promise.all([
        db.getAllCars(false),
        db.getAllBookings(),
        db.getAllInquiries(),
      ]);

      const stats: DashboardStats = {
        totalCars: cars.length,
        availableCars: cars.filter((c) => c.status === 'Available').length,
        bookedCars: cars.filter((c) => c.status === 'Booked').length,
        unavailableCars: cars.filter((c) => c.status === 'Unavailable').length,
        maintenanceCars: cars.filter((c) => c.status === 'Under Maintenance').length,
        totalBookingInquiries: bookings.length + inquiries.length,
        totalConfirmedBookings: bookings.length,
        totalOutstationInquiries: inquiries.length,
      };

      const recentCars = [...cars]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      res.json({
        stats,
        recentCars,
        recentBookings: bookings.slice(0, 6),
        allBookings: bookings,
        recentInquiries: inquiries.slice(0, 6),
        databaseEngine: db.isMongo() ? 'MongoDB' : 'Local Persistent Store',
      });
    } catch {
      res.status(500).json({ error: 'Unable to load dashboard analytics.' });
    }
  });

  app.get('/api/admin/cars', requireAdmin, async (req, res) => {
    try {
      const includeArchived = req.query.includeArchived === 'true';
      const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
      const category = typeof req.query.category === 'string' ? req.query.category : 'All';
      const status = typeof req.query.status === 'string' ? req.query.status : 'All';

      const all = await db.getAllCars(includeArchived);
      const filtered = all.filter((c) => {
        const matchSearch =
          !search ||
          c.name.toLowerCase().includes(search) ||
          c.brand.toLowerCase().includes(search) ||
          c.model.toLowerCase().includes(search);
        const matchCat = category === 'All' || c.category === category;
        const matchStatus = status === 'All' || c.status === status;
        return matchSearch && matchCat && matchStatus;
      });

      res.json({ cars: filtered });
    } catch {
      res.status(500).json({ error: 'Unable to fetch cars.' });
    }
  });

  app.get('/api/admin/cars/:id', requireAdmin, async (req, res) => {
    try {
      const carId = String(req.params.id);
      const [car, allBookings] = await Promise.all([db.getCarById(carId), db.getAllBookings()]);
      if (!car) {
        res.status(404).json({ error: 'Car not found.' });
        return;
      }
      const carBookings = allBookings.filter((b) => b.carId === car.id);
      res.json({ car, bookings: carBookings });
    } catch {
      res.status(500).json({ error: 'Unable to load car details.' });
    }
  });

  app.post('/api/admin/cars', requireAdmin, async (req, res) => {
    try {
      const body = req.body as Partial<Car>;
      if (
        !body.name?.trim() ||
        !body.brand?.trim() ||
        !body.model?.trim() ||
        !body.modelYear ||
        !VALID_CATEGORIES.includes(body.category as CarCategory) ||
        !VALID_TRANSMISSIONS.includes(body.transmission as TransmissionType) ||
        !VALID_FUELS.includes(body.fuelType as FuelType) ||
        !body.seats ||
        body.dailyRateInr === undefined ||
        Number(body.dailyRateInr) <= 0 ||
        body.securityDepositInr === undefined ||
        Number(body.securityDepositInr) < 0 ||
        body.extraHourRateInr === undefined ||
        Number(body.extraHourRateInr) < 0
      ) {
        res.status(400).json({
          error:
            'Please fill all required fields: name, brand, model, year, category, transmission, fuel type, seats, daily price, security deposit, and extra hour charges.',
        });
        return;
      }

      const rawImages = Array.isArray(body.images) ? body.images : [];
      const cleanImages = rawImages.filter((u) => isSafeImageUrl(u));
      const primaryImage =
        body.imageUrl && isSafeImageUrl(body.imageUrl)
          ? body.imageUrl.trim()
          : cleanImages[0];

      if (!primaryImage) {
        res.status(400).json({
          error: 'At least one valid uploaded image URL is required (base64 is not allowed).',
        });
        return;
      }

      const mergedImages = cleanImages.includes(primaryImage)
        ? cleanImages
        : [primaryImage, ...cleanImages];

      const now = new Date().toISOString();
      const id = slugifyCarId(body.name.trim());
      const newCar: Car = {
        id,
        slug: `${slugify(body.name.trim()) || 'car'}-${id}`,
        name: body.name.trim(),
        brand: body.brand.trim(),
        model: body.model.trim(),
        modelYear: Number(body.modelYear),
        variant: (body.variant || `${body.model.trim()} ${body.transmission}`).trim(),
        category: body.category as CarCategory,
        transmission: body.transmission as TransmissionType,
        fuelType: body.fuelType as FuelType,
        seats: Number(body.seats),
        acAvailable: body.acAvailable !== undefined ? Boolean(body.acAvailable) : true,
        dailyRateInr: Number(body.dailyRateInr),
        weeklyRateInr:
          body.weeklyRateInr !== undefined && Number(body.weeklyRateInr) > 0
            ? Number(body.weeklyRateInr)
            : undefined,
        monthlyRateInr:
          body.monthlyRateInr !== undefined && Number(body.monthlyRateInr) > 0
            ? Number(body.monthlyRateInr)
            : undefined,
        securityDepositInr: Number(body.securityDepositInr),
        extraHourRateInr: Number(body.extraHourRateInr),
        freeKmPerDay: Number(body.freeKmPerDay || 300),
        extraKmRateInr: Number(body.extraKmRateInr || 10),
        mileageKmpl: body.mileageKmpl?.trim() || '16.5 km/l',
        luggageCapacity: body.luggageCapacity?.trim() || '3 Bags',
        registrationCode: body.registrationCode?.trim() || 'MP-04 Series',
        description: body.description?.trim() || '',
        seoTitle: body.seoTitle?.trim() || '',
        seoDescription: body.seoDescription?.trim() || '',
        imageAltText: body.imageAltText?.trim() || '',
        imageUrl: primaryImage,
        images: mergedImages,
        highlights: Array.isArray(body.highlights)
          ? body.highlights.map((h) => String(h).trim()).filter(Boolean)
          : [],
        featured: Boolean(body.featured),
        status: VALID_STATUSES.includes(body.status as AvailabilityStatus)
          ? (body.status as AvailabilityStatus)
          : 'Available',
        isArchived: false,
        blockedDates: [],
        createdAt: now,
        updatedAt: now,
      };

      const created = await db.createCar(newCar);
      res.status(201).json({ car: created });
    } catch {
      res.status(500).json({ error: 'Failed to create car.' });
    }
  });

  app.put('/api/admin/cars/:id', requireAdmin, async (req, res) => {
    try {
      const carId = String(req.params.id);
      const existing = await db.getCarById(carId);
      if (!existing) {
        res.status(404).json({ error: 'Car not found.' });
        return;
      }

      const body = req.body as Partial<Car>;
      if (body.category && !VALID_CATEGORIES.includes(body.category)) {
        res.status(400).json({ error: 'Invalid car category.' });
        return;
      }
      if (body.transmission && !VALID_TRANSMISSIONS.includes(body.transmission)) {
        res.status(400).json({ error: 'Invalid transmission type.' });
        return;
      }
      if (body.fuelType && !VALID_FUELS.includes(body.fuelType)) {
        res.status(400).json({ error: 'Invalid fuel type.' });
        return;
      }
      if (body.status && !VALID_STATUSES.includes(body.status)) {
        res.status(400).json({ error: 'Invalid availability status.' });
        return;
      }

      let nextImages = existing.images;
      if (Array.isArray(body.images)) {
        const clean = body.images.filter((u) => isSafeImageUrl(u));
        if (clean.length === 0) {
          res.status(400).json({ error: 'Vehicle must retain at least one valid image URL.' });
          return;
        }
        nextImages = clean;
      }

      let nextPrimary = existing.imageUrl;
      if (body.imageUrl !== undefined) {
        if (!isSafeImageUrl(body.imageUrl)) {
          res.status(400).json({ error: 'Primary image must be a valid URL (no base64).' });
          return;
        }
        nextPrimary = body.imageUrl.trim();
        if (!nextImages.includes(nextPrimary)) {
          nextImages = [nextPrimary, ...nextImages];
        }
      } else if (!nextImages.includes(nextPrimary)) {
        nextPrimary = nextImages[0];
      }

      const updated = await db.updateCar(carId, {
        name: body.name?.trim() ?? existing.name,
        brand: body.brand?.trim() ?? existing.brand,
        model: body.model?.trim() ?? existing.model,
        modelYear: body.modelYear !== undefined ? Number(body.modelYear) : existing.modelYear,
        variant: body.variant?.trim() ?? existing.variant,
        category: body.category ?? existing.category,
        transmission: body.transmission ?? existing.transmission,
        fuelType: body.fuelType ?? existing.fuelType,
        seats: body.seats !== undefined ? Number(body.seats) : existing.seats,
        acAvailable: body.acAvailable !== undefined ? Boolean(body.acAvailable) : existing.acAvailable,
        dailyRateInr:
          body.dailyRateInr !== undefined ? Number(body.dailyRateInr) : existing.dailyRateInr,
        weeklyRateInr:
          body.weeklyRateInr !== undefined
            ? Number(body.weeklyRateInr) || undefined
            : existing.weeklyRateInr,
        monthlyRateInr:
          body.monthlyRateInr !== undefined
            ? Number(body.monthlyRateInr) || undefined
            : existing.monthlyRateInr,
        securityDepositInr:
          body.securityDepositInr !== undefined
            ? Number(body.securityDepositInr)
            : existing.securityDepositInr,
        extraHourRateInr:
          body.extraHourRateInr !== undefined
            ? Number(body.extraHourRateInr)
            : existing.extraHourRateInr,
        freeKmPerDay:
          body.freeKmPerDay !== undefined ? Number(body.freeKmPerDay) : existing.freeKmPerDay,
        extraKmRateInr:
          body.extraKmRateInr !== undefined ? Number(body.extraKmRateInr) : existing.extraKmRateInr,
        mileageKmpl: body.mileageKmpl?.trim() ?? existing.mileageKmpl,
        luggageCapacity: body.luggageCapacity?.trim() ?? existing.luggageCapacity,
        description: body.description?.trim() ?? existing.description,
        seoTitle: body.seoTitle?.trim() ?? existing.seoTitle ?? '',
        seoDescription: body.seoDescription?.trim() ?? existing.seoDescription ?? '',
        imageAltText: body.imageAltText?.trim() ?? existing.imageAltText ?? '',
        highlights: Array.isArray(body.highlights)
          ? body.highlights.map((h) => String(h).trim()).filter(Boolean)
          : existing.highlights,
        featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
        status: body.status ?? existing.status,
        imageUrl: nextPrimary,
        images: nextImages,
      });

      res.json({ car: updated });
    } catch {
      res.status(500).json({ error: 'Failed to update car details.' });
    }
  });

  app.patch('/api/admin/cars/:id/price', requireAdmin, async (req, res) => {
    try {
      const carId = String(req.params.id);
      const existing = await db.getCarById(carId);
      if (!existing) {
        res.status(404).json({ error: 'Car not found.' });
        return;
      }

      const {
        dailyRateInr,
        weeklyRateInr,
        monthlyRateInr,
        securityDepositInr,
        extraHourRateInr,
        extraKmRateInr,
      } = req.body as Partial<Car>;

      if (
        dailyRateInr === undefined ||
        Number(dailyRateInr) <= 0 ||
        securityDepositInr === undefined ||
        Number(securityDepositInr) < 0 ||
        extraHourRateInr === undefined ||
        Number(extraHourRateInr) < 0
      ) {
        res.status(400).json({
          error: 'Daily price must be positive, and deposit / extra hour charges must be 0 or more.',
        });
        return;
      }

      const updated = await db.updateCar(carId, {
        dailyRateInr: Number(dailyRateInr),
        weeklyRateInr:
          weeklyRateInr !== undefined && Number(weeklyRateInr) > 0
            ? Number(weeklyRateInr)
            : undefined,
        monthlyRateInr:
          monthlyRateInr !== undefined && Number(monthlyRateInr) > 0
            ? Number(monthlyRateInr)
            : undefined,
        securityDepositInr: Number(securityDepositInr),
        extraHourRateInr: Number(extraHourRateInr),
        extraKmRateInr:
          extraKmRateInr !== undefined && Number(extraKmRateInr) >= 0
            ? Number(extraKmRateInr)
            : existing.extraKmRateInr,
      });

      res.json({ car: updated });
    } catch {
      res.status(500).json({ error: 'Failed to update pricing.' });
    }
  });

  app.patch('/api/admin/cars/:id/availability', requireAdmin, async (req, res) => {
    try {
      const carId = String(req.params.id);
      const existing = await db.getCarById(carId);
      if (!existing) {
        res.status(404).json({ error: 'Car not found.' });
        return;
      }

      const { status, addBlockedRange, removeBlockedRangeId } = req.body as {
        status?: AvailabilityStatus;
        addBlockedRange?: { startDate: string; endDate: string; reason: string };
        removeBlockedRangeId?: string;
      };

      const patch: Partial<Car> = {};

      if (status !== undefined) {
        if (!VALID_STATUSES.includes(status)) {
          res.status(400).json({ error: 'Invalid availability status.' });
          return;
        }
        patch.status = status;
      }

      let nextBlocked: BlockedDateRange[] = [...(existing.blockedDates || [])];

      if (removeBlockedRangeId) {
        nextBlocked = nextBlocked.filter((b) => b.id !== removeBlockedRangeId);
        patch.blockedDates = nextBlocked;
      }

      if (addBlockedRange) {
        const { startDate, endDate, reason } = addBlockedRange;
        if (!startDate || !endDate || endDate <= startDate) {
          res.status(400).json({ error: 'End date must be after start date.' });
          return;
        }

        const allBookings = await db.getAllBookings();
        const conflictingBooking = allBookings.find(
          (b) =>
            b.carId === existing.id &&
            b.status === 'Confirmed' &&
            datesOverlap(startDate, endDate, b.pickupDate, b.returnDate),
        );

        if (conflictingBooking) {
          res.status(409).json({
            error: `Cannot block dates overlapping confirmed booking ${conflictingBooking.bookingCode} (${conflictingBooking.pickupDate} to ${conflictingBooking.returnDate}).`,
          });
          return;
        }

        nextBlocked.push({
          id: `blk-${Date.now()}`,
          startDate,
          endDate,
          reason: reason?.trim() || 'Blocked by Admin',
        });
        patch.blockedDates = nextBlocked;
      }

      const updated = await db.updateCar(carId, patch);
      res.json({ car: updated });
    } catch {
      res.status(500).json({ error: 'Failed to update car availability.' });
    }
  });

  app.delete('/api/admin/cars/:id', requireAdmin, async (req, res) => {
    try {
      const carId = String(req.params.id);
      const archived = await db.archiveCar(carId);
      if (!archived) {
        res.status(404).json({ error: 'Car not found.' });
        return;
      }
      res.json({
        archived: true,
        car: archived,
        message: `${archived.name} has been archived. Booking history has been preserved.`,
      });
    } catch {
      res.status(500).json({ error: 'Failed to archive car.' });
    }
  });

  app.post(
    '/api/admin/upload',
    requireAdmin,
    (req, res, next) => {
      uploadMiddleware.array('images', 8)(req, res, (err) => {
        if (err) {
          res.status(400).json({ error: err instanceof Error ? err.message : 'Upload failed.' });
          return;
        }
        next();
      });
    },
    async (req, res) => {
      try {
        const files = (req.files as Express.Multer.File[]) || [];
        if (files.length === 0) {
          res.status(400).json({ error: 'Please select at least one image file to upload.' });
          return;
        }

        const urls: string[] = [];
        for (const file of files) {
          const url = await persistUploadedImage(file);
          urls.push(url);
        }

        res.status(201).json({ urls });
      } catch (err) {
        res.status(500).json({
          error: err instanceof Error ? err.message : 'Image upload processing failed.',
        });
      }
    },
  );

  app.get('/api/admin/settings', requireAdmin, async (_req, res) => {
    try {
      const [settings, cars] = await Promise.all([db.getSettings(), db.getAllCars(false)]);
      res.json({ settings, cars });
    } catch {
      res.status(500).json({ error: 'Unable to load settings.' });
    }
  });

  app.put('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      const body = req.body as Partial<SiteSettings>;
      if (
        !body.businessName?.trim() ||
        !body.whatsappNumber?.trim() ||
        !body.contactNumber?.trim() ||
        !body.businessAddress?.trim()
      ) {
        res.status(400).json({
          error: 'Business name, WhatsApp number, contact number, and address are required.',
        });
        return;
      }

      if (body.logoUrl && !isSafeImageUrl(body.logoUrl)) {
        res.status(400).json({ error: 'Logo must be a valid image URL (no base64).' });
        return;
      }

      const pageSeo: NonNullable<SiteSettings['pageSeo']> = {};
      if (body.pageSeo !== undefined) {
        if (!body.pageSeo || typeof body.pageSeo !== 'object' || Array.isArray(body.pageSeo)) {
          res.status(400).json({ error: 'Page SEO settings must be an object.' });
          return;
        }
        const pageCars = await db.getAllCars(false);
        const validPageKeys = new Set([
          ...SEO_PAGES.map((page) => page.key),
          ...pageCars.map((car) => `car:${getCarSlug(car)}`),
        ]);
        for (const [key, override] of Object.entries(body.pageSeo)) {
          if (!validPageKeys.has(key) || !override || typeof override !== 'object') continue;
          const clean = {
            title: typeof override.title === 'string' ? override.title.trim().slice(0, 70) : '',
            description:
              typeof override.description === 'string'
                ? override.description.trim().slice(0, 200)
                : '',
            canonicalUrl:
              typeof override.canonicalUrl === 'string'
                ? override.canonicalUrl.trim()
                : '',
            robots: override.robots,
            ogImage: typeof override.ogImage === 'string' ? override.ogImage.trim() : '',
          };
          if (clean.canonicalUrl.length > 2048) {
            res.status(400).json({ error: `Canonical URL for "${key}" is too long.` });
            return;
          }
          if (clean.canonicalUrl) {
            try {
              const canonicalUrl = new URL(clean.canonicalUrl);
              if (!['http:', 'https:'].includes(canonicalUrl.protocol)) throw new Error();
            } catch {
              res.status(400).json({ error: `Invalid canonical URL for "${key}".` });
              return;
            }
          }
          if (clean.ogImage && !isSafeImageUrl(clean.ogImage)) {
            res.status(400).json({ error: `Invalid Open Graph image URL for "${key}".` });
            return;
          }
          if (
            clean.robots !== undefined &&
            !['index,follow', 'noindex,follow', 'noindex,nofollow'].includes(clean.robots)
          ) {
            res.status(400).json({ error: `Invalid robots setting for "${key}".` });
            return;
          }
          pageSeo[key] = {
            title: clean.title,
            description: clean.description,
            canonicalUrl: clean.canonicalUrl,
            robots: clean.robots,
            ogImage: clean.ogImage,
          };
        }
      }

      if (
        body.googleSiteVerification !== undefined &&
        typeof body.googleSiteVerification !== 'string'
      ) {
        res.status(400).json({ error: 'Google Search Console verification token must be text.' });
        return;
      }
      const googleSiteVerification = body.googleSiteVerification?.trim() || '';
      if (googleSiteVerification && !/^[A-Za-z0-9_-]{1,200}$/.test(googleSiteVerification)) {
        res.status(400).json({ error: 'Invalid Google Search Console verification token.' });
        return;
      }
      if (body.ga4MeasurementId !== undefined && typeof body.ga4MeasurementId !== 'string') {
        res.status(400).json({ error: 'Google Analytics measurement ID must be text.' });
        return;
      }
      const ga4MeasurementId = body.ga4MeasurementId?.trim().toUpperCase() || '';
      if (ga4MeasurementId && !/^G-[A-Z0-9]{4,20}$/.test(ga4MeasurementId)) {
        res.status(400).json({ error: 'Google Analytics ID must use the G-XXXXXXXXXX format.' });
        return;
      }

      const featuredIds = Array.isArray(body.featuredCarIds)
        ? body.featuredCarIds.map(String)
        : undefined;

      const updated = await db.updateSettings({
        businessName: body.businessName.trim(),
        shortName: body.shortName?.trim() || body.businessName.trim().split(' ').slice(0, 2).join(' '),
        whatsappNumber: body.whatsappNumber.replace(/\D/g, ''),
        contactNumber: body.contactNumber.trim(),
        businessAddress: body.businessAddress.trim(),
        email: body.email?.trim() || '',
        logoUrl: body.logoUrl?.trim() ?? '',
        featuredCarIds: featuredIds,
        pageSeo: body.pageSeo !== undefined ? pageSeo : undefined,
        googleSiteVerification,
        ga4MeasurementId,
      });

      if (featuredIds) {
        const cars = await db.getAllCars(false);
        await Promise.all(
          cars.map((car) => {
            const shouldBeFeatured = featuredIds.includes(car.id);
            if (car.featured !== shouldBeFeatured) {
              return db.updateCar(car.id, { featured: shouldBeFeatured });
            }
            return Promise.resolve(car);
          }),
        );
      }

      res.json({ settings: updated });
    } catch {
      res.status(500).json({ error: 'Failed to update website settings.' });
    }
  });

  // -------------------- SEO AND PUBLIC PAGE SERVING --------------------
  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(process.cwd(), 'dist');
  const vite = isProd
    ? null
    : await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
      });

  async function getHtmlTemplate(requestPath: string): Promise<string> {
    const templatePath = isProd
      ? path.join(distDir, 'index.html')
      : path.resolve(process.cwd(), 'index.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    if (vite) template = await vite.transformIndexHtml(requestPath, template);
    return template;
  }

  function getPublicOrigin(req: express.Request): string {
    const configured = process.env.SITE_URL?.trim();
    const candidate =
      configured ||
      (isProd
        ? 'https://24selfdrive.com'
        : `${req.protocol}://${req.get('host') || 'localhost:3000'}`);
    try {
      const url = new URL(normalizePrimaryDomainUrl(candidate));
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      return url.origin;
    } catch {
      throw new Error('SITE_URL or request host must be an absolute HTTP(S) URL.');
    }
  }

  app.get('/robots.txt', (req, res) => {
    try {
      res.type('text/plain').send(buildRobotsTxt(getPublicOrigin(req)));
    } catch {
      res.status(500).type('text/plain').send('Unable to generate robots.txt.');
    }
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const [cars, settings] = await Promise.all([db.getAllCars(false), db.getSettings()]);
      res
        .set('Cache-Control', 'no-cache')
        .type('application/xml')
        .send(buildSitemapXml(cars, settings, getPublicOrigin(req)));
    } catch {
      res.status(500).type('text/plain').send('Unable to generate sitemap.xml.');
    }
  });

  async function sendSeoPage(req: express.Request, res: express.Response, pathname: string) {
    try {
      const [cars, settings] = await Promise.all([db.getAllCars(false), db.getSettings()]);
      const template = await getHtmlTemplate(pathname);
      const rendered = renderSeoDocument(
        template,
        pathname,
        cars,
        settings,
        getPublicOrigin(req),
        settings.googleSiteVerification,
      );
      if (!rendered) {
        res.status(404).type('text/plain').send('Page not found.');
        return;
      }
      if (rendered.robots.startsWith('noindex')) {
        res.set('X-Robots-Tag', rendered.robots);
      }
      res.type('html').send(rendered.html);
    } catch (err) {
      console.error('Unable to render SEO page:', err);
      res.status(500).type('text/plain').send('Unable to render this page.');
    }
  }

  app.get(getSeoStaticPaths(), async (req, res) => {
    await sendSeoPage(req, res, req.path);
  });

  app.get('/cars/:slug', async (req, res) => {
    const pathname = `/cars/${String(req.params.slug)}`;
    await sendSeoPage(req, res, pathname);
  });

  app.get(['/admin', '/admin/{*splat}'], async (req, res) => {
    try {
      let html = await getHtmlTemplate(req.path);
      html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>24 Self Drive | Admin</title>');
      html = html.replace(
        /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
        '',
      );
      html = html.replace(/<link\s+rel="canonical"[^>]*>/i, '');
      html = html.replace(
        /<meta\s+name="robots"[^>]*>/i,
        '<meta name="robots" content="noindex,nofollow" />',
      );
      res.set('X-Robots-Tag', 'noindex, nofollow').type('html').send(html);
    } catch (err) {
      console.error('Unable to render admin application:', err);
      res.status(500).type('text/plain').send('Unable to load admin application.');
    }
  });

  // -------------------- VITE / STATIC SERVING --------------------

  if (!isProd) {
    if (vite) app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir, { index: false }));
  }
  app.use((_req, res) => res.status(404).type('text/plain').send('Page not found.'));

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`24 Self Drive running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
