import mongoose from 'mongoose';

const blockedDateRangeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    reason: { type: String, default: 'Maintenance / Reserved' },
  },
  { _id: false },
);

const carSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    modelYear: { type: Number, required: true },
    variant: { type: String, default: 'Standard' },
    category: {
      type: String,
      enum: ['Hatchback', 'Sedan', 'SUV', 'Luxury'],
      required: true,
    },
    transmission: {
      type: String,
      enum: ['Manual', 'Automatic'],
      required: true,
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Petrol / CNG'],
      required: true,
    },
    seats: { type: Number, required: true, min: 2, max: 12 },
    acAvailable: { type: Boolean, default: true },
    dailyRateInr: { type: Number, required: true, min: 0 },
    weeklyRateInr: { type: Number, min: 0 },
    monthlyRateInr: { type: Number, min: 0 },
    securityDepositInr: { type: Number, required: true, min: 0 },
    extraHourRateInr: { type: Number, required: true, min: 0 },
    freeKmPerDay: { type: Number, default: 300 },
    extraKmRateInr: { type: Number, default: 10 },
    mileageKmpl: { type: String, default: '16 km/l' },
    luggageCapacity: { type: String, default: '3 Bags' },
    registrationCode: { type: String, default: 'MP-04 Series' },
    description: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    images: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Unavailable', 'Under Maintenance'],
      default: 'Available',
    },
    isArchived: { type: Boolean, default: false, index: true },
    blockedDates: { type: [blockedDateRangeSchema], default: [] },
  },
  { timestamps: true },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, required: true, unique: true, index: true },
    carId: { type: String, required: true, index: true },
    carName: { type: String, required: true },
    pickupHubId: { type: String, required: true },
    pickupHubName: { type: String, required: true },
    pickupDate: { type: String, required: true },
    returnDate: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, required: true },
    drivingLicenceNo: { type: String, required: true },
    tripPurpose: { type: String, required: true },
    days: { type: Number, required: true },
    rentalSubtotalInr: { type: Number, required: true },
    deliveryFeeInr: { type: Number, required: true },
    securityDepositInr: { type: Number, required: true },
    totalPayableInr: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Confirmed', 'Pending Verification'],
      default: 'Confirmed',
    },
  },
  { timestamps: true },
);

const inquirySchema = new mongoose.Schema(
  {
    inquiryId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    route: { type: String, required: true },
    preferredCategory: { type: String, default: 'Any' },
    travelDate: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'primary' },
    businessName: { type: String, required: true },
    shortName: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    contactNumber: { type: String, required: true },
    businessAddress: { type: String, required: true },
    email: { type: String, required: true },
    logoUrl: { type: String, default: '' },
    featuredCarIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

const adminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    role: { type: String, enum: ['admin'], default: 'admin' },
  },
  { timestamps: true },
);

export const CarModel = mongoose.models.Car || mongoose.model('Car', carSchema);
export const BookingModel = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export const InquiryModel = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);
export const SiteSettingsModel =
  mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
export const AdminUserModel =
  mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);
