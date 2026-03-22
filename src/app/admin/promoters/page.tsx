import prisma from '@/lib/prisma';

type PromoterAnalyticsRow = {
    id: string;
    name: string;
    email: string;
    guests: number;
    checkedIn: number;
    checkInRate: number;
    eventsAssigned: number;
};

async function getPromoterAnalytics(): Promise<PromoterAnalyticsRow[]> {
    const promoters = await prisma.user.findMany({
        where: { role: 'PROMOTER' },
        select: {
            id: true,
            name: true,
            email: true,
            guests: {
                select: {
                    checkIn: {
                        select: { id: true },
                    },
                },
            },
            _count: {
                select: {
                    guests: true,
                    assignedEvents: true,
                },
            },
        },
    });

    return promoters
        .map((promoter) => {
            const checkedIn = promoter.guests.reduce((total, guest) => {
                return guest.checkIn ? total + 1 : total;
            }, 0);
            const guests = promoter._count.guests;
            const checkInRate = guests > 0 ? (checkedIn / guests) * 100 : 0;

            return {
                id: promoter.id,
                name: promoter.name ?? 'No Name',
                email: promoter.email,
                guests,
                checkedIn,
                checkInRate,
                eventsAssigned: promoter._count.assignedEvents,
            };
        })
        .sort((a, b) => b.guests - a.guests);
}

export default async function PromotersPage() {
    const promoters = await getPromoterAnalytics();

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Promoter Analytics</h1>
                <p className="mt-2 text-sm text-gray-400">
                    Performance overview sorted by total guests.
                </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 shadow sm:rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-800">
                        <thead className="bg-gray-950">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Guests
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Checked In
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Check-in Rate %
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Events Assigned
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {promoters.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">
                                        No promoters found.
                                    </td>
                                </tr>
                            ) : (
                                promoters.map((promoter) => (
                                    <tr key={promoter.id} className="hover:bg-gray-800/40">
                                        <td className="px-4 py-4 text-sm font-medium text-white">{promoter.name}</td>
                                        <td className="px-4 py-4 text-sm text-gray-300">{promoter.email}</td>
                                        <td className="px-4 py-4 text-sm text-right text-gray-300">{promoter.guests}</td>
                                        <td className="px-4 py-4 text-sm text-right text-gray-300">{promoter.checkedIn}</td>
                                        <td className="px-4 py-4 text-sm text-right text-gray-300">{promoter.checkInRate.toFixed(1)}%</td>
                                        <td className="px-4 py-4 text-sm text-right text-gray-300">{promoter.eventsAssigned}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
