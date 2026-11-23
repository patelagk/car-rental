import { Calendar, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { AvailabilityStatus, BookingRecord, Car } from '../../types/rental.ts';

interface AvailabilityManagementViewProps {
  cars: Car[];
  bookings: BookingRecord[];
  onQuickStatusChange: (carId: string, status: AvailabilityStatus) => Promise<void>;
  onAddBlockedRange: (
    carId: string,
    payload: { startDate: string; endDate: string; reason: string },
  ) => Promise<void>;
  onRemoveBlockedRange: (carId: string, rangeId: string) => Promise<void>;
}

const STATUSES: AvailabilityStatus[] = [
  'Available',
  'Booked',
  'Unavailable',
  'Under Maintenance',
];

export function AvailabilityManagementView({
  cars,
  bookings,
  onQuickStatusChange,
  onAddBlockedRange,
  onRemoveBlockedRange,
}: AvailabilityManagementViewProps) {
  const [selectedCarId, setSelectedCarId] = useState<string>(cars[0]?.id ?? '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('Scheduled Maintenance');
  const [submittingBlock, setSubmittingBlock] = useState(false);
  const [busyCarId, setBusyCarId] = useState<string | null>(null);

  const activeCar = cars.find((c) => c.id === selectedCarId) ?? cars[0];
  const activeCarBookings = activeCar
    ? bookings.filter((b) => b.carId === activeCar.id && b.status === 'Confirmed')
    : [];

  async function handleStatusClick(carId: string, status: AvailabilityStatus) {
    setBusyCarId(carId);
    try {
      await onQuickStatusChange(carId, status);
    } finally {
      setBusyCarId(null);
    }
  }

  async function handleBlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeCar || !startDate || !endDate) return;
    setSubmittingBlock(true);
    try {
      await onAddBlockedRange(activeCar.id, { startDate, endDate, reason });
      setStartDate('');
      setEndDate('');
    } finally {
      setSubmittingBlock(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">
          Availability &amp; Date Blocking
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          One-click fleet status toggles and future date-wise blocking. Confirmed bookings automatically prevent overlapping locks.
        </p>
      </div>

      {/* 1-Click Quick Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cars.map((car) => (
          <div
            key={car.id}
            className="bg-[#111114] border border-neutral-800 rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={car.imageUrl}
                  alt={car.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-10 rounded-md object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-white truncate">{car.name}</p>
                  <p className="text-xs text-neutral-400">
                    {car.category} · {car.blockedDates?.length || 0} blocked range(s)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCarId(car.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCar?.id === car.id
                    ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                    : 'border-neutral-700 text-neutral-300 hover:text-white'
                }`}
              >
                Manage Dates
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUSES.map((status) => {
                const isActive = car.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={busyCarId === car.id}
                    onClick={() => void handleStatusClick(car.id, status)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-[#09090B] border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    {status === 'Under Maintenance' ? 'Maintenance' : status}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Date-wise Availability Manager */}
      {activeCar && (
        <div className="bg-[#111114] border border-neutral-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div>
              <p className="text-xs font-medium text-orange-400">Date-Wise Schedule</p>
              <h2 className="font-display text-lg font-bold text-white">
                {activeCar.name} — Future Bookings &amp; Blocked Dates
              </h2>
            </div>

            <select
              aria-label="Select vehicle for date management"
              value={activeCar.id}
              onChange={(e) => setSelectedCarId(e.target.value)}
              className="h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
            >
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Add Blocked Date Range */}
            <form onSubmit={handleBlockSubmit} className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Block Future Date Range</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Scheduled Maintenance / Offline Booking"
                  className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                disabled={submittingBlock}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{submittingBlock ? 'Blocking...' : 'Block Dates'}</span>
              </button>
            </form>

            {/* Existing Bookings + Blocked Ranges */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Confirmed Customer Bookings ({activeCarBookings.length})
                </h3>
                {activeCarBookings.length === 0 ? (
                  <p className="text-xs text-neutral-500 bg-[#09090B] border border-neutral-800 rounded-lg p-3">
                    No active confirmed bookings for {activeCar.name}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeCarBookings.map((b) => (
                      <div
                        key={b.bookingCode}
                        className="flex items-center justify-between gap-3 p-3 bg-[#09090B] border border-neutral-800 rounded-lg text-xs"
                      >
                        <div>
                          <span className="font-mono font-semibold text-orange-400">
                            {b.bookingCode}
                          </span>
                          <span className="text-neutral-400 ml-2">
                            {b.customerName} (+91 {b.customerPhone})
                          </span>
                        </div>
                        <span className="font-mono text-white tabular-nums">
                          {b.pickupDate} → {b.returnDate}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Admin Blocked Dates ({activeCar.blockedDates?.length || 0})
                </h3>
                {!activeCar.blockedDates || activeCar.blockedDates.length === 0 ? (
                  <p className="text-xs text-neutral-500 bg-[#09090B] border border-neutral-800 rounded-lg p-3">
                    No manual blocked date ranges.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeCar.blockedDates.map((blk) => (
                      <div
                        key={blk.id}
                        className="flex items-center justify-between gap-3 p-3 bg-[#09090B] border border-neutral-800 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-mono text-white tabular-nums">
                            {blk.startDate} → {blk.endDate}
                          </span>
                          <span className="text-neutral-400">· {blk.reason}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void onRemoveBlockedRange(activeCar.id, blk.id)}
                          aria-label="Remove blocked date range"
                          className="text-neutral-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
