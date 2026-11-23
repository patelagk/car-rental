import { CheckCircle2, ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';
import { RENTAL_FAQS } from '../data/fleet.ts';
import type { BookingRecord, CarCategory, InquiryRecord } from '../types/rental.ts';
import { formatInr } from '../utils/whatsapp.ts';

export function InquiryAndLookupSection() {
  // Booking Lookup State
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState<BookingRecord[] | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Outstation / Custom Trip Inquiry State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [route, setRoute] = useState('Bhopal → Pachmarhi (Weekend)');
  const [preferredCategory, setPreferredCategory] = useState<CarCategory | 'Any'>('SUV');
  const [travelDate, setTravelDate] = useState('');
  const [notes, setNotes] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquirySuccess, setInquirySuccess] = useState<InquiryRecord | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResults(null);

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(lookupQuery.trim())}`);
      const data = (await res.json()) as { bookings?: BookingRecord[]; error?: string };
      if (!res.ok || !data.bookings) {
        setLookupError(data.error ?? 'Booking not found.');
        return;
      }
      setLookupResults(data.bookings);
    } catch {
      setLookupError('Unable to check booking status right now.');
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setInquirySubmitting(true);
    setInquiryError(null);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, route, preferredCategory, travelDate, notes }),
      });
      const data = (await res.json()) as { inquiry?: InquiryRecord; error?: string };
      if (!res.ok || !data.inquiry) {
        setInquiryError(data.error ?? 'Failed to submit inquiry.');
        return;
      }
      setInquirySuccess(data.inquiry);
      setName('');
      setPhone('');
      setNotes('');
    } catch {
      setInquiryError('Network error while sending inquiry.');
    } finally {
      setInquirySubmitting(false);
    }
  }

  return (
    <section id="inquiries" className="bg-neutral-50 py-16 lg:py-20 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Outstation / Custom Trip Callback Form */}
          <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wider text-orange-600 mb-2">
              Outstation &amp; Multi-Day Quotes
            </p>
            <h2 className="font-display text-2xl font-bold text-neutral-950">
              Planning Sanchi, Pachmarhi, Ujjain, or Indore?
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Request a custom multi-day package or doorstep Bhopal delivery quote. Our desk responds within 15 minutes.
            </p>

            {inquirySuccess ? (
              <div className="mt-6 p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-neutral-950 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                  <span>Inquiry Received ({inquirySuccess.inquiryId})</span>
                </div>
                <p className="text-xs text-neutral-600">
                  Thank you, {inquirySuccess.name}. Our Bhopal dispatch team will call you on{' '}
                  <span className="font-mono">+91 {inquirySuccess.phone}</span> regarding{' '}
                  <strong>{inquirySuccess.route}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setInquirySuccess(null)}
                  className="mt-2 text-xs font-semibold text-orange-600 hover:underline cursor-pointer"
                >
                  Send another trip inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="inq-name" className="block text-xs font-medium text-neutral-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="inq-name"
                    type="text"
                    required
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm text-neutral-950 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label htmlFor="inq-phone" className="block text-xs font-medium text-neutral-700 mb-1">
                    Mobile Number (+91)
                  </label>
                  <input
                    id="inq-phone"
                    type="tel"
                    required
                    placeholder="9826012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm font-mono tabular-nums text-neutral-950 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label htmlFor="inq-route" className="block text-xs font-medium text-neutral-700 mb-1">
                    Route / Destination
                  </label>
                  <input
                    id="inq-route"
                    type="text"
                    required
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm text-neutral-950 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="inq-cat" className="block text-xs font-medium text-neutral-700 mb-1">
                      Car Class
                    </label>
                    <select
                      id="inq-cat"
                      value={preferredCategory}
                      onChange={(e) => setPreferredCategory(e.target.value as CarCategory | 'Any')}
                      className="w-full h-11 px-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-950 focus:outline-none focus:border-orange-500"
                    >
                      <option value="Any">Any Class</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="inq-date" className="block text-xs font-medium text-neutral-700 mb-1">
                      Travel Date
                    </label>
                    <input
                      id="inq-date"
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full h-11 px-2.5 border border-neutral-300 rounded-lg text-xs font-mono tabular-nums text-neutral-950 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="inq-notes" className="block text-xs font-medium text-neutral-700 mb-1">
                    Pickup Area or Special Requests (Optional)
                  </label>
                  <input
                    id="inq-notes"
                    type="text"
                    placeholder="e.g. Early 6 AM delivery near Lake View Hotel"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm text-neutral-950 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {inquiryError && (
                  <p role="alert" className="sm:col-span-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    {inquiryError}
                  </p>
                )}

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="px-6 py-3 text-sm font-semibold text-white bg-neutral-950 hover:bg-orange-500 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    {inquirySubmitting ? 'Submitting Request...' : 'Request Trip Quote'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: Booking Status Lookup + FAQs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="font-display text-lg font-bold text-neutral-950">
                Check Your Booking Status
              </h3>
              <p className="mt-1 text-xs text-neutral-600">
                Enter your Booking ID (e.g. <span className="font-mono">BW-2026-4108</span>) or registered 10-digit mobile number.
              </p>

              <form onSubmit={handleLookup} className="mt-4 flex gap-2">
                <input
                  type="text"
                  aria-label="Booking ID or mobile number"
                  placeholder="BW-2026-4108 or 9826054321"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  className="flex-1 h-11 px-3 border border-neutral-300 rounded-lg text-sm font-mono text-neutral-950 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="inline-flex items-center gap-1.5 h-11 px-4 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg cursor-pointer shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>{lookupLoading ? 'Checking' : 'Find'}</span>
                </button>
              </form>

              {lookupError && (
                <p className="mt-3 text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  {lookupError}
                </p>
              )}

              {lookupResults && (
                <div className="mt-4 space-y-3">
                  {lookupResults.map((b) => (
                    <div
                      key={b.bookingCode}
                      className="p-4 border border-neutral-200 rounded-lg bg-neutral-50 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-semibold text-neutral-950">
                        <span className="font-mono">{b.bookingCode}</span>
                        <span className="text-orange-600">{b.status}</span>
                      </div>
                      <p className="font-medium text-neutral-800">{b.carName}</p>
                      <p className="text-neutral-600">
                        {b.pickupHubName} · <span className="font-mono tabular-nums">{b.pickupDate} → {b.returnDate}</span>
                      </p>
                      <p className="text-neutral-600 tabular-nums">
                        Payable at handover: <strong className="text-neutral-950">{formatInr(b.totalPayableInr)}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Concise FAQ */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="font-display text-lg font-bold text-neutral-950 mb-4">
                Bhopal Self-Drive FAQs
              </h3>
              <div className="divide-y divide-neutral-200">
                {RENTAL_FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={faq.question} className="py-3 first:pt-0 last:pb-0">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between gap-3 text-left text-sm font-semibold text-neutral-950 hover:text-orange-600 cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-150 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
