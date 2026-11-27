export type CarCategory = 'Hatchback' | 'Sedan' | 'SUV' | 'Luxury';
export type TransmissionType = 'Manual' | 'Automatic';
export type FuelType = 'Petrol' | 'Diesel' | 'CNG' | 'Electric' | 'Petrol / CNG';
export type AvailabilityStatus = 'Available' | 'Booked' | 'Unavailable' | 'Under Maintenance';

export interface BlockedDateRange {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface Car {
  id: string;
  slug?: string;
  name: string;
  brand: string;
  model: string;
  modelYear: number;
  variant: string;
  category: CarCategory;
  transmission: TransmissionType;
  fuelType: FuelType;
  seats: number;
  acAvailable: boolean;
  dailyRateInr: number;
  weeklyRateInr?: number;
  monthlyRateInr?: number;
  securityDepositInr: number;
  extraHourRateInr: number;
  freeKmPerDay: number;
  extraKmRateInr: number;
  mileageKmpl: string;
  luggageCapacity: string;
  registrationCode: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  imageAltText?: string;
  imageUrl: string;
  images: string[];
  highlights: string[];
  featured: boolean;
  status: AvailabilityStatus;
  isArchived?: boolean;
  blockedDates: BlockedDateRange[];
  createdAt: string;
  updatedAt: string;
}

export interface CarWithAvailability extends Car {
  available: boolean;
  availabilityReason?: string;
  days: number;
  estimatedRentalInr: number;
  conflictDates?: string;
}

export interface PickupHub {
  id: string;
  name: string;
  area: string;
  landmark: string;
  timings: string;
  deliveryFeeInr: number;
}

export interface BookingRequest {
  carId: string;
  pickupHubId: string;
  pickupDate: string;
  returnDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  drivingLicenceNo: string;
  tripPurpose: 'Local Bhopal' | 'Outstation MP' | 'Airport Transfer';
}

export interface BookingRecord extends BookingRequest {
  bookingCode: string;
  carName: string;
  pickupHubName: string;
  days: number;
  rentalSubtotalInr: number;
  deliveryFeeInr: number;
  securityDepositInr: number;
  totalPayableInr: number;
  status: 'Confirmed' | 'Pending Verification';
  createdAt: string;
}

export interface InquiryRequest {
  name: string;
  phone: string;
  route: string;
  preferredCategory: CarCategory | 'Any';
  travelDate: string;
  notes: string;
}

export interface InquiryRecord extends InquiryRequest {
  inquiryId: string;
  createdAt: string;
}

export interface SiteSettings {
  businessName: string;
  shortName: string;
  whatsappNumber: string;
  contactNumber: string;
  businessAddress: string;
  email: string;
  logoUrl: string;
  featuredCarIds: string[];
  pageSeo?: Record<string, PageSeoOverride>;
  googleSiteVerification?: string;
  ga4MeasurementId?: string;
  updatedAt: string;
}

export interface PageSeoOverride {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: 'index,follow' | 'noindex,follow' | 'noindex,nofollow';
  ogImage?: string;
}

export interface DashboardStats {
  totalCars: number;
  availableCars: number;
  bookedCars: number;
  unavailableCars: number;
  maintenanceCars: number;
  totalBookingInquiries: number;
  totalConfirmedBookings: number;
  totalOutstationInquiries: number;
}

export interface AdminUserRecord {
  email: string;
  passwordHash: string;
  salt: string;
  role: 'admin';
  createdAt: string;
}
