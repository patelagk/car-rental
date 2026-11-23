import { Check, IndianRupee } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Car } from '../../types/rental.ts';
import { formatInr } from '../../utils/whatsapp.ts';

interface PriceManagementViewProps {
  cars: Car[];
  onSavePrice: (
    carId: string,
    payload: {
      dailyRateInr: number;
      weeklyRateInr?: number;
      monthlyRateInr?: number;
      securityDepositInr: number;
      extraHourRateInr: number;
      extraKmRateInr?: number;
    },
  ) => Promise<void>;
}

interface PriceDraft {
  dailyRateInr: string;
  weeklyRateInr: string;
  monthlyRateInr: string;
  securityDepositInr: string;
  extraHourRateInr: string;
  extraKmRateInr: string;
}

export function PriceManagementView({ cars, onSavePrice }: PriceManagementViewProps) {
  const [drafts, setDrafts] = useState<Record<string, PriceDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, PriceDraft> = {};
    for (const car of cars) {
      initial[car.id] = {
        dailyRateInr: String(car.dailyRateInr),
        weeklyRateInr: car.weeklyRateInr ? String(car.weeklyRateInr) : '',
        monthlyRateInr: car.monthlyRateInr ? String(car.monthlyRateInr) : '',
        securityDepositInr: String(car.securityDepositInr),
        extraHourRateInr: String(car.extraHourRateInr),
        extraKmRateInr: String(car.extraKmRateInr),
      };
    }
    setDrafts(initial);
  }, [cars]);

  function updateField(carId: string, field: keyof PriceDraft, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [carId]: {
        ...(prev[carId] || {
          dailyRateInr: '0',
          weeklyRateInr: '',
          monthlyRateInr: '',
          securityDepositInr: '0',
          extraHourRateInr: '0',
          extraKmRateInr: '0',
        }),
        [field]: value,
      },
    }));
  }

  async function handleSaveRow(carId: string) {
    const d = drafts[carId];
    if (!d) return;
    setSavingId(carId);
    try {
      await onSavePrice(carId, {
        dailyRateInr: Number(d.dailyRateInr),
        weeklyRateInr: d.weeklyRateInr ? Number(d.weeklyRateInr) : undefined,
        monthlyRateInr: d.monthlyRateInr ? Number(d.monthlyRateInr) : undefined,
        securityDepositInr: Number(d.securityDepositInr),
        extraHourRateInr: Number(d.extraHourRateInr),
        extraKmRateInr: d.extraKmRateInr ? Number(d.extraKmRateInr) : undefined,
      });
      setSavedId(carId);
      setTimeout(() => setSavedId((curr) => (curr === carId ? null : curr)), 2500);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">
          Price Management (₹ INR)
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Update daily, weekly, monthly tariffs, deposits, and extra charges. Saved changes immediately update the public website.
        </p>
      </div>

      <div className="space-y-4">
        {cars.map((car) => {
          const d = drafts[car.id] || {
            dailyRateInr: String(car.dailyRateInr),
            weeklyRateInr: '',
            monthlyRateInr: '',
            securityDepositInr: String(car.securityDepositInr),
            extraHourRateInr: String(car.extraHourRateInr),
            extraKmRateInr: String(car.extraKmRateInr),
          };
          const isSaving = savingId === car.id;
          const isSaved = savedId === car.id;

          return (
            <div
              key={car.id}
              className="bg-[#111114] border border-neutral-800 rounded-xl p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3.5">
                  <img
                    src={car.imageUrl}
                    alt={car.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-11 rounded-md object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                  />
                  <div>
                    <h2 className="font-display text-base font-bold text-white">{car.name}</h2>
                    <p className="text-xs text-neutral-400">
                      {car.category} · Current Public Daily Rate:{' '}
                      <span className="font-mono font-semibold text-orange-400 tabular-nums">
                        {formatInr(car.dailyRateInr)}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleSaveRow(car.id)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isSaved ? <Check className="w-4 h-4" /> : <IndianRupee className="w-3.5 h-3.5" />}
                  <span>{isSaving ? 'Saving...' : isSaved ? 'Price Updated' : 'Save Price'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Daily Price (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={d.dailyRateInr}
                    onChange={(e) => updateField(car.id, 'dailyRateInr', e.target.value)}
                    className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Weekly Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Optional"
                    value={d.weeklyRateInr}
                    onChange={(e) => updateField(car.id, 'weeklyRateInr', e.target.value)}
                    className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Monthly Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Optional"
                    value={d.monthlyRateInr}
                    onChange={(e) => updateField(car.id, 'monthlyRateInr', e.target.value)}
                    className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={d.securityDepositInr}
                    onChange={(e) => updateField(car.id, 'securityDepositInr', e.target.value)}
                    className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Extra Hour (₹/hr)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={d.extraHourRateInr}
                    onChange={(e) => updateField(car.id, 'extraHourRateInr', e.target.value)}
                    className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Extra Km (₹/km)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={d.extraKmRateInr}
                    onChange={(e) => updateField(car.id, 'extraKmRateInr', e.target.value)}
                    className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
