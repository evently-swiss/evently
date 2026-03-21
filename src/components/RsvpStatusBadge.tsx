import { RsvpStatus } from '@prisma/client';

type RsvpStatusBadgeProps = {
  status: RsvpStatus;
};

const statusStyles: Record<RsvpStatus, string> = {
  PENDING: 'bg-amber-950/70 text-amber-300 border border-amber-800/70',
  CONFIRMED: 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/70',
  DECLINED: 'bg-rose-950/70 text-rose-300 border border-rose-800/70',
  WAITLISTED: 'bg-sky-950/70 text-sky-300 border border-sky-800/70',
};

export function RsvpStatusBadge({ status }: RsvpStatusBadgeProps) {
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
