import prisma from '@/lib/prisma';
import { format } from 'date-fns';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function EventsPage() {
  const now = new Date();

  // Fetch featured events (non-expired, published)
  const featuredEvents = await prisma.featuredEvent.findMany({
    where: {
      expiresAt: { gt: now },
      event: { status: 'PUBLISHED', date: { gte: now } },
    },
    include: {
      event: {
        include: { venue: { select: { name: true, city: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const featuredEventIds = new Set(featuredEvents.map((f) => f.event.id));

  // Fetch remaining published upcoming events
  const regularEvents = await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      date: { gte: now },
      id: { notIn: [...featuredEventIds] },
    },
    include: { venue: { select: { name: true, city: true } } },
    orderBy: { date: 'asc' },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Events</h1>
        <p className="text-gray-400 mb-10 text-sm">Upcoming nightlife events in Switzerland</p>

        {featuredEvents.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-4">
              Featured
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {featuredEvents.map(({ event }) => (
                <EventCard key={event.id} event={event} featured />
              ))}
            </div>
          </section>
        )}

        {regularEvents.length > 0 ? (
          <section>
            {featuredEvents.length > 0 && (
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
                All Events
              </h2>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {regularEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ) : (
          featuredEvents.length === 0 && (
            <p className="text-gray-500 text-sm">No upcoming events found.</p>
          )
        )}
      </div>
    </div>
  );
}

type EventCardProps = {
  event: {
    id: string;
    name: string;
    date: Date;
    startTime: string | null;
    heroImageUrl: string | null;
    flyerImage: string | null;
    genre: string | null;
    venue: { name: string; city: string | null } | null;
    venueName: string | null;
  };
  featured?: boolean;
};

function EventCard({ event, featured }: EventCardProps) {
  const image = event.heroImageUrl ?? event.flyerImage;
  const venueName = event.venue?.name ?? event.venueName;
  const city = event.venue?.city;

  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        featured
          ? 'border-amber-800/60 bg-amber-950/20'
          : 'border-gray-800 bg-gray-900'
      }`}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={event.name}
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-4">
        {featured && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 mb-2">
            ★ Featured
          </span>
        )}
        <h3 className="font-semibold text-white truncate">{event.name}</h3>
        <p className="text-sm text-gray-400 mt-1">
          {format(event.date, 'EEE, MMM d yyyy')}
          {event.startTime && ` · ${event.startTime}`}
        </p>
        {(venueName || city) && (
          <p className="text-xs text-gray-500 mt-0.5">
            {[venueName, city].filter(Boolean).join(', ')}
          </p>
        )}
        {event.genre && (
          <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {event.genre}
          </span>
        )}
      </div>
    </div>
  );
}
