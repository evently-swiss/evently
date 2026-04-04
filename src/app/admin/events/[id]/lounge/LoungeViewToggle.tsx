'use client';

import { useState } from 'react';
import { List, Map } from 'lucide-react';
import { LoungeLayoutData, LoungeAvailabilityEntry } from '@/lib/lounge-layout';
import { LoungeStatus } from '@prisma/client';
import LoungeMapView from './LoungeMapView';

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
  layout: LoungeLayoutData | null;
  availability: LoungeAvailabilityEntry[];
  reservations: Reservation[];
  eventId: string;
  confirmAction: (reservationId: string, eventId: string) => Promise<void>;
  cancelAction: (reservationId: string, eventId: string) => Promise<void>;
  children: React.ReactNode; // list view table
};

export default function LoungeViewToggle({
  layout,
  availability,
  reservations,
  eventId,
  confirmAction,
  cancelAction,
  children,
}: Props) {
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <div>
      {layout && layout.boxes.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'list'
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setView('map')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'map'
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Map className="h-4 w-4" />
            Map
          </button>
        </div>
      )}

      {view === 'list' || !layout || layout.boxes.length === 0 ? (
        children
      ) : (
        <LoungeMapView
          layout={layout}
          availability={availability}
          reservations={reservations}
          eventId={eventId}
          confirmAction={confirmAction}
          cancelAction={cancelAction}
        />
      )}
    </div>
  );
}
