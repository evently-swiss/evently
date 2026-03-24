import prisma from '@/lib/prisma';
import Link from 'next/link';

async function getEventName(slug: string): Promise<string | null> {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { name: true },
  });

  return event?.name ?? null;
}

export default async function LoungeReservationConfirmationPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const eventName = await getEventName(eventSlug);

  return (
    <div className="min-h-screen bg-[--color-bg] px-4 py-12 text-[--color-text-primary]">
      <main className="mx-auto max-w-xl rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 text-center shadow-lg shadow-black/50">
        <h1 className="text-2xl font-bold">Reservation request received</h1>
        <p className="mt-3 text-sm text-[--color-text-secondary]">
          {eventName
            ? `Thanks for your request for ${eventName}. Our team will review it and contact you shortly.`
            : 'Thanks for your request. Our team will review it and contact you shortly.'}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/lounge/${eventSlug}`}
            className="inline-flex items-center justify-center rounded-xl border border-[--color-border] px-4 py-2 text-sm font-semibold text-[--color-text-primary] hover:border-[--color-border-strong]"
          >
            Submit another request
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-[--color-accent] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
