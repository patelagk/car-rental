import type { Car } from '../src/types/rental.ts';

export interface PublicCarAvailability {
  available: boolean;
  availabilityReason?: string;
  conflictDates?: string;
}

export function datesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA;
}

export function getPublicCarAvailability(
  car: Pick<Car, 'status' | 'blockedDates'>,
  pickupDate: string,
  returnDate: string,
): PublicCarAvailability {
  let available = car.status === 'Available';
  let availabilityReason: string | undefined = car.status !== 'Available' ? car.status : undefined;
  let conflictDates: string | undefined;

  if (available && pickupDate && returnDate) {
    const blocked = (car.blockedDates || []).find((range) =>
      datesOverlap(pickupDate, returnDate, range.startDate, range.endDate),
    );
    if (blocked) {
      available = false;
      availabilityReason = blocked.reason || 'Unavailable for selected dates';
      conflictDates = `${blocked.startDate} to ${blocked.endDate}`;
    }
  }

  return { available, availabilityReason, conflictDates };
}
