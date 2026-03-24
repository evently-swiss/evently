import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";

import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Events",
  description: "Discover upcoming featured and public events on Evently.",
};

type PublicEvent = {
  id: string;
  slug: string;
  name: string;
  date: Date;
  venueName: string | null;
  description: string | null;
  heroImageUrl: string | null;
};

function inferGenre(event: PublicEvent): string {
  const description = event.description?.trim();
  if (!description) return "Genre TBA";

  const match = description.match(/genre\s*:\s*([^\n,]+)/i);
  if (match?.[1]) return match[1].trim();

  return "Genre TBA";
}

function isFeatured(event: PublicEvent): boolean {
  // Until dedicated featured-event models land, a hero image indicates a curated listing.
  return Boolean(event.heroImageUrl);
}

async function getPublicEvents() {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      date: {
        gte: new Date(),
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      date: true,
      venueName: true,
      description: true,
      heroImageUrl: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  return events.sort((a, b) => Number(isFeatured(b)) - Number(isFeatured(a)));
}

export default async function PublicEventsPage() {
  const events = await getPublicEvents();

  return (
    <main className="min-h-screen bg-[#04070f] text-white">
      <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              Public Discovery
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Events</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
              Browse what&apos;s coming next. No account required.
            </p>
          </div>

          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Feature Your Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center text-white/70">
            No upcoming public events yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => {
              const featured = isFeatured(event);

              return (
                <article
                  key={event.id}
                  className={`relative overflow-hidden rounded-2xl border p-5 ${
                    featured
                      ? "border-amber-300/40 bg-gradient-to-br from-amber-300/10 via-[#10182a] to-[#0b1324]"
                      : "border-white/10 bg-[#0b1324]/80"
                  }`}
                >
                  {featured && (
                    <p className="mb-3 inline-flex items-center rounded-full border border-amber-300/40 bg-amber-200/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
                      Featured
                    </p>
                  )}

                  <h2 className="text-lg font-bold text-white">{event.name}</h2>

                  <div className="mt-4 space-y-2 text-sm text-white/80">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-cyan-300" />
                      <span>{format(event.date, "EEE, dd MMM yyyy")}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-cyan-300" />
                      <span>{event.venueName?.trim() || "Venue TBA"}</span>
                    </p>
                  </div>

                  <p className="mt-4 inline-flex rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80">
                    {inferGenre(event)}
                  </p>

                  <Link
                    href={`/s/${event.slug}`}
                    className="mt-6 inline-flex text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
                  >
                    View Event
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
