import type { Car, CarCategory, PageSeoOverride, SiteSettings } from '../types/rental.ts';

export const LIVE_SITE_ORIGIN = 'https://24selfdrive.in';

export interface SeoSection {
  heading: string;
  paragraphs: string[];
  items?: string[];
}

export interface SeoPageData {
  key: string;
  path: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  sections: SeoSection[];
  category?: CarCategory;
  car?: Car;
}

export function getPageSeoOverride(
  settings: SiteSettings | null,
  pageKey: string,
): PageSeoOverride {
  return settings?.pageSeo?.[pageKey] ?? {};
}

export const SEO_PAGES: SeoPageData[] = [
  {
    key: 'home',
    path: '/',
    title: '24 Self Drive | Self Drive Car Rental in Bhopal',
    description:
      'Book self drive cars in Bhopal with 24 Self Drive. Compare hatchbacks, sedans and SUVs, see rental rates and choose a listed pickup hub.',
    heading: 'Self Drive Car Rental in Bhopal',
    intro:
      '24 Self Drive offers self-drive cars in Bhopal for city journeys and trips beyond Madhya Pradesh. Browse the current fleet, compare vehicle details and choose a pickup option before booking.',
    sections: [
      {
        heading: 'Choose a car for your trip',
        paragraphs: [
          'Review the vehicle category, transmission, seating, included kilometres and current daily rate before making a booking request. Availability can vary by your selected dates.',
        ],
        items: [
          'Hatchbacks for compact city travel',
          'Sedans for extra cabin and luggage space',
          'SUVs for higher seating and larger groups',
        ],
      },
      {
        heading: 'Pickup options in Bhopal',
        paragraphs: [
          'Pickup options currently shown by 24 Self Drive include MP Nagar, Raja Bhoj Airport, Rani Kamlapati Station, Arera Colony and Kolar Road. Confirm the selected handover point and any delivery charge during booking.',
        ],
      },
    ],
  },
  {
    key: 'bhopal',
    path: '/self-drive-car-rental-bhopal',
    title: 'Self Drive Cars in Bhopal | 24 Self Drive',
    description:
      'Find self drive cars in Bhopal for local trips and outstation travel. Compare vehicle types, rates and listed pickup hubs with 24 Self Drive.',
    heading: 'Self Drive Cars in Bhopal',
    intro:
      'Looking for car rental in Bhopal without a driver? Browse the 24 Self Drive fleet, check vehicle specifications and send a booking request for your travel dates.',
    sections: [
      {
        heading: 'Plan a Bhopal pickup',
        paragraphs: [
          'Select from the pickup options currently listed for MP Nagar, Raja Bhoj Airport, Rani Kamlapati Station, Arera Colony and Kolar Road. Pickup availability and delivery fees depend on the selected hub.',
        ],
      },
      {
        heading: 'Compare before booking',
        paragraphs: [
          'Check each car’s category, seating, transmission, fuel type, daily rate and included kilometres. The live availability check can change with dates and confirmed reservations.',
        ],
      },
    ],
  },
  {
    key: 'cars',
    path: '/cars',
    title: 'All Self Drive Cars in Bhopal | 24 Self Drive',
    description:
      'Compare the current 24 Self Drive fleet in Bhopal, including hatchbacks, sedans and SUVs. Review rates and vehicle details before requesting a booking.',
    heading: 'All Self Drive Cars',
    intro:
      'Browse the vehicles currently listed for self-drive rental in Bhopal. Rates and specifications are shown for each car; date-specific availability is confirmed during the booking flow.',
    sections: [
      {
        heading: 'Browse by category',
        paragraphs: ['Choose a vehicle category to narrow the fleet to your seating and trip requirements.'],
      },
    ],
  },
  {
    key: 'hatchback',
    path: '/cars/hatchback',
    title: 'Hatchback Car Rental in Bhopal | 24 Self Drive',
    description:
      'Compare hatchback cars for self-drive rental in Bhopal. See listed specifications and rates from 24 Self Drive before checking availability.',
    heading: 'Hatchback Cars for Rent in Bhopal',
    intro:
      'Hatchbacks can suit solo travellers, couples and smaller groups who want a compact vehicle for city errands and nearby journeys. Compare the cars currently listed below.',
    category: 'Hatchback',
    sections: [
      {
        heading: 'Compare hatchbacks',
        paragraphs: [
          'Review transmission, seating, fuel type, daily rate and included kilometres for each listed car. Availability depends on your dates and confirmed bookings.',
        ],
      },
    ],
  },
  {
    key: 'sedan',
    path: '/cars/sedan',
    title: 'Sedan Car Rental in Bhopal | 24 Self Drive',
    description:
      'Browse sedan cars for self-drive rental in Bhopal. Compare available models, seating, features and listed daily rates from 24 Self Drive.',
    heading: 'Sedan Cars for Rent in Bhopal',
    intro:
      'Explore the sedans listed by 24 Self Drive for Bhopal journeys. Compare the vehicle details and current rates to find a suitable option for your trip.',
    category: 'Sedan',
    sections: [
      {
        heading: 'What to compare',
        paragraphs: [
          'Check cabin and luggage needs, transmission, fuel type and daily pricing. Use the availability checker for your actual pickup and return dates.',
        ],
      },
    ],
  },
  {
    key: 'suv',
    path: '/cars/suv',
    title: 'SUV Rental in Bhopal | 24 Self Drive',
    description:
      'Compare SUVs available for self-drive rental in Bhopal. Review seating, fuel, transmission and current rates with 24 Self Drive.',
    heading: 'SUV Rental in Bhopal',
    intro:
      'Browse the SUVs currently listed for self-drive rental in Bhopal. Compare seating capacity, vehicle features and rates before checking date-specific availability.',
    category: 'SUV',
    sections: [
      {
        heading: 'Choose an SUV for your group',
        paragraphs: [
          'Check the seats and luggage capacity listed for each vehicle and confirm the trip terms at booking. Availability can vary by date.',
        ],
      },
    ],
  },
  {
    key: 'about',
    path: '/about',
    title: 'About 24 Self Drive | Bhopal Car Rental',
    description:
      'Learn about 24 Self Drive, a Bhopal-based self-drive car rental service with listed pickup options and a fleet of hatchbacks, sedans and SUVs.',
    heading: 'About 24 Self Drive',
    intro:
      '24 Self Drive is a self-drive car rental service serving customers in Bhopal, Madhya Pradesh. The website lists the fleet, vehicle terms and pickup options so customers can compare before requesting a booking.',
    sections: [
      {
        heading: 'How the service works',
        paragraphs: [
          'Choose a car, enter your travel dates, select a listed Bhopal pickup hub and submit the booking details. Check the vehicle-specific terms and charges shown before confirming.',
        ],
      },
      {
        heading: 'Local pickup information',
        paragraphs: [
          'Current pickup options are listed on the website. They are handover points, not separate branch locations. Contact 24 Self Drive to confirm the pickup arrangements for a reservation.',
        ],
      },
    ],
  },
  {
    key: 'contact',
    path: '/contact',
    title: 'Contact 24 Self Drive | Bhopal',
    description:
      'Contact 24 Self Drive about self-drive car rental in Bhopal, vehicle availability, pickup hubs or an existing booking.',
    heading: 'Contact 24 Self Drive',
    intro:
      'For a Bhopal car rental enquiry, contact 24 Self Drive using the phone, email or WhatsApp details shown on this page. Include your travel dates and preferred vehicle category.',
    sections: [
      {
        heading: 'Booking enquiries',
        paragraphs: [
          'Share your dates, preferred car category and pickup option. For an existing reservation, include your booking reference but do not send payment details or identity documents in a public message.',
        ],
      },
    ],
  },
  {
    key: 'policies',
    path: '/rental-policies',
    title: 'Self Drive Rental Policies | 24 Self Drive Bhopal',
    description:
      'Read key booking, pickup, driving licence, distance, deposit and cancellation information for self-drive car rentals with 24 Self Drive in Bhopal.',
    heading: 'Rental Policies',
    intro:
      'Review the information below before requesting a self-drive car rental. The final vehicle-specific charges and terms displayed during booking take precedence; contact 24 Self Drive if anything is unclear.',
    sections: [
      {
        heading: 'Driver and documents',
        paragraphs: [
          'The booking flow requests the renter’s name, Indian mobile number, email and driving licence details. Bring the required valid documents for identity and licence verification at handover.',
        ],
      },
      {
        heading: 'Distance, charges and deposit',
        paragraphs: [
          'The listing shows the included kilometres, daily rental rate, refundable security deposit and extra-use charges for each car. Check the current vehicle listing and booking summary because amounts can vary by vehicle.',
        ],
      },
      {
        heading: 'Pickup, return and changes',
        paragraphs: [
          'Confirm the pickup hub, handover timing, return timing and any delivery fee before completing a booking. Contact the business directly to ask about changes, late returns or cancellations; this website does not publish a universal refund promise.',
        ],
      },
    ],
  },
  {
    key: 'blog',
    path: '/blog',
    title: 'Bhopal Self Drive Travel Guide | 24 Self Drive Blog',
    description:
      'Practical guidance for planning a self-drive trip from Bhopal, choosing a car category and checking rental terms before setting out.',
    heading: 'Bhopal Self Drive Travel Guide',
    intro:
      'Plan a self-drive journey from Bhopal by matching the vehicle to your passengers, luggage and route. Always check current road conditions and the car’s rental terms before departure.',
    sections: [
      {
        heading: 'Choose a vehicle for the route',
        paragraphs: [
          'A hatchback may work for a small group and light luggage; a sedan provides a different balance of cabin and boot space; an SUV can offer more seating in selected models. Compare the actual specifications rather than choosing by category alone.',
        ],
      },
      {
        heading: 'Prepare before leaving Bhopal',
        paragraphs: [
          'Confirm the pickup point, included kilometres, fuel arrangement, deposit and return timing. Plan breaks for longer drives and check current route conditions for destinations such as Sanchi, Ujjain or Indore.',
        ],
      },
    ],
  },
];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function getCarSlug(car: Car): string {
  return car.slug || `${slugify(car.name) || 'car'}-${car.id}`;
}

export function getSeoPage(pathname: string, cars: Car[] = []): SeoPageData | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const staticPage = SEO_PAGES.find((page) => page.path === normalizedPath);
  if (staticPage) return staticPage;

  const car = cars.find((item) => getCarSlug(item) === normalizedPath.slice('/cars/'.length));
  if (!car || !normalizedPath.startsWith('/cars/')) return null;

  const title =
    car.seoTitle?.trim() || `${car.name} Self Drive Rental in Bhopal | 24 Self Drive`;
  const description =
    car.seoDescription?.trim() ||
    `${car.name} ${car.modelYear} ${car.category.toLowerCase()} available for self-drive rental in Bhopal. Check specifications, daily rate and date-specific availability with 24 Self Drive.`;
  return {
    key: `car:${getCarSlug(car)}`,
    path: `/cars/${getCarSlug(car)}`,
    title,
    description,
    heading: `${car.name} Self Drive Rental in Bhopal`,
    intro: car.description || `${car.name} is listed for self-drive rental in Bhopal.`,
    sections: [
      {
        heading: 'Vehicle details',
        paragraphs: [
          `${car.modelYear} ${car.category.toLowerCase()} · ${car.transmission} · ${car.fuelType} · ${car.seats} seats. Listed at ₹${car.dailyRateInr.toLocaleString('en-IN')} per day, with ${car.freeKmPerDay} included kilometres per day.`,
        ],
        items: car.highlights,
      },
    ],
    car,
  };
}
