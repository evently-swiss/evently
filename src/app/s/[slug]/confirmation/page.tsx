import prisma from '@/lib/prisma';
import { CheckCircle } from 'lucide-react';
import QRCode from 'qrcode';

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

async function getGuestByToken(token: string) {
  return prisma.guest.findUnique({
    where: { qrToken: token },
    select: {
      firstName: true,
      event: {
        select: {
          name: true,
        },
      },
    },
  });
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  const qrCodeDataUrl = token ? await QRCode.toDataURL(token) : null;
  const guest = token ? await getGuestByToken(token) : null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold">You're on the list!</h1>

        {guest ? (
          <p className="text-gray-400">
            {guest.firstName}, your QR check-in pass for <span className="text-white">{guest.event.name}</span> is ready.
            Save a screenshot for the door.
          </p>
        ) : (
          <p className="text-gray-400">
            Your name has been added to the guestlist. Please bring a valid ID to the event.
          </p>
        )}

        {qrCodeDataUrl ? (
          <div className="rounded-2xl border border-gray-700 bg-white p-4 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCodeDataUrl} alt="Guest QR code" className="h-64 w-64" />
          </div>
        ) : (
          <p className="text-sm text-yellow-300">QR code unavailable. Please use name + ID at the door.</p>
        )}

        <div className="pt-4">
          <p className="text-sm text-gray-500">Need to make changes? Contact the promoter or event organizer.</p>
        </div>
      </div>
    </div>
  );
}
