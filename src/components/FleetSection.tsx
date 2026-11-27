import { AlertCircle, Car as CarIcon, CheckCircle2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import type { CarCategory, CarWithAvailability, TransmissionType } from '../types/rental.ts';
import { buildWhatsAppUrl, formatInr } from '../utils/whatsapp.ts';
import { getCarSlug } from '../data/seo.ts';

interface FleetSectionProps {
  cars: CarWithAvailability[];
  loading: boolean;
  error: string | null;
  category: CarCategory | 'All';
  transmission: TransmissionType | 'All';
  pickupDate: string;
  returnDate: string;
  whatsappNumber?: string;
  onCategoryChange: (cat: CarCategory | 'All') => void;
  onTransmissionChange: (tx: TransmissionType | 'All') => void;
  onRetry: () => void;
  onSelectCar: (car: CarWithAvailability) => void;
}

const CATEGORIES: Array<CarCategory | 'All'> = ['All', 'Hatchback', 'Sedan', 'SUV', 'Luxury'];
const TRANSMISSIONS: Array<TransmissionType | 'All'> = ['All', 'Manual', 'Automatic'];

function CarImage({ car }: { car: CarWithAvailability }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 p-6 text-center">
        <CarIcon className="w-10 h-10 text-neutral-400 mb-2" />
        <span className="font-display text-sm font-semibold text-neutral-700">{car.name}</span>
        <span className="text-xs text-neutral-500 mt-0.5">{car.category}</span>
      </div>
    );
  }

  return (
    <img
      src={car.imageUrl}
      alt={
        car.imageAltText?.trim() ||
        `${car.name} ${car.modelYear} ${car.category.toLowerCase()} self-drive car in Bhopal`
      }
      width="800"
      height="600"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
    />
  );
}

export function FleetSection({
  cars,
  loading,
  error,
  category,
  transmission,
  pickupDate,
  returnDate,
  whatsappNumber,
  onCategoryChange,
  onTransmissionChange,
  onRetry,
  onSelectCar,
}: FleetSectionProps) {
  return (
    <section id="fleet" className="bg-white py-16 lg:py-20 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-neutral-200">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-orange-600 mb-2">
              Featured Available Cars
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-neutral-950 [text-wrap:balance]">
              Self-Drive Fleet Ready in Bhopal
            </h2>
            <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-2xl">
              Every car includes 300 km per 24 hours, preloaded FASTag, and sanitized cabin delivery across Bhopal. Showing live rates for{' '}
              <span className="font-mono tabular-nums text-neutral-900 font-medium">
                {pickupDate}
              </span>{' '}
              to{' '}
              <span className="font-mono tabular-nums text-neutral-900 font-medium">
                {returnDate}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Category Filter Tabs */}
            <div
              role="group"
              aria-label="Filter by car category"
              className="inline-flex items-center p-1 bg-neutral-100 rounded-lg border border-neutral-200"
            >
              {CATEGORIES.map((item) => {
                const active = category === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onCategoryChange(item)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-neutral-950 text-white'
                        : 'text-neutral-700 hover:text-neutral-950'
                    }`}
                  >
                    {item === 'All' ? 'All Cars' : item}
                  </button>
                );
              })}
            </div>

            {/* Transmission Filter */}
            <div
              role="group"
              aria-label="Filter by transmission"
              className="inline-flex items-center p-1 bg-neutral-100 rounded-lg border border-neutral-200"
            >
              {TRANSMISSIONS.map((tx) => {
                const active = transmission === tx;
                return (
                  <button
                    key={tx}
                    type="button"
                    onClick={() => onTransmissionChange(tx)}
                    className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-orange-500 text-white'
                        : 'text-neutral-700 hover:text-neutral-950'
                    }`}
                  >
                    {tx === 'All' ? 'Any Gear' : tx}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="border border-neutral-200 rounded-xl overflow-hidden bg-white animate-pulse"
              >
                <div className="aspect-[4/3] bg-neutral-100" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  <div className="h-6 bg-neutral-200 rounded w-3/4" />
                  <div className="h-10 bg-neutral-100 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mt-10 p-8 border border-neutral-200 rounded-xl bg-neutral-50 text-center">
            <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-3" />
            <p className="font-display text-lg font-semibold text-neutral-950">
              Unable to load live fleet availability
            </p>
            <p className="text-sm text-neutral-600 mt-1">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 px-5 py-2.5 text-sm font-semibold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg cursor-pointer"
            >
              Retry Availability Check
            </button>
          </div>
        )}

        {/* Empty Filter State */}
        {!loading && !error && cars.length === 0 && (
          <div className="mt-10 p-10 border border-neutral-200 rounded-xl bg-neutral-50 text-center">
            <p className="font-display text-lg font-semibold text-neutral-950">
              No cars match this filter combination
            </p>
            <p className="text-sm text-neutral-600 mt-1">
              Reset filters to inspect all hatchbacks, sedans, and SUVs available in Bhopal.
            </p>
            <button
              type="button"
              onClick={() => {
                onCategoryChange('All');
                onTransmissionChange('All');
              }}
              className="mt-4 px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg cursor-pointer"
            >
              Show All Cars
            </button>
          </div>
        )}

        {/* 3-Column Fleet Grid */}
        {!loading && !error && cars.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {cars.map((car) => {
              const waMessage = `Hello 24 Self Drive, I want to book the ${car.name} (${car.transmission}, ${car.fuelType}) from ${pickupDate} to ${returnDate}.`;
              return (
                <article
                  key={car.id}
                  className="group flex flex-col bg-white border border-neutral-200 rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:border-neutral-300"
                >
                  {/* 4:3 Vehicle Photo */}
                  <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden border-b border-neutral-200">
                    <CarImage car={car} />
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Unboxed Clean Metadata (Zero Pill Badges) */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-neutral-500">
                      <span>{car.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{car.transmission}</span>
                      <span aria-hidden="true">·</span>
                      <span>{car.fuelType}</span>
                      <span aria-hidden="true">·</span>
                      <span>{car.seats} Seats</span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-lg font-bold text-neutral-950 tracking-tight">
                        <a href={`/cars/${getCarSlug(car)}`} className="hover:text-orange-700">
                          {car.name}
                        </a>
                      </h3>
                      <span className="font-mono text-xs text-neutral-500 tabular-nums shrink-0">
                        {car.modelYear}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-neutral-500">{car.variant}</p>

                    {/* Availability Indicator (Text + Icon, never color-only) */}
                    <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
                      {car.available ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-neutral-800">
                          <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                          <span>Available</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-medium text-neutral-600">
                          <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0" />
                          <span>
                            {car.conflictDates
                              ? `${car.availabilityReason ?? 'Reserved'} (${car.conflictDates})`
                              : car.availabilityReason ?? car.status}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Pricing Baseline */}
                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <span className="block text-[11px] uppercase tracking-wider text-neutral-500">
                          24-Hr Tariff
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-2xl font-bold text-neutral-950 tabular-nums">
                            {formatInr(car.dailyRateInr)}
                          </span>
                          <span className="text-xs text-neutral-500">/ day</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-[11px] text-neutral-500">
                          {car.days} {car.days === 1 ? 'day' : 'days'} est.
                        </span>
                        <span className="font-mono text-sm font-semibold text-neutral-900 tabular-nums">
                          {formatInr(car.estimatedRentalInr)}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-neutral-500 tabular-nums">
                      Includes {car.freeKmPerDay} km/day · {car.mileageKmpl} · Refundable deposit{' '}
                      {formatInr(car.securityDepositInr)}
                    </p>

                    {/* Action Footer */}
                    <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectCar(car)}
                        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                          car.available
                            ? 'bg-neutral-950 hover:bg-orange-500 text-white'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {car.available ? 'Reserve Now' : 'Check Other Dates'}
                      </button>

                      <a
                        href={buildWhatsAppUrl(waMessage, whatsappNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Inquire about ${car.name} on WhatsApp`}
                        className="inline-flex items-center justify-center h-10 px-3.5 text-xs font-semibold text-neutral-800 hover:text-orange-600 border border-neutral-200 hover:border-orange-500 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
                      >
                        <MessageCircle className="w-4 h-4 text-orange-500 mr-1.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
