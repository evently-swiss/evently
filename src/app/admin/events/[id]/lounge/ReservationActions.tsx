'use client';

import { useTransition } from 'react';
import { LoungeStatus } from '@prisma/client';

type ReservationActionsProps = {
  reservationId: string;
  status: LoungeStatus;
  confirmAction: () => Promise<void>;
  cancelAction: () => Promise<void>;
};

export function ReservationActions({
  status,
  confirmAction,
  cancelAction,
}: ReservationActionsProps) {
  const [isPending, startTransition] = useTransition();

  if (status === 'CANCELLED') return null;

  return (
    <div className="flex gap-2">
      {status === 'PENDING' && (
        <form
          action={() => {
            startTransition(async () => {
              await confirmAction();
            });
          }}
        >
          <button
            type="submit"
            disabled={isPending}
            className="rounded px-2 py-1 text-xs font-semibold bg-emerald-900/50 text-emerald-300 border border-emerald-800 hover:bg-emerald-800/60 disabled:opacity-50"
          >
            Confirm
          </button>
        </form>
      )}
      <form
        action={() => {
          startTransition(async () => {
            await cancelAction();
          });
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          onClick={(e) => {
            if (!confirm('Cancel this reservation?')) {
              e.preventDefault();
            }
          }}
          className="rounded px-2 py-1 text-xs font-semibold bg-rose-900/50 text-rose-300 border border-rose-800 hover:bg-rose-800/60 disabled:opacity-50"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
