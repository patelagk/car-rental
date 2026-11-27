import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPublicCarAvailability } from './availability.ts';
import type { Car } from '../src/types/rental.ts';

describe('public car availability', () => {
  it('keeps an admin-available car available for selected dates unless an admin blocked them', () => {
    const availability = getPublicCarAvailability(
      { status: 'Available', blockedDates: [] },
      '2026-11-28',
      '2026-11-30',
    );

    assert.deepEqual(availability, {
      available: true,
      availabilityReason: undefined,
      conflictDates: undefined,
    });
  });

  it('reflects an admin-set car status', () => {
    const availability = getPublicCarAvailability(
      { status: 'Booked', blockedDates: [] },
      '2026-11-28',
      '2026-11-30',
    );

    assert.deepEqual(availability, {
      available: false,
      availabilityReason: 'Booked',
      conflictDates: undefined,
    });
  });

  it('continues to honor date ranges explicitly blocked by an admin', () => {
    const blockedDates: Car['blockedDates'] = [
      {
        id: 'admin-block',
        startDate: '2026-11-28',
        endDate: '2026-11-30',
        reason: 'Maintenance',
      },
    ];
    const availability = getPublicCarAvailability(
      { status: 'Available', blockedDates },
      '2026-11-28',
      '2026-11-30',
    );

    assert.deepEqual(availability, {
      available: false,
      availabilityReason: 'Maintenance',
      conflictDates: '2026-11-28 to 2026-11-30',
    });
  });
});
