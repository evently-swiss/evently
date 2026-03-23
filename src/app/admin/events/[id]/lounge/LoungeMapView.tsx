'use client';

import { useState } from 'react';
import { LoungeLayoutData, LoungeAvailabilityEntry } from '@/lib/lounge-layout';
import { LoungeStatus } from '@prisma/client';

type Reservation = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  arrivalTime: string;
  numberOfGuests: number;
  loungeNumbers: number[];
  minConsumation: string;
  status: LoungeStatus;
};

type Props = {
  layout: LoungeLayoutData;
  availability: LoungeAvailabilityEntry[];
  reservations: Reservation[];
  eventId: string;
  confirmAction: (reservationId: string, eventId: string) => Promise<void>;
  cancelAction: (reservationId: string, eventId: string) => Promise<void>;
};

// Status → fill colour
const STATUS_FILL: Record<LoungeStatus, string> = {
  PENDING: '#78350f',
  CONFIRMED: '#1e3a5f',
  ARRIVED: '#14532d',
  CANCELLED: '#374151',
};

const STATUS_TEXT: Record<LoungeStatus, string> = {
  PENDING: 'text-amber-300',
  CONFIRMED: 'text-sky-300',
  ARRIVED: 'text-emerald-300',
  CANCELLED: 'text-gray-400',
};

const STATUS_BADGE: Record<LoungeStatus, string> = {
  PENDING: 'bg-amber-950/70 text-amber-300 border border-amber-800/70',
  CONFIRMED: 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/70',
  ARRIVED: 'bg-sky-950/70 text-sky-300 border border-sky-800/70',
  CANCELLED: 'bg-rose-950/70 text-rose-300 border border-rose-800/70',
};

export default function LoungeMapView({
  layout,
  availability,
  reservations,
  eventId,
  confirmAction,
  cancelAction,
}: Props) {
  const [selectedLounge, setSelectedLounge] = useState<number | null>(null);

  const availMap = new Map(availability.map((a) => [a.number, a.status]));

  const loungeReservations = selectedLounge !== null
    ? reservations.filter((r) => r.loungeNumbers.includes(selectedLounge))
    : [];

  return (
    <div className="flex gap-4">
      {/* SVG Floor Plan */}
      <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-gray-800 bg-gray-900 p-3">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="w-full"
          style={{ maxHeight: '520px' }}
        >
          {layout.boxes.map((box) => {
            const status = availMap.get(box.number);
            const isSelected = selectedLounge === box.number;
            const isRect = box.shape !== 'circle';

            let fill = '#111827'; // dark muted
            if (isSelected) fill = '#4f46e5';
            else if (status) fill = STATUS_FILL[status];

            const strokeColor = isSelected ? '#a5b4fc' : '#374151';
            const strokeWidth = isSelected ? 3 : 1.5;

            return (
              <g
                key={box.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedLounge(isSelected ? null : box.number)}
              >
                {isRect ? (
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    rx={6}
                    fill={fill}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />
                ) : (
                  <ellipse
                    cx={box.x + box.width / 2}
                    cy={box.y + box.height / 2}
                    rx={box.width / 2}
                    ry={box.height / 2}
                    fill={fill}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />
                )}
                <text
                  x={box.x + box.width / 2}
                  y={box.y + box.height / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={Math.min(box.width, box.height) * 0.26}
                  fill="#f9fafb"
                  fontWeight="600"
                  pointerEvents="none"
                >
                  {box.label}
                </text>
                {status && (
                  <text
                    x={box.x + box.width / 2}
                    y={box.y + box.height / 2 + Math.min(box.width, box.height) * 0.2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={Math.min(box.width, box.height) * 0.18}
                    className={STATUS_TEXT[status]}
                    fill="currentColor"
                    pointerEvents="none"
                  >
                    {status}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#111827] border border-gray-700" /> Free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#78350f]" /> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#1e3a5f]" /> Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#14532d]" /> Arrived
          </span>
        </div>
      </div>

      {/* Side Panel */}
      {selectedLounge !== null && (
        <div className="w-72 shrink-0 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-3 font-semibold text-white">
            Lounge {selectedLounge}
          </h3>

          {loungeReservations.length === 0 ? (
            <p className="text-sm text-gray-400">No reservations for this lounge.</p>
          ) : (
            <div className="space-y-3">
              {loungeReservations.map((res) => (
                <div key={res.id} className="rounded-md border border-gray-800 bg-gray-950 p-3 text-sm">
                  <p className="font-medium text-white">
                    {res.firstName} {res.lastName}
                  </p>
                  <p className="text-gray-400">{res.phone}</p>
                  <p className="text-gray-400">
                    {res.arrivalTime} · {res.numberOfGuests} guests
                  </p>
                  <p className="text-gray-400">CHF {res.minConsumation}</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[res.status]}`}
                  >
                    {res.status}
                  </span>

                  {res.status !== 'CANCELLED' && res.status !== 'ARRIVED' && (
                    <div className="mt-2 flex gap-2">
                      {res.status === 'PENDING' && (
                        <form action={confirmAction.bind(null, res.id, eventId)}>
                          <button
                            type="submit"
                            className="rounded-md bg-emerald-900/50 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-900 border border-emerald-800/50"
                          >
                            Confirm
                          </button>
                        </form>
                      )}
                      <form action={cancelAction.bind(null, res.id, eventId)}>
                        <button
                          type="submit"
                          className="rounded-md bg-rose-900/50 px-3 py-1 text-xs font-medium text-rose-300 hover:bg-rose-900 border border-rose-800/50"
                        >
                          Cancel
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setSelectedLounge(null)}
            className="mt-4 w-full rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
