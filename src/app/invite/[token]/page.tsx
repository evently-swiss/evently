import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { Calendar, MapPin } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { RsvpStatusBadge } from '@/components/RsvpStatusBadge';

async function getInvite(token: string) {
  const guest = await prisma.guest.findUnique({
    where: { inviteToken: token },
    include: { event: true },
  });

  if (!guest) {
    notFound();
  }

  return guest;
}

async function updateInviteResponse(formData: FormData) {
  'use server';

  const token = formData.get('token');
  const response = formData.get('response');

  if (typeof token !== 'string' || (response !== 'CONFIRMED' && response !== 'DECLINED')) {
    redirect('/');
  }

  const guest = await prisma.guest.findUnique({
    where: { inviteToken: token },
    select: { id: true, eventId: true },
  });

  if (!guest) {
    redirect('/');
  }

  await prisma.guest.update({
    where: { id: guest.id },
    data: {
      rsvpStatus: response,
    },
  });

  revalidatePath(`/invite/${token}`);
  revalidatePath(`/admin/events/${guest.eventId}`);
  revalidatePath(`/promoter/events/${guest.eventId}`);

  redirect(`/invite/${token}?status=${response === 'CONFIRMED' ? 'confirmed' : 'declined'}`);
}

function getMessage(status: string | undefined, currentStatus: string) {
  if (status === 'confirmed' || currentStatus === 'CONFIRMED') {
    return {
      title: 'Attendance confirmed',
      body: 'Thanks for confirming. You are on the list.',
      tone: 'text-emerald-300 border-emerald-800/70 bg-emerald-950/40',
    };
  }

  if (status === 'declined' || currentStatus === 'DECLINED') {
    return {
      title: 'RSVP declined',
      body: 'Your decline has been recorded. You can still change your response later using this link.',
      tone: 'text-rose-300 border-rose-800/70 bg-rose-950/40',
    };
  }

  return {
    title: 'Please respond',
    body: 'Choose one option below to update your RSVP status.',
    tone: 'text-gray-300 border-gray-700 bg-gray-900/40',
  };
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { token } = await params;
  const { status } = await searchParams;
  const guest = await getInvite(token);
  const message = getMessage(status, guest.rsvpStatus);

  return (
    <div className="min-h-screen bg-[--color-bg] text-[--color-text-primary]">
      <main className="mx-auto w-full max-w-xl px-4 py-10 md:px-6">
        <section className="overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-lg shadow-black/50">
          <div className="space-y-5 p-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[--color-text-primary]">{guest.event.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[--color-text-secondary]">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(guest.event.date), 'EEE d MMM')}
                </span>
                {guest.event.venueName ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {guest.event.venueName}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-[--color-text-secondary]">
                Hi {guest.firstName}, please confirm whether you are attending.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[--color-text-secondary]">Current RSVP:</span>
              <RsvpStatusBadge status={guest.rsvpStatus} />
            </div>

            <div className={`rounded-xl border p-3 ${message.tone}`}>
              <p className="text-sm font-semibold">{message.title}</p>
              <p className="mt-1 text-sm">{message.body}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <form action={updateInviteResponse}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="response" value="CONFIRMED" />
                <button
                  type="submit"
                  className="w-full rounded-md border border-emerald-700 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Confirm Attendance
                </button>
              </form>

              <form action={updateInviteResponse}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="response" value="DECLINED" />
                <button
                  type="submit"
                  className="w-full rounded-md border border-rose-700 bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Decline
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
