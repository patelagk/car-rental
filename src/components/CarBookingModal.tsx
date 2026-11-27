import { CheckCircle2, MessageCircle, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BUSINESS_CONTACT, PICKUP_HUBS } from '../data/fleet.ts';
import type { BookingRecord, CarWithAvailability } from '../types/rental.ts';
import { buildWhatsAppUrl, formatInr } from '../utils/whatsapp.ts';

function buildBookingWhatsAppMessage(booking: BookingRecord): string {
  return [
    'New car booking received',
    `Booking ID: ${booking.bookingCode}`,
    `Customer: ${booking.customerName}`,
    `Phone: ${booking.customerPhone}`,
    `Email: ${booking.customerEmail}`,
    `Driving licence: ${booking.drivingLicenceNo}`,
    `Car: ${booking.carName}`,
    `Pickup hub: ${booking.pickupHubName}`,
    `Pickup date: ${booking.pickupDate}`,
    `Return date: ${booking.returnDate}`,
    `Trip purpose: ${booking.tripPurpose}`,
    `Duration: ${booking.days} days`,
    `Rental: ${formatInr(booking.rentalSubtotalInr)}`,
    `Hub fee: ${formatInr(booking.deliveryFeeInr)}`,
    `Refundable deposit: ${formatInr(booking.securityDepositInr)}`,
    `Total payable: ${formatInr(booking.totalPayableInr)}`,
    `Status: ${booking.status}`,
  ].join('\n');
}

interface CarBookingModalProps {
  car: CarWithAvailability | null;
  initialHubId: string;
  initialPickupDate: string;
  initialReturnDate: string;
  onClose: () => void;
  onBookingConfirmed: (booking: BookingRecord) => void;
}

export function CarBookingModal({
  car,
  initialHubId,
  initialPickupDate,
  initialReturnDate,
  onClose,
  onBookingConfirmed,
}: CarBookingModalProps) {
  const [pickupHubId, setPickupHubId] = useState(initialHubId);
  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [returnDate, setReturnDate] = useState(initialReturnDate);
  const [tripPurpose, setTripPurpose] = useState<'Local Bhopal' | 'Outstation MP' | 'Airport Transfer'>('Local Bhopal');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [drivingLicenceNo, setDrivingLicenceNo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);

  useEffect(() => {
    setPickupHubId(initialHubId);
    setPickupDate(initialPickupDate);
    setReturnDate(initialReturnDate);
    setErrorMsg(null);
    setConfirmedBooking(null);
  }, [car, initialHubId, initialPickupDate, initialReturnDate]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (car) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [car, onClose]);

  if (!car) return null;

  const selectedHub = PICKUP_HUBS.find((h) => h.id === pickupHubId) ?? PICKUP_HUBS[0];
  const start = new Date(pickupDate);
  const end = new Date(returnDate);
  const diffDays =
    !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
      ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

  const rentalSubtotal = diffDays * car.dailyRateInr;
  const totalPayable = rentalSubtotal + selectedHub.deliveryFeeInr + car.securityDepositInr;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!car) return;

    const whatsappWindow = window.open('about:blank', '_blank');
    if (whatsappWindow) {
      whatsappWindow.opener = null;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          pickupHubId,
          pickupDate,
          returnDate,
          tripPurpose,
          customerName,
          customerPhone,
          customerEmail,
          drivingLicenceNo,
        }),
      });

      const data = (await response.json()) as { booking?: BookingRecord; error?: string };
      if (!response.ok || !data.booking) {
        whatsappWindow?.close();
        setErrorMsg(data.error ?? 'Could not complete reservation.');
        return;
      }

      setConfirmedBooking(data.booking);
      onBookingConfirmed(data.booking);
      if (whatsappWindow) {
        whatsappWindow.location.href = buildWhatsAppUrl(
          buildBookingWhatsAppMessage(data.booking),
          BUSINESS_CONTACT.phoneE164,
        );
      }
    } catch {
      whatsappWindow?.close();
      setErrorMsg('Network error while confirming reservation. Please try again or book on WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-xl border border-neutral-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0A0A0B] text-white flex items-center justify-between gap-4 shrink-0">
          <div>
            <p className="text-xs text-orange-400 font-medium">
              {car.category} · {car.transmission} · {car.fuelType}
            </p>
            <h3 id="booking-modal-title" className="font-display text-lg sm:text-xl font-bold">
              {confirmedBooking ? 'Reservation Confirmed' : `Book ${car.name}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking dialog"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6">
          {confirmedBooking ? (
            <div className="max-w-xl mx-auto py-4">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-orange-500 shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
                    Booking Reference
                  </p>
                  <p className="font-mono text-2xl font-bold text-neutral-950 tabular-nums">
                    {confirmedBooking.bookingCode}
                  </p>
                </div>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Your self-drive reservation for <strong>{confirmedBooking.carName}</strong> is confirmed. Carry your original Indian Driving Licence and Aadhaar card at handover.
              </p>

              <dl className="mt-6 border border-neutral-200 rounded-xl divide-y divide-neutral-200 text-sm">
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-neutral-500">Pickup Hub</dt>
                  <dd className="font-medium text-neutral-950 text-right">{confirmedBooking.pickupHubName}</dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-neutral-500">Rental Period</dt>
                  <dd className="font-mono tabular-nums text-neutral-950">
                    {confirmedBooking.pickupDate} → {confirmedBooking.returnDate} ({confirmedBooking.days}d)
                  </dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-neutral-500">Rental &amp; Hub Fee</dt>
                  <dd className="font-mono tabular-nums text-neutral-950">
                    {formatInr(confirmedBooking.rentalSubtotalInr + confirmedBooking.deliveryFeeInr)}
                  </dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-neutral-500">Refundable Deposit</dt>
                  <dd className="font-mono tabular-nums text-neutral-950">
                    {formatInr(confirmedBooking.securityDepositInr)}
                  </dd>
                </div>
                <div className="px-4 py-3 flex justify-between bg-neutral-50 font-semibold">
                  <dt className="text-neutral-950">Total Payable at Handover</dt>
                  <dd className="font-mono tabular-nums text-orange-600">
                    {formatInr(confirmedBooking.totalPayableInr)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={buildWhatsAppUrl(
                    buildBookingWhatsAppMessage(confirmedBooking),
                    BUSINESS_CONTACT.phoneE164,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Booking Details on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 text-sm font-semibold text-neutral-800 border border-neutral-300 hover:bg-neutral-50 rounded-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                WhatsApp opens with the full booking details prefilled. Review the message and tap Send to notify us. If it did not open automatically, use the button above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Specs & Tariff Summary */}
              <div className="lg:col-span-5 space-y-5">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                  <img
                    src={car.imageUrl}
                    alt={car.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs border-y border-neutral-200 py-4">
                  <div>
                    <dt className="text-neutral-500">Free Km Limit</dt>
                    <dd className="font-semibold text-neutral-950 tabular-nums mt-0.5">
                      {car.freeKmPerDay} km / day
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Extra Km Charge</dt>
                    <dd className="font-semibold text-neutral-950 tabular-nums mt-0.5">
                      ₹{car.extraKmRateInr} / km
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Fuel Economy</dt>
                    <dd className="font-semibold text-neutral-950 tabular-nums mt-0.5">
                      {car.mileageKmpl}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Luggage Space</dt>
                    <dd className="font-semibold text-neutral-950 mt-0.5">{car.luggageCapacity}</dd>
                  </div>
                </dl>

                <ul className="space-y-1.5 text-xs text-neutral-700">
                  {car.highlights.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Itemized Price Breakdown */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>
                      Tariff ({diffDays} {diffDays === 1 ? 'day' : 'days'} ×{' '}
                      {formatInr(car.dailyRateInr)})
                    </span>
                    <span className="font-mono tabular-nums text-neutral-950 font-medium">
                      {formatInr(rentalSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Hub Handover ({selectedHub.area})</span>
                    <span className="font-mono tabular-nums text-neutral-950 font-medium">
                      {selectedHub.deliveryFeeInr === 0 ? 'Free' : formatInr(selectedHub.deliveryFeeInr)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Refundable Security Deposit</span>
                    <span className="font-mono tabular-nums text-neutral-950 font-medium">
                      {formatInr(car.securityDepositInr)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm font-bold text-neutral-950">
                    <span>Total at Handover</span>
                    <span className="font-mono tabular-nums text-orange-600">
                      {formatInr(totalPayable)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Validated Booking Form */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="modal-hub" className="block text-xs font-medium text-neutral-700 mb-1">
                      Bhopal Pickup Hub
                    </label>
                    <select
                      id="modal-hub"
                      value={pickupHubId}
                      onChange={(e) => setPickupHubId(e.target.value)}
                      className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm text-neutral-950 focus:outline-none focus:border-orange-500"
                    >
                      {PICKUP_HUBS.map((hub) => (
                        <option key={hub.id} value={hub.id}>
                          {hub.name} ({hub.deliveryFeeInr === 0 ? 'Free Pickup' : `+₹${hub.deliveryFeeInr}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="modal-pickup" className="block text-xs font-medium text-neutral-700 mb-1">
                      Pickup Date
                    </label>
                    <input
                      id="modal-pickup"
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      required
                      className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm font-mono tabular-nums text-neutral-950 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-return" className="block text-xs font-medium text-neutral-700 mb-1">
                      Return Date
                    </label>
                    <input
                      id="modal-return"
                      type="date"
                      min={pickupDate}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      required
                      className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm font-mono tabular-nums text-neutral-950 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-name" className="block text-xs font-medium text-neutral-700 mb-1">
                      Driver Full Name
                    </label>
                    <input
                      id="modal-name"
                      type="text"
                      placeholder="e.g. Aarav Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm text-neutral-950 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-phone" className="block text-xs font-medium text-neutral-700 mb-1">
                      WhatsApp / Mobile (+91)
                    </label>
                    <input
                      id="modal-phone"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm font-mono tabular-nums text-neutral-950 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-email" className="block text-xs font-medium text-neutral-700 mb-1">
                      Email Address
                    </label>
                    <input
                      id="modal-email"
                      type="email"
                      placeholder="name@example.in"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm text-neutral-950 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-dl" className="block text-xs font-medium text-neutral-700 mb-1">
                      Driving Licence Number
                    </label>
                    <input
                      id="modal-dl"
                      type="text"
                      placeholder="MP0420200012345"
                      value={drivingLicenceNo}
                      onChange={(e) => setDrivingLicenceNo(e.target.value)}
                      required
                      className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm font-mono uppercase text-neutral-950 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="modal-purpose" className="block text-xs font-medium text-neutral-700 mb-1">
                      Trip Plan
                    </label>
                    <select
                      id="modal-purpose"
                      value={tripPurpose}
                      onChange={(e) =>
                        setTripPurpose(
                          e.target.value as 'Local Bhopal' | 'Outstation MP' | 'Airport Transfer',
                        )
                      }
                      className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-sm text-neutral-950 focus:outline-none focus:border-orange-500"
                    >
                      <option value="Local Bhopal">Local Bhopal City Drive</option>
                      <option value="Outstation MP">Outstation (Sanchi, Pachmarhi, Ujjain, Indore)</option>
                      <option value="Airport Transfer">Raja Bhoj Airport Pickup / Drop</option>
                    </select>
                  </div>
                </div>

                {errorMsg && (
                  <p role="alert" className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {errorMsg}
                  </p>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    {submitting ? 'Confirming Reservation...' : 'Confirm Self-Drive Booking'}
                  </button>

                  <a
                    href={buildWhatsAppUrl(
                      `Hello Bhopal Wheel Self Drive, I want to reserve ${car.name} at ${selectedHub.name} from ${pickupDate} to ${returnDate}. Total estimate: ${formatInr(totalPayable)}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-neutral-800 border border-neutral-300 hover:border-orange-500 rounded-lg"
                  >
                    <MessageCircle className="w-4 h-4 text-orange-500" />
                    <span>Book via WhatsApp</span>
                  </a>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
