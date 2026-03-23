import prisma from '@/lib/prisma';
import { LoungeStatus } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReservationActions } from './ReservationActions';
import { confirmReservation, cancelReservation } from './actions';
import LoungeViewToggle from './LoungeViewToggle';
import { getEventLayout, getLayoutAvailability } from '@/lib/lounge-layout';

const statusStyles: Record<LoungeStatus, string> = {
  PENDING: 'bg-amber-950/70 text-amber-300 border border-amber-800/70',
  CONFIRMED: 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/70',
  ARRIVED: 'bg-sky-950/70 text-sky-300 border border-sky-800/70',
  CANCELLED: 'bg-rose-950/70 text-rose-300 border border-rose-800/70',
};

type LoungePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
};

function parseStatus(value: string | undefined): LoungeStatus | null {
  if (
    value === 'PENDING' ||
    value === 'CONFIRMED' ||
    value === 'ARRIVED' ||
    value === 'CANCELLED'
  ) {
    return value;
  }
  return null;
}

export default async function EventLoungeReservationsPage({
  params,
  searchParams,
}: LoungePageProps) {
  const { id } = await params;
  const { status } = await searchParams;
  const selectedStatus = parseStatus(status);

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      loungeReservations: {
        where: selectedStatus ? { status: selectedStatus } : undefined,
        orderBy: [{ arrivalTime: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          arrivalTime: true,
          numberOfGuests: true,
          loungeNumbers: true,
          minConsumation: true,
          status: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const layout = await getEventLayout(id);
  const availability = layout ? await getLayoutAvailability(layout.id, id) : [];

  // Serialize Decimal to string for client component
  const reservationsForMap = event.loungeReservations.map((r) => ({
    ...r,
    minConsumation: r.minConsumation.toFixed(2),
  }));



  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lounge Reservations</h1>
          <p className="text-sm text-gray-400">{event.name}</p>
        </div>
        <Link
          href={`/admin/events/${event.id}`}
          className="inline-flex items-center justify-center rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
        >
          Back to Event
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/admin/events/${event.id}/lounge`}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            selectedStatus === null
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-900 text-gray-300 border border-gray-700 hover:bg-gray-800'
          }`}
        >
          All
        </Link>
        {(['PENDING', 'CONFIRMED', 'ARRIVED', 'CANCELLED'] as LoungeStatus[]).map(
          (statusValue) => (
            <Link
              key={statusValue}
              href={`/admin/events/${event.id}/lounge?status=${statusValue}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                selectedStatus === statusValue
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-900 text-gray-300 border border-gray-700 hover:bg-gray-800'
              }`}
            >
              {statusValue}
            </Link>
          ),
        )}
      </div>

      <LoungeViewToggle
        layout={layout}
        availability={availability}
        reservations={reservationsForMap}
        eventId={event.id}
        confirmAction={confirmReservation}
        cancelAction={cancelReservation}
      >
        <div className="overflow-x-auto rounded-md border border-gray-800 bg-gray-900 shadow">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Arrival Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Guests
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Lounge #s
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Min Consumation
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {event.loungeReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-400">
                    No lounge reservations found.
                  </td>
                </tr>
              ) : (
                event.loungeReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-800/40">
                    <td className="px-4 py-3 text-sm text-white">
                      {reservation.firstName} {reservation.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{reservation.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{reservation.arrivalTime}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {reservation.numberOfGuests}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {reservation.loungeNumbers.length > 0
                        ? reservation.loungeNumbers.join(', ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      CHF {reservation.minConsumation.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[reservation.status]}`}
                      >
                        {reservation.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ReservationActions
                        reservationId={reservation.id}
                        status={reservation.status}
                        confirmAction={confirmReservation.bind(null, reservation.id, event.id)}
                        cancelAction={cancelReservation.bind(null, reservation.id, event.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </LoungeViewToggle>
    </div>
  );
}
