import { Archive, ArrowUpDown, Edit3, Plus, Search, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AvailabilityStatus, Car, CarCategory } from '../../types/rental.ts';
import { formatInr } from '../../utils/whatsapp.ts';

interface CarListingViewProps {
  cars: Car[];
  loading: boolean;
  onAddCar: () => void;
  onEditCar: (car: Car) => void;
  onArchiveCar: (car: Car) => Promise<void>;
  onQuickStatusChange: (carId: string, status: AvailabilityStatus) => Promise<void>;
}

type SortKey = 'updatedAt' | 'dailyRateAsc' | 'dailyRateDesc' | 'nameAsc';

const STATUS_STYLE: Record<AvailabilityStatus, string> = {
  Available: 'text-emerald-400',
  Booked: 'text-orange-400',
  Unavailable: 'text-neutral-400',
  'Under Maintenance': 'text-amber-400',
};

export function CarListingView({
  cars,
  loading,
  onAddCar,
  onEditCar,
  onArchiveCar,
  onQuickStatusChange,
}: CarListingViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CarCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortKey>('updatedAt');
  const [confirmArchiveCar, setConfirmArchiveCar] = useState<Car | null>(null);
  const [archiving, setArchiving] = useState(false);

  const filteredCars = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = cars.filter((car) => {
      const matchSearch =
        !q ||
        car.name.toLowerCase().includes(q) ||
        car.brand.toLowerCase().includes(q) ||
        car.model.toLowerCase().includes(q);
      const matchCat = categoryFilter === 'All' || car.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || car.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'dailyRateAsc') return a.dailyRateInr - b.dailyRateInr;
      if (sortBy === 'dailyRateDesc') return b.dailyRateInr - a.dailyRateInr;
      if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [cars, search, categoryFilter, statusFilter, sortBy]);

  async function confirmArchive() {
    if (!confirmArchiveCar) return;
    setArchiving(true);
    try {
      await onArchiveCar(confirmArchiveCar);
      setConfirmArchiveCar(null);
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            Car Management
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Add vehicles, edit specifications, upload photos, or archive retired fleet cars.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddCar}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Car</span>
        </button>
      </div>

      {/* Search, Filters & Sort Bar */}
      <div className="bg-[#111114] border border-neutral-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-5 relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Search cars by name"
            placeholder="Search by car name, brand, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="lg:col-span-2">
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CarCategory | 'All')}
            className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
          >
            <option value="All">All Categories</option>
            <option value="Hatchback">Hatchback</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="Luxury">Luxury</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <select
            aria-label="Filter by availability"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AvailabilityStatus | 'All')}
            className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
          >
            <option value="All">All Availability</option>
            <option value="Available">Available</option>
            <option value="Booked">Booked</option>
            <option value="Unavailable">Unavailable</option>
            <option value="Under Maintenance">Under Maintenance</option>
          </select>
        </div>

        <div className="lg:col-span-2 relative">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            aria-label="Sort cars"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="w-full h-10 pl-8 pr-2 bg-[#09090B] border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="updatedAt">Last Updated</option>
            <option value="dailyRateAsc">Price: Low → High</option>
            <option value="dailyRateDesc">Price: High → Low</option>
            <option value="nameAsc">Name: A → Z</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-[#111114] border border-neutral-800 rounded-xl p-6 space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-14 bg-neutral-900 rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCars.length === 0 && (
        <div className="bg-[#111114] border border-neutral-800 rounded-xl p-10 text-center">
          <p className="font-display text-base font-semibold text-white">No matching cars found</p>
          <p className="text-xs text-neutral-400 mt-1">
            Adjust your search or filters, or add a new car to the 24 Self Drive fleet.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategoryFilter('All');
              setStatusFilter('All');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Desktop Table (md and up) */}
      {!loading && filteredCars.length > 0 && (
        <>
          <div className="hidden md:block bg-[#111114] border border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 bg-[#09090B]">
                    <th className="py-3.5 px-4">Car</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Daily Price</th>
                    <th className="py-3.5 px-4 text-right">Deposit</th>
                    <th className="py-3.5 px-4">Availability</th>
                    <th className="py-3.5 px-4">Featured</th>
                    <th className="py-3.5 px-4">Last Updated</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 text-sm">
                  {filteredCars.map((car) => (
                    <tr
                      key={car.id}
                      className="hover:bg-neutral-900/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={car.imageUrl}
                            alt={car.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-11 rounded-md object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-white whitespace-nowrap">{car.name}</p>
                            <p className="text-xs text-neutral-500">
                              {car.brand} · {car.transmission} · {car.fuelType}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-300 whitespace-nowrap">
                        {car.category}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white tabular-nums whitespace-nowrap">
                        {formatInr(car.dailyRateInr)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-300 tabular-nums whitespace-nowrap">
                        {formatInr(car.securityDepositInr)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          aria-label={`Change availability for ${car.name}`}
                          value={car.status}
                          onChange={(e) =>
                            void onQuickStatusChange(car.id, e.target.value as AvailabilityStatus)
                          }
                          className={`h-8 px-2 bg-[#09090B] border border-neutral-800 rounded-md text-xs font-medium focus:outline-none focus:border-orange-500 ${STATUS_STYLE[car.status]}`}
                        >
                          <option value="Available">Available</option>
                          <option value="Booked">Booked</option>
                          <option value="Unavailable">Unavailable</option>
                          <option value="Under Maintenance">Under Maintenance</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {car.featured ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-400">
                            <Star className="w-3.5 h-3.5 fill-orange-500" />
                            <span>Featured</span>
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500">Standard</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-neutral-400 tabular-nums whitespace-nowrap">
                        {new Date(car.updatedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditCar(car)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-md cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmArchiveCar(car)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-900 rounded-md cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Car Cards (below md) */}
          <div className="md:hidden space-y-4">
            {filteredCars.map((car) => (
              <div
                key={car.id}
                className="bg-[#111114] border border-neutral-800 rounded-xl overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4 border-b border-neutral-800">
                  <img
                    src={car.imageUrl}
                    alt={car.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-14 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold text-white truncate">{car.name}</p>
                    <p className="text-xs text-neutral-400">
                      {car.category} · {car.transmission} · {car.fuelType}
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-neutral-500 block">Daily Price</span>
                      <span className="font-mono text-sm font-bold text-white tabular-nums">
                        {formatInr(car.dailyRateInr)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Security Deposit</span>
                      <span className="font-mono text-sm font-semibold text-neutral-200 tabular-nums">
                        {formatInr(car.securityDepositInr)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Featured</span>
                      <span className={car.featured ? 'text-orange-400 font-medium' : 'text-neutral-400'}>
                        {car.featured ? 'Yes (Homepage)' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Last Updated</span>
                      <span className="font-mono text-neutral-300 tabular-nums">
                        {new Date(car.updatedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-500 mb-1">Availability</label>
                    <select
                      value={car.status}
                      onChange={(e) =>
                        void onQuickStatusChange(car.id, e.target.value as AvailabilityStatus)
                      }
                      className={`w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-xs font-medium ${STATUS_STYLE[car.status]}`}
                    >
                      <option value="Available">Available</option>
                      <option value="Booked">Booked</option>
                      <option value="Unavailable">Unavailable</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                    </select>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEditCar(car)}
                      className="flex-1 py-2.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer"
                    >
                      Edit Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmArchiveCar(car)}
                      className="px-4 py-2.5 text-xs font-semibold text-red-400 border border-red-900/60 hover:bg-red-950/40 rounded-lg cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirmation Modal Before Archiving/Deleting */}
      {confirmArchiveCar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-md bg-[#111114] border border-neutral-800 rounded-xl p-6 space-y-4">
            <h3 id="archive-confirm-title" className="font-display text-lg font-bold text-white">
              Archive {confirmArchiveCar.name}?
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              This will remove <strong>{confirmArchiveCar.name}</strong> from the public self-drive website. All existing booking records and customer history for this vehicle will remain safely preserved.
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmArchiveCar(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-300 border border-neutral-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={archiving}
                onClick={confirmArchive}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg cursor-pointer"
              >
                {archiving ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
