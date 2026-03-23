import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import LoungeReservationForm from './lounge-reservation-form';

function parseLoungeNumbers(rawNumbers: string[]): number[] {
  return Array.from(
    new Set(
      rawNumbers
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ).sort((a, b) => a - b);
}

async function getEventBySlug(eventSlug: string) {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      date: true,
      venueName: true,
      description: true,
      heroImageUrl: true,
      status: true,
      lounges: {
        select: {
          tableNumbers: true,
        },
      },
    },
  });

  if (!event || event.status !== 'PUBLISHED') {
    return null;
  }

  const loungeNumberOptions = parseLoungeNumbers(event.lounges.flatMap((lounge) => lounge.tableNumbers));

  return {
    ...event,
    loungeNumberOptions,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}): Promise<Metadata> {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    return { title: 'Lounge reservation unavailable' };
  }

  return {
    title: `${event.name} Lounge Reservation`,
    description: event.description || `Reserve a lounge table for ${event.name}`,
  };
}

export default async function LoungeReservationPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  const fallbackOptions = [1, 2, 3, 4, 5, 6, 7, 8];
  const loungeNumberOptions = event.loungeNumberOptions.length > 0 ? event.loungeNumberOptions : fallbackOptions;

  return (
    <div className="min-h-screen bg-[--color-bg] text-[--color-text-primary]">
      <main className="mx-auto w-full max-w-xl px-4 py-6 md:px-6 md:py-8">
        <section className="overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-lg shadow-black/50">
          <div className="relative aspect-[3/2] w-full bg-[--color-surface-2]">
            {event.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.heroImageUrl} alt={event.name} className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[--color-bg]" />
          </div>

          <div className="space-y-4 p-4 md:p-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[--color-text-primary]">{event.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[--color-text-secondary]">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(event.date), 'EEE d MMM')}
                </span>
                {event.venueName ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.venueName}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-[--color-text-secondary]">
                Submit your VIP lounge request. We will confirm availability by phone.
              </p>
            </div>

            <hr className="border-[--color-border]" />

            <LoungeReservationForm
              eventSlug={event.slug}
              loungeNumberOptions={loungeNumberOptions}
            />

            <p className="text-center text-xs text-[--color-text-muted]">
              Looking for regular guestlist signup?{' '}
              <Link href="/" className="text-[--color-accent] hover:underline">
                Go back home
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
