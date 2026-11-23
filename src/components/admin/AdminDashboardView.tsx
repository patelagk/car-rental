import { CalendarCheck, Car as CarIcon, CheckCircle2, MessageSquare, Wrench, XCircle } from 'lucide-react';
import type { BookingRecord, Car, DashboardStats, InquiryRecord } from '../../types/rental.ts';
import { formatInr } from '../../utils/whatsapp.ts';

interface AdminDashboardViewProps {
  stats: DashboardStats | null;
  recentCars: Car[];
  recentBookings: BookingRecord[];
  recentInquiries: InquiryRecord[];
  databaseEngine: string;
  loading: boolean;
  onAddCar: () => void;
  onEditCar: (car: Car) => void;
}

export function AdminDashboardView({
  stats,
  recentCars,
  recentBookings,
  recentInquiries,
  databaseEngine,
  loading,
  onAddCar,
  onEditCar,
}: AdminDashboardViewProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-28 bg-[#111114] border border-neutral-800 rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-[#111114] border border-neutral-800 rounded-xl" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Cars',
      value: stats.totalCars,
      sub: 'Active fleet vehicles',
      icon: CarIcon,
      accent: 'text-white',
    },
    {
      label: 'Available Cars',
      value: stats.availableCars,
      sub: 'Ready for pickup',
      icon: CheckCircle2,
      accent: 'text-emerald-400',
    },
    {
      label: 'Booked Cars',
      value: stats.bookedCars,
      sub: 'Marked as booked',
      icon: CalendarCheck,
      accent: 'text-orange-400',
    },
    {
      label: 'Unavailable Cars',
      value: stats.unavailableCars,
      sub: 'Paused from listing',
      icon: XCircle,
      accent: 'text-neutral-400',
    },
    {
      label: 'Maintenance Cars',
      value: stats.maintenanceCars,
      sub: 'Under servicing',
      icon: Wrench,
      accent: 'text-amber-400',
    },
    {
      label: 'Total Booking Inquiries',
      value: stats.totalBookingInquiries,
      sub: `${stats.totalConfirmedBookings} bookings · ${stats.totalOutstationInquiries} inquiries`,
      icon: MessageSquare,
      accent: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            Fleet Operations Overview
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Storage engine: <span className="font-mono text-neutral-300">{databaseEngine}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onAddCar}
          className="px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          + Add New Car
        </button>
      </div>

      {/* 6 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[#111114] border border-neutral-800 rounded-xl p-5 flex items-start justify-between gap-4"
            >
              <div>
                <p className="text-xs font-medium text-neutral-400">{card.label}</p>
                <p className={`mt-2 font-mono text-3xl font-bold tabular-nums ${card.accent}`}>
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{card.sub}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${card.accent}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Added Cars & Recent Booking Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Added Cars */}
        <div className="lg:col-span-6 bg-[#111114] border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">Recent Added Cars</h2>
            <span className="text-xs text-neutral-500 font-mono tabular-nums">
              {recentCars.length} shown
            </span>
          </div>

          {recentCars.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">No cars added yet.</div>
          ) : (
            <div className="divide-y divide-neutral-800/80">
              {recentCars.map((car) => (
                <div
                  key={car.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={car.imageUrl}
                      alt={car.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-10 rounded-md object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{car.name}</p>
                      <p className="text-xs text-neutral-400 truncate">
                        {car.category} · {car.transmission} · {car.status}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-semibold text-orange-400 tabular-nums">
                      {formatInr(car.dailyRateInr)}/d
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditCar(car)}
                      className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-md cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Booking Inquiries */}
        <div className="lg:col-span-6 bg-[#111114] border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">
              Recent Booking &amp; Trip Inquiries
            </h2>
            <span className="text-xs text-neutral-500 font-mono tabular-nums">
              {recentBookings.length + recentInquiries.length} total
            </span>
          </div>

          {recentBookings.length === 0 && recentInquiries.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              No bookings or inquiries recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/80">
              {recentBookings.map((b) => (
                <div key={b.bookingCode} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-orange-400">{b.bookingCode}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-emerald-400 font-medium">{b.status}</span>
                    </div>
                    <p className="text-sm font-medium text-white mt-0.5 truncate">
                      {b.customerName} — {b.carName}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5 font-mono tabular-nums">
                      {b.pickupDate} → {b.returnDate} · +91 {b.customerPhone}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-white tabular-nums shrink-0">
                    {formatInr(b.totalPayableInr)}
                  </span>
                </div>
              ))}

              {recentInquiries.map((inq) => (
                <div key={inq.inquiryId} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-neutral-300">{inq.inquiryId}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-amber-400 font-medium">Trip Inquiry</span>
                    </div>
                    <p className="text-sm font-medium text-white mt-0.5 truncate">
                      {inq.name} — {inq.route}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5 font-mono tabular-nums">
                      {inq.preferredCategory} · +91 {inq.phone}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-500 shrink-0">
                    {inq.travelDate || 'Flexible'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
