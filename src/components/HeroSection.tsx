import { Calendar, Car as CarIcon, MapPin, MessageCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { HERO_IMAGE_URL, PICKUP_HUBS } from '../data/fleet.ts';
import type { CarCategory } from '../types/rental.ts';
import { buildWhatsAppUrl } from '../utils/whatsapp.ts';

interface HeroSectionProps {
  pickupDate: string;
  returnDate: string;
  selectedHubId: string;
  selectedCategory: CarCategory | 'All';
  onSearchAvailability: (params: {
    hubId: string;
    pickupDate: string;
    returnDate: string;
    category: CarCategory | 'All';
  }) => void;
}

export function HeroSection({
  pickupDate: initialPickup,
  returnDate: initialReturn,
  selectedHubId: initialHub,
  selectedCategory: initialCategory,
  onSearchAvailability,
}: HeroSectionProps) {
  const [hubId, setHubId] = useState(initialHub);
  const [pickupDate, setPickupDate] = useState(initialPickup);
  const [returnDate, setReturnDate] = useState(initialReturn);
  const [category, setCategory] = useState<CarCategory | 'All'>(initialCategory);
  const [imgError, setImgError] = useState(false);

  const selectedHub = PICKUP_HUBS.find((h) => h.id === hubId) ?? PICKUP_HUBS[0];

  const whatsAppHref = buildWhatsAppUrl(
    `Hello 24 Self Drive, I would like to book a ${
      category === 'All' ? 'self-drive car' : category
    } from ${selectedHub.name} (${pickupDate} to ${returnDate}). Please share availability.`,
  );

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearchAvailability({ hubId, pickupDate, returnDate, category });
  }

  return (
    <section id="top" className="bg-[#0A0A0B] text-white">
      {/* Full-bleed Hero Split */}
      <div className="relative overflow-hidden border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Copy & Primary CTA */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium tracking-wider uppercase text-orange-400 mb-3">
                Bhopal, Madhya Pradesh · MP-04 Verified Fleet
              </p>

              <h1 className="font-display text-[clamp(2.25rem,4vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-white [text-wrap:balance]">
                Self Drive Car Rental in Bhopal
              </h1>

              <p className="mt-5 text-base sm:text-lg text-neutral-300 leading-relaxed max-w-xl">
                Explore Bhopal on Your Terms with Affordable Self Drive Cars.
              </p>

              <p className="mt-3 text-sm text-neutral-400 leading-relaxed max-w-lg">
                Zero driver interference, 300 free km per day, preloaded FASTag, and instant pickup across MP Nagar, Raja Bhoj Airport, and Rani Kamlapati Station.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#fleet"
                  onClick={(e) => {
                    e.preventDefault();
                    onSearchAvailability({ hubId, pickupDate, returnDate, category });
                  }}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]"
                >
                  <Search className="w-4 h-4" />
                  <span>Check Available Cars</span>
                </a>

                <a
                  href={whatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white border border-neutral-700 hover:border-orange-500 hover:text-orange-400 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  <MessageCircle className="w-4 h-4 text-orange-500" />
                  <span>WhatsApp Booking</span>
                </a>
              </div>

              {/* Clean unboxed trust line (no pills) */}
              <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400">
                <span>Starts ₹1,499 / 24 hrs</span>
                <span aria-hidden="true">·</span>
                <span>All-MP &amp; India Permit</span>
                <span aria-hidden="true">·</span>
                <span>24-Hr Deposit Refund</span>
              </div>
            </div>

            {/* Right 16:9 Scenic Bhopal Automotive Showcase */}
            <div className="lg:col-span-6 flex items-stretch">
              <div className="relative w-full aspect-[16/10] lg:aspect-auto lg:h-full min-h-[280px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900">
                {!imgError ? (
                  <img
                    src={HERO_IMAGE_URL}
                    alt="Dark metallic SUV parked beside Upper Lake VIP Road in Bhopal at twilight"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 p-8 text-center">
                    <CarIcon className="w-12 h-12 text-orange-500 mb-3" />
                    <p className="font-display text-lg font-semibold text-white">
                      24 Self Drive
                    </p>
                    <p className="text-sm text-neutral-400 mt-1">
                      MP-04 Sanitized Self-Drive Fleet
                    </p>
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/70 via-transparent to-transparent pointer-events-none"
                />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-neutral-200">
                  <span>Upper Lake VIP Road, Bhopal</span>
                  <span className="font-mono tabular-nums text-orange-400">MP-04 Fleet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Horizontal Quick Availability Bar below hero split */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form
          onSubmit={handleFormSubmit}
          aria-label="Check car availability in Bhopal"
          className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end"
        >
          <div className="lg:col-span-3">
            <label
              htmlFor="hero-hub"
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 mb-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>Pickup Hub in Bhopal</span>
            </label>
            <select
              id="hero-hub"
              value={hubId}
              onChange={(e) => setHubId(e.target.value)}
              className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
            >
              {PICKUP_HUBS.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="hero-pickup"
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 mb-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>Pickup Date</span>
            </label>
            <input
              id="hero-pickup"
              type="date"
              value={pickupDate}
              onChange={(e) => {
                const nextPickup = e.target.value;
                setPickupDate(nextPickup);
                if (returnDate <= nextPickup) {
                  const d = new Date(nextPickup);
                  d.setDate(d.getDate() + 1);
                  setReturnDate(d.toISOString().split('T')[0]);
                }
              }}
              className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white font-mono tabular-nums focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="hero-return"
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 mb-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>Return Date</span>
            </label>
            <input
              id="hero-return"
              type="date"
              min={pickupDate}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white font-mono tabular-nums focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="lg:col-span-3">
            <label
              htmlFor="hero-category"
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 mb-1.5"
            >
              <CarIcon className="w-3.5 h-3.5 text-orange-500" />
              <span>Car Category</span>
            </label>
            <select
              id="hero-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CarCategory | 'All')}
              className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
            >
              <option value="All">All Categories (Hatchback, Sedan, SUV)</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV (5 &amp; 7 Seater)</option>
            </select>
          </div>

          <div className="lg:col-span-2 sm:col-span-2">
            <button
              type="submit"
              className="w-full h-11 px-4 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              Find Cars
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
