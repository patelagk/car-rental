import { BUSINESS_CONTACT } from '../data/fleet.ts';

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWhatsAppUrl(message: string, phoneE164?: string): string {
  const encoded = encodeURIComponent(message);
  const cleanPhone = (phoneE164 || BUSINESS_CONTACT.phoneE164).replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function getDefaultDates(): { pickupDate: string; returnDate: string } {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 3);

  return {
    pickupDate: tomorrow.toISOString().split('T')[0],
    returnDate: dayAfter.toISOString().split('T')[0],
  };
}
