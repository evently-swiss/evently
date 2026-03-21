import type { CSSProperties } from 'react';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import SignupForm from '@/components/SignupForm';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

function withAlpha(hex: string, alphaHex: string): string {
  const normalized = hex.trim();

  if (!normalized.startsWith('#')) {
    return '#c084fc26';
  }

  if (normalized.length === 7) {
    return `${normalized}${alphaHex}`;
  }

  if (normalized.length === 4) {
    const expanded = normalized
      .slice(1)
      .split('')
      .map((char) => char + char)
      .join('');

    return `#${expanded}${alphaHex}`;
  }

  return '#c084fc26';
}

async function getLink(slug: string) {
  const link = await prisma.signupLink.findUnique({
    where: { slug },
    include: {
      event: true,
      assignedPromoters: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!link) {
    return { status: 'NOT_FOUND' as const };
  }

  if (!link.active) {
    return { status: 'EXPIRED' as const };
  }

  if (link.event.status !== 'PUBLISHED') {
    return { status: 'EVENT_NOT_PUBLISHED' as const };
  }

  return { status: 'SUCCESS' as const, link };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getLink(slug);

  if (result.status !== 'SUCCESS') {
    return { title: 'Invalid Link' };
  }

  const { link } = result;
  const { event } = link;

  return {
    title: `${event.name} Signup`,
    description: event.description || `Sign up for ${event.name}`,
    openGraph: {
      title: `${event.name} - Guestlist`,
      description: event.description || `Sign up for ${event.name}`,
      images: event.heroImageUrl ? [event.heroImageUrl] : undefined,
    },
  };
}

export default async function SignupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getLink(slug);

  if (result.status !== 'SUCCESS') {
    let title = 'Invalid Link';
    let message = 'This signup link is invalid.';

    switch (result.status) {
      case 'NOT_FOUND':
        title = 'Link Not Found';
        message = 'We could not find a signup link with that URL.';
        break;
      case 'EXPIRED':
        title = 'Link Expired';
        message = 'This signup link is no longer active.';
        break;
      case 'EVENT_NOT_PUBLISHED':
        title = 'Event Not Published';
        message = 'This event has not been published yet.';
        break;
      default:
        break;
    }

    return (
      <div className="min-h-screen bg-[--color-bg] px-4 py-8 text-[--color-text-primary]">
        <div className="mx-auto max-w-xl rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 text-center">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-[--color-text-secondary]">{message}</p>
        </div>
      </div>
    );
  }

  const { link } = result;
  const { event } = link;
  const accentColor = event.accentColor || '#c084fc';
  const accentDim = withAlpha(accentColor, '26');
  const promoter = link.assignedPromoters[0];

  const eventMeta = [
    format(new Date(event.date), 'EEE d MMM'),
    event.venueName,
  ]
    .filter(Boolean)
    .join(' · ');

  const style = {
    '--color-accent': accentColor,
    '--color-accent-dim': accentDim,
  } as CSSProperties;

  return (
    <div style={style} className="min-h-screen bg-[--color-bg] text-[--color-text-primary]">
      <main className="mx-auto w-full max-w-xl px-4 py-6 md:px-6 md:py-8">
        <section className="overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-lg shadow-black/50">
          <div className="relative aspect-[3/2] w-full bg-[--color-surface-2]">
            {event.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.heroImageUrl} alt={event.name} className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[--color-bg]" />
            {event.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.logoUrl}
                alt={`${event.name} logo`}
                className="absolute bottom-3 left-4 h-12 w-12 rounded-xl object-cover ring-1 ring-white/10"
              />
            ) : null}
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
              {event.description ? (
                <p className="mt-3 text-sm leading-relaxed text-[--color-text-secondary]">{event.description}</p>
              ) : null}
              {!event.description && eventMeta ? (
                <p className="mt-3 text-sm leading-relaxed text-[--color-text-secondary]">{eventMeta}</p>
              ) : null}
            </div>

            {link.type === 'PROMOTER' && promoter?.name ? (
              <div>
                <span className="inline-flex items-center rounded-full bg-[--color-accent-dim] px-2.5 py-1 text-xs font-medium text-[--color-accent] ring-1 ring-[--color-accent]/30">
                  via {promoter.name}
                </span>
              </div>
            ) : null}

            <hr className="border-[--color-border]" />

            <SignupForm link={link} />
          </div>
        </section>
      </main>
    </div>
  );
}
