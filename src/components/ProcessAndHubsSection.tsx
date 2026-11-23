import { Clock, MapPin, ShieldCheck } from 'lucide-react';
import { CUSTOMER_STORIES, PICKUP_HUBS } from '../data/fleet.ts';
import { formatInr } from '../utils/whatsapp.ts';

const PROCESS_STEPS = [
  {
    step: '01. Choose Your Car & Dates',
    description:
      'Pick a hatchback, sedan, or 7-seater SUV from our MP-04 fleet and lock your pickup hub across Bhopal.',
  },
  {
    step: '02. 5-Minute Digital KYC',
    description:
      'Share your valid Indian Driving Licence and Aadhaar card at handover or on WhatsApp before pickup.',
  },
  {
    step: '03. Drive Across Bhopal & MP',
    description:
      'Inspect fuel and vehicle condition together, then drive up to 300 km/day with preloaded FASTag and 24/7 roadside backup.',
  },
];

const TARIFF_HIGHLIGHTS = [
  { label: 'Free Daily Distance', value: '300 km / 24 hrs' },
  { label: 'Security Deposit', value: '₹3,000 – ₹5,000 (Refundable)' },
  { label: 'Extra Hour Grace', value: '60 minutes complimentary' },
  { label: 'Roadside Assistance', value: '24×7 across Bhopal & MP' },
];

export function ProcessAndHubsSection() {
  return (
    <>
      {/* Transparent Tariffs & 3-Step Self-Drive Process */}
      <section id="tariffs" className="bg-neutral-50 py-16 lg:py-20 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left: How It Works + Tariff Policy */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-orange-600 mb-2">
                  How Self-Drive Works
                </p>
                <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-neutral-950 [text-wrap:balance]">
                  Transparent Tariffs, Zero Paperwork Friction
                </h2>
              </div>

              <div className="divide-y divide-neutral-200 border-y border-neutral-200">
                {PROCESS_STEPS.map((item) => (
                  <div key={item.step} className="py-5">
                    <h3 className="font-display text-lg font-semibold text-neutral-950">
                      {item.step}
                    </h3>
                    <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed max-w-2xl">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Clean Tabular Tariff Rules */}
              <div className="bg-white border border-neutral-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-orange-500" />
                  <h3 className="font-display text-base font-bold text-neutral-950">
                    Standard Self-Drive Rental Terms
                  </h3>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {TARIFF_HIGHLIGHTS.map((row) => (
                    <div key={row.label} className="border-t border-neutral-100 pt-3">
                      <dt className="text-xs text-neutral-500">{row.label}</dt>
                      <dd className="mt-0.5 font-semibold text-neutral-950 tabular-nums">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Right: Attributable Customer Proof Adjacent to Claims */}
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Bhopal Driver Reviews
              </p>
              <div className="space-y-4">
                {CUSTOMER_STORIES.map((story) => (
                  <blockquote
                    key={story.name}
                    className="bg-white border border-neutral-200 rounded-xl p-6"
                  >
                    <p className="text-sm text-neutral-700 leading-relaxed">“{story.quote}”</p>
                    <footer className="mt-4 pt-3 border-t border-neutral-100">
                      <p className="font-display text-sm font-semibold text-neutral-950">
                        {story.name}
                      </p>
                      <p className="text-xs text-neutral-500">{story.role}</p>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bhopal Pickup Hubs */}
      <section id="hubs" className="bg-white py-16 lg:py-20 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-medium uppercase tracking-wider text-orange-600 mb-2">
              Bhopal Pickup &amp; Drop Network
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-neutral-950 [text-wrap:balance]">
              5 Convenient Pickup Hubs Across Bhopal
            </h2>
            <p className="mt-2 text-sm sm:text-base text-neutral-600">
              Collect your keys free of charge from our MP Nagar Zone II hub, or schedule flight-synced and station-side delivery anywhere in the city.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PICKUP_HUBS.map((hub) => (
              <div
                key={hub.id}
                className="border border-neutral-200 rounded-xl p-6 bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-medium text-neutral-500">{hub.area}</span>
                    <span className="font-mono text-xs font-semibold text-orange-600 tabular-nums">
                      {hub.deliveryFeeInr === 0 ? 'Free Pickup' : `+${formatInr(hub.deliveryFeeInr)}`}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-neutral-950">
                    {hub.name}
                  </h3>
                  <p className="mt-2 flex items-start gap-2 text-xs text-neutral-600">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>{hub.landmark}</span>
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center gap-2 text-xs text-neutral-600">
                  <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{hub.timings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
