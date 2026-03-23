import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ScrapedSyncStatus } from '@prisma/client';
import { ScrapedEventActions } from './ScrapedEventActions';
import { approveScrapedEvent, dismissScrapedEvent } from './actions';
import { format } from 'date-fns';

const statusStyles: Record<ScrapedSyncStatus, string> = {
  NEW: 'bg-amber-950/70 text-amber-300 border border-amber-800/70',
  RECONCILED: 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/70',
  DUPLICATE: 'bg-gray-800 text-gray-500 border border-gray-700',
  FAILED: 'bg-rose-950/70 text-rose-300 border border-rose-800/70',
};

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

function parseStatus(value: string | undefined): ScrapedSyncStatus | null {
  if (value === 'NEW' || value === 'RECONCILED' || value === 'DUPLICATE' || value === 'FAILED') {
    return value;
  }
  return null;
}

export default async function ScrapedEventsPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const selectedStatus = parseStatus(status) ?? 'NEW';

  const events = await prisma.scrapedEvent.findMany({
    where: { syncStatus: selectedStatus },
    orderBy: [{ date: 'asc' }, { scrapedAt: 'desc' }],
    include: {
      event: { select: { id: true, status: true } },
    },
  });

  const filterTabs: Array<{ label: string; value: ScrapedSyncStatus | 'NEW' }> = [
    { label: 'New', value: 'NEW' },
    { label: 'Reconciled', value: 'RECONCILED' },
    { label: 'Duplicate', value: 'DUPLICATE' },
    { label: 'Failed', value: 'FAILED' },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Scraped Events</h1>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filterTabs.map(({ label, value }) => (
          <Link
            key={value}
            href={`/admin/scraped-events?status=${value}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              selectedStatus === value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-900 text-gray-300 border border-gray-700 hover:bg-gray-800'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-gray-400 mt-8">No scraped events with status {selectedStatus}.</p>
      ) : (
        <div className="space-y-3">
          {events.map((scraped) => (
            <div
              key={scraped.id}
              className="rounded-lg border border-gray-800 bg-gray-900 p-4 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              {scraped.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={scraped.imageUrl}
                  alt={scraped.title}
                  className="w-full sm:w-24 h-24 object-cover rounded-md flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-white font-semibold truncate">{scraped.title}</span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[scraped.syncStatus]}`}
                  >
                    {scraped.syncStatus}
                  </span>
                  {scraped.event && (
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        scraped.event.status === 'PUBLISHED'
                          ? 'bg-emerald-900/50 text-emerald-300'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      Event: {scraped.event.status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {format(scraped.date, 'PPP')}
                  {scraped.startTime && ` · ${scraped.startTime}`}
                  {scraped.endTime && ` – ${scraped.endTime}`}
                  {' · '}
                  <span className="text-gray-500">{scraped.venueSlug}</span>
                </p>
                {scraped.eventUrl && (
                  <a
                    href={scraped.eventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block truncate max-w-xs"
                  >
                    {scraped.eventUrl}
                  </a>
                )}
              </div>
              {(scraped.syncStatus === 'NEW' || scraped.syncStatus === 'RECONCILED') && (
                <div className="flex-shrink-0">
                  <ScrapedEventActions
                    approveAction={approveScrapedEvent.bind(null, scraped.id)}
                    dismissAction={dismissScrapedEvent.bind(null, scraped.id)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
