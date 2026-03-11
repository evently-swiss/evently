'use client';

import { useState } from 'react';
import { Guest, CheckIn } from '@prisma/client';
import { checkInGuest, checkOutGuest } from './actions';
import { Search, X, Minus, Plus } from 'lucide-react';

type GuestWithCheckIn = Guest & { checkIn: CheckIn | null };

type BottomSheetState = {
    guest: GuestWithCheckIn;
    mode: 'checkin' | 'checkout';
    count: number;
} | null;

export default function GuestList({ guests, eventId }: { guests: GuestWithCheckIn[], eventId: string }) {
    const [query, setQuery] = useState('');
    const [optimisticGuests, setOptimisticGuests] = useState(guests);
    const [selectedGuest, setSelectedGuest] = useState<GuestWithCheckIn | null>(null);
    const [sheet, setSheet] = useState<BottomSheetState>(null);

    const filteredGuests = optimisticGuests.filter((guest) => {
        const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
        return fullName.includes(query.toLowerCase());
    });

    const executeCheckIn = async (guest: GuestWithCheckIn, count: number) => {
        setOptimisticGuests((prev) =>
            prev.map((g) =>
                g.id === guest.id
                    ? {
                        ...g,
                        checkIn: {
                            id: 'temp',
                            guestId: guest.id,
                            checkedInByUserId: 'me',
                            checkedInAt: new Date(),
                            checkedInCount: count,
                            checkedOutAt: null,
                            checkedOutCount: null,
                        },
                    }
                    : g
            )
        );
        const result = await checkInGuest(guest.id, eventId, count);
        if (!result?.success) {
            setOptimisticGuests((prev) =>
                prev.map((g) => (g.id === guest.id ? { ...g, checkIn: guests.find(og => og.id === guest.id)?.checkIn ?? null } : g))
            );
            alert('Failed to check in guest');
        }
    };

    const executeCheckOut = async (guest: GuestWithCheckIn, count: number) => {
        setOptimisticGuests((prev) =>
            prev.map((g) =>
                g.id === guest.id && g.checkIn
                    ? { ...g, checkIn: { ...g.checkIn, checkedOutAt: new Date(), checkedOutCount: count } }
                    : g
            )
        );
        const result = await checkOutGuest(guest.id, eventId, count);
        if (!result?.success) {
            setOptimisticGuests((prev) =>
                prev.map((g) => (g.id === guest.id ? { ...g, checkIn: guests.find(og => og.id === guest.id)?.checkIn ?? null } : g))
            );
            alert('Failed to check out guest');
        }
    };

    const handleCheckIn = (guest: GuestWithCheckIn) => {
        // Skip sheet if only 1 person possible
        if (guest.plusOnesCount === 0) {
            executeCheckIn(guest, 1);
        } else {
            setSheet({ guest, mode: 'checkin', count: 1 });
        }
    };

    const handleCheckOut = (guest: GuestWithCheckIn) => {
        const checkedInCount = guest.checkIn?.checkedInCount ?? 1;
        // Skip sheet if only 1 person was checked in
        if (checkedInCount === 1) {
            executeCheckOut(guest, 1);
        } else {
            setSheet({ guest, mode: 'checkout', count: 1 });
        }
    };

    const handleConfirm = async () => {
        if (!sheet) return;
        const { guest, mode, count } = sheet;
        setSheet(null);
        if (mode === 'checkin') {
            await executeCheckIn(guest, count);
        } else {
            await executeCheckOut(guest, count);
        }
    };

    const adjustCount = (delta: number) => {
        if (!sheet) return;
        const { guest, mode } = sheet;
        const max = mode === 'checkin' ? 1 + guest.plusOnesCount : (sheet.guest.checkIn?.checkedInCount ?? 1);
        setSheet({ ...sheet, count: Math.min(max, Math.max(1, sheet.count + delta)) });
    };

    return (
        <div>
            {/* Search */}
            <div className="sticky top-0 bg-black pt-4 pb-3 z-10">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-3 py-4 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 text-base"
                        placeholder="Search guest..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Guest list */}
            <ul className="space-y-2 pb-24">
                {filteredGuests.map((guest) => {
                    const isCheckedIn = !!guest.checkIn && !guest.checkIn.checkedOutAt;
                    const isCheckedOut = !!guest.checkIn?.checkedOutAt;

                    return (
                        <li
                            key={guest.id}
                            className={`rounded-xl border ${
                                isCheckedIn
                                    ? 'bg-green-900/20 border-green-900/50'
                                    : isCheckedOut
                                        ? 'bg-gray-900/40 border-gray-800 opacity-50'
                                        : 'bg-gray-900 border-gray-800'
                            }`}
                        >
                            <div className="flex items-center gap-3 px-4 py-4">
                                {/* Name + badges */}
                                <div
                                    className="flex-1 min-w-0"
                                    onClick={() => guest.note && setSelectedGuest(guest)}
                                >
                                    <p className="text-base font-semibold text-white leading-tight truncate">
                                        {guest.firstName} {guest.lastName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        {guest.plusOnesCount > 0 && (
                                            <span className="text-xs font-medium text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded-full">
                                                +{guest.plusOnesCount}
                                            </span>
                                        )}
                                        {isCheckedIn && guest.checkIn && (
                                            <span className="text-xs font-medium text-green-300 bg-green-900/50 px-2 py-0.5 rounded-full">
                                                ✓ {guest.checkIn.checkedInCount}
                                            </span>
                                        )}
                                        {isCheckedOut && guest.checkIn && (
                                            <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                                                {guest.checkIn.checkedOutCount ?? 0} left
                                            </span>
                                        )}
                                        {guest.note && (
                                            <span className="text-xs text-gray-500 truncate max-w-[140px]">
                                                {guest.note}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                {isCheckedIn ? (
                                    <button
                                        onClick={() => handleCheckOut(guest)}
                                        className="flex-shrink-0 px-8 py-3 rounded-full border border-gray-600 text-sm font-medium text-gray-300 active:bg-gray-800"
                                    >
                                        Out
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleCheckIn(guest)}
                                        className="flex-shrink-0 px-8 py-3 rounded-full bg-indigo-600 active:bg-indigo-700 text-sm font-semibold text-white"
                                    >
                                        {isCheckedOut ? 'Re-Check In' : 'Check In'}
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
                {filteredGuests.length === 0 && (
                    <li className="text-center text-gray-500 py-10">No guests found.</li>
                )}
            </ul>

            {/* Bottom Sheet (only shown when plusOnes > 0) */}
            {sheet && (() => {
                const maxCount = sheet.mode === 'checkin'
                    ? 1 + sheet.guest.plusOnesCount
                    : (sheet.guest.checkIn?.checkedInCount ?? 1);
                const label = sheet.count === 1 ? 'person' : 'people';
                return (
                    <div className="fixed inset-0 z-50 flex flex-col justify-end">
                        <div className="absolute inset-0 bg-black/60" onClick={() => setSheet(null)} />
                        <div className="relative bg-gray-900 rounded-t-3xl px-8 pt-4 pb-10 shadow-2xl">

                            {/* Handle */}
                            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5" />

                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
                                        {sheet.mode === 'checkin' ? 'Checking in' : 'Checking out'}
                                    </p>
                                    <h2 className="text-2xl font-bold text-white leading-tight">
                                        {sheet.guest.firstName} {sheet.guest.lastName}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className="text-sm text-gray-400">
                                            <span className="text-white font-medium">{1 + sheet.guest.plusOnesCount}</span>
                                            {' '}guests registered
                                        </span>
                                        {sheet.mode === 'checkout' && sheet.guest.checkIn && (
                                            <span className="text-sm text-gray-500">
                                                · <span className="text-gray-300 font-medium">{sheet.guest.checkIn.checkedInCount}</span> entered
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSheet(null)}
                                    className="p-2 -mr-1 -mt-1 text-gray-500 active:text-gray-300"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Stepper */}
                            <div className="flex items-center justify-between mb-6">
                                <button
                                    onClick={() => adjustCount(-1)}
                                    disabled={sheet.count <= 1}
                                    className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gray-800 active:bg-gray-700 active:scale-95 transition-transform disabled:bg-gray-900 disabled:text-gray-700 disabled:cursor-not-allowed"
                                >
                                    <Minus className="h-10 w-10 text-white" />
                                </button>

                                <div className="flex flex-col items-center select-none">
                                    <span className="text-[80px] font-bold text-white leading-none tabular-nums">{sheet.count}</span>
                                </div>

                                <button
                                    onClick={() => adjustCount(1)}
                                    disabled={sheet.count >= maxCount}
                                    className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gray-800 active:bg-gray-700 active:scale-95 transition-transform disabled:bg-gray-900 disabled:text-gray-700 disabled:cursor-not-allowed"
                                >
                                    <Plus className="h-10 w-10 text-white" />
                                </button>
                            </div>

                            {/* Confirm button */}
                            <button
                                onClick={handleConfirm}
                                className={`w-full py-6 rounded-2xl text-lg font-bold text-white active:scale-[0.98] transition-transform ${
                                    sheet.mode === 'checkin'
                                        ? 'bg-indigo-600 active:bg-indigo-700'
                                        : 'bg-gray-700 active:bg-gray-600'
                                }`}
                            >
                                {sheet.mode === 'checkin' ? `Check In ${sheet.count} ${label}` : `Check Out ${sheet.count} ${label}`}
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* Note Modal */}
            {selectedGuest && (
                <div className="fixed z-50 inset-0" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black/80" />
                    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4 sm:p-0" onClick={() => setSelectedGuest(null)}>
                        <div className="relative bg-gray-900 rounded-2xl sm:rounded-xl px-5 pt-5 pb-6 w-full sm:max-w-md border border-gray-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base font-semibold text-white">
                                    Note — {selectedGuest.firstName}
                                </h3>
                                <button
                                    onClick={() => setSelectedGuest(null)}
                                    className="p-1 text-gray-500 active:text-gray-300"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {selectedGuest.note}
                            </p>
                            <button
                                onClick={() => setSelectedGuest(null)}
                                className="mt-5 w-full py-3 rounded-xl bg-gray-800 active:bg-gray-700 text-sm font-medium text-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
