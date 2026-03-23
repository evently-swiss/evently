import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LoungeLayoutEditor from './LoungeLayoutEditor';
import { getVenueLayout } from '@/lib/lounge-layout';

type Props = {
  params: Promise<{ venueId: string }>;
};

export default async function LoungeLayoutPage({ params }: Props) {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/admin');
  }

  const { venueId } = await params;

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { id: true, name: true },
  });

  if (!venue) notFound();

  const layout = await getVenueLayout(venueId);

  const initialBoxes = layout
    ? layout.boxes.map((b) => ({
        clientId: `db-${b.id}`,
        dbId: b.id,
        label: b.label,
        number: b.number,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        shape: b.shape as 'rect' | 'circle',
        color: b.color,
        capacity: b.capacity,
        minConsumation: b.minConsumation,
      }))
    : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lounge Layout</h1>
          <p className="text-sm text-gray-400">{venue.name}</p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
        >
          Back
        </Link>
      </div>

      <LoungeLayoutEditor
        venueId={venue.id}
        venueName={venue.name}
        layoutId={layout?.id ?? null}
        initialBoxes={initialBoxes}
      />
    </div>
  );
}
