'use client';

import { useTransition } from 'react';

type ScrapedEventActionsProps = {
  approveAction: () => Promise<void>;
  dismissAction: () => Promise<void>;
};

export function ScrapedEventActions({ approveAction, dismissAction }: ScrapedEventActionsProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2 justify-end">
      <form
        action={() => {
          startTransition(async () => {
            await approveAction();
          });
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          className="rounded px-3 py-1 text-xs font-semibold bg-emerald-900/50 text-emerald-300 border border-emerald-800 hover:bg-emerald-800/60 disabled:opacity-50"
        >
          Approve
        </button>
      </form>
      <form
        action={() => {
          startTransition(async () => {
            await dismissAction();
          });
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          onClick={(e) => {
            if (!confirm('Mark as duplicate and hide?')) e.preventDefault();
          }}
          className="rounded px-3 py-1 text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 disabled:opacity-50"
        >
          Dismiss
        </button>
      </form>
    </div>
  );
}
