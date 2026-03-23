'use client';

import { LoungeReservation, LoungeStatus } from '@prisma/client';
import { useState } from 'react';
import { checkInLoungeReservation } from './actions';

type LoungeReservationRow = Pick<
  LoungeReservation,
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'arrivalTime'
  | 'numberOfGuests'
  | 'loungeNumbers'
  | 'minConsumation'
  | 'status'
>;

const statusStyles: Record<LoungeStatus, string> = {
  PENDING: 'bg-amber-950/70 text-amber-300 border border-amber-800/70',
  CONFIRMED: 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/70',
  ARRIVED: 'bg-sky-950/70 text-sky-300 border border-sky-800/70',
  CANCELLED: 'bg-rose-950/70 text-rose-300 border border-rose-800/70',
};

export default function LoungeList({
  eventId,
  reservations,
}: {
  eventId: string;
  reservations: LoungeReservationRow[];
}) {
  const [optimisticReservations, setOptimisticReservations] = useState(reservations);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCheckIn = async (reservationId: string) => {
    setLoadingId(reservationId);
    setOptimisticReservations((prev) =>
      prev.map((reservation) =>
        reservation.id === reservationId
          ? { ...reservation, status: 'ARRIVED' }
          : reservation,
      ),
    );

    const result = await checkInLoungeReservation(reservationId, eventId);

    if (!result?.success) {
      setOptimisticReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId
            ? reservations.find((item) => item.id === reservationId) ?? reservation
            : reservation,
        ),
      );
      alert(result?.message ?? 'Failed to check in lounge reservation');
    }

    setLoadingId(null);
  };

  if (optimisticReservations.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-400">
        No confirmed lounge reservations.
      </div>
    );
  }

  return (
    <ul className="space-y-2 pb-24">
      {optimisticReservations.map((reservation) => {
        const canCheckIn = reservation.status === 'CONFIRMED';

        return (
          <li
            key={reservation.id}
            className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-semibold text-white">
                    {reservation.firstName} {reservation.lastName}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[reservation.status]}`}
                  >
                    {reservation.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{reservation.phone}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-300">
                  <span className="rounded-full bg-gray-800 px-2 py-0.5">
                    Arrival: {reservation.arrivalTime}
                  </span>
                  <span className="rounded-full bg-gray-800 px-2 py-0.5">
                    Guests: {reservation.numberOfGuests}
                  </span>
                  <span className="rounded-full bg-gray-800 px-2 py-0.5">
                    Lounge: {reservation.loungeNumbers.length > 0 ? reservation.loungeNumbers.join(', ') : 'TBD'}
                  </span>
                  <span className="rounded-full bg-gray-800 px-2 py-0.5">
                    Min: CHF {Number(reservation.minConsumation).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={!canCheckIn || loadingId === reservation.id}
                onClick={() => handleCheckIn(reservation.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  canCheckIn
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60'
                    : 'border border-gray-700 text-gray-400'
                }`}
              >
                {reservation.status === 'ARRIVED'
                  ? 'Checked In'
                  : loadingId === reservation.id
                    ? 'Checking...'
                    : 'Check In'}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
