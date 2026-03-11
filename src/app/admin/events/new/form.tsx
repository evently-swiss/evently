'use client';

import { useActionState } from 'react';
import { createEvent } from './actions';
import Link from 'next/link';

type Staff = {
    id: string;
    name: string | null;
    email: string;
};

type NewEventFormProps = {
    doorStaff: Staff[];
    promoters: Staff[];
};

export function NewEventForm({ doorStaff, promoters }: NewEventFormProps) {
    const [state, dispatch] = useActionState(createEvent, null);

    return (
        <div className="max-w-2xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
                        Create New Event
                    </h2>
                </div>
            </div>

            <form action={dispatch} className="space-y-6 bg-gray-900 p-8 rounded-lg border border-gray-800">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400">
                            Event Name
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                className="block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            />
                        </div>
                        {state?.errors?.name && <p className="text-red-500 text-sm mt-1">{state.errors.name}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="slug" className="block text-sm font-medium text-gray-400">
                            Slug (URL)
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="slug"
                                id="slug"
                                required
                                placeholder="my-event"
                                className="block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            />
                        </div>
                        {state?.errors?.slug && <p className="text-red-500 text-sm mt-1">{state.errors.slug}</p>}
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="date" className="block text-sm font-medium text-gray-400">
                            Date
                        </label>
                        <div className="mt-1">
                            <input
                                type="date"
                                name="date"
                                id="date"
                                required
                                className="block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            />
                        </div>
                        {state?.errors?.date && <p className="text-red-500 text-sm mt-1">{state.errors.date}</p>}
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-400">
                            Status
                        </label>
                        <select
                            name="status"
                            id="status"
                            defaultValue="DRAFT"
                            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                        </select>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-400">
                            Start Time
                        </label>
                        <div className="mt-1">
                            <input
                                type="time"
                                name="startTime"
                                id="startTime"
                                className="block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-400">
                            End Time
                        </label>
                        <div className="mt-1">
                            <input
                                type="time"
                                name="endTime"
                                id="endTime"
                                className="block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="venueName" className="block text-sm font-medium text-gray-400">
                            Venue Name
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="venueName"
                                id="venueName"
                                className="block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="capacity" className="block text-sm font-medium text-gray-400">
                            Capacity (Optional)
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="capacity"
                                id="capacity"
                                className="block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Assigned Door Staff
                        </label>
                        <div className="bg-gray-800 rounded-md border border-gray-700 p-4 max-h-48 overflow-y-auto">
                            {doorStaff.length === 0 ? (
                                <p className="text-gray-500 text-sm">No door staff found.</p>
                            ) : (
                                <div className="space-y-2">
                                    {doorStaff.map((user) => (
                                        <div key={user.id} className="flex items-center">
                                            <input
                                                id={`staff-${user.id}`}
                                                name="doorStaffIds"
                                                type="checkbox"
                                                value={user.id}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded bg-gray-700 border-gray-600"
                                            />
                                            <label htmlFor={`staff-${user.id}`} className="ml-2 block text-sm text-gray-300">
                                                {user.name} ({user.email})
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Select who can see this event in the Door view.</p>
                    </div>

                    <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Assigned Promoters
                        </label>
                        <div className="bg-gray-800 rounded-md border border-gray-700 p-4 max-h-48 overflow-y-auto">
                            {promoters.length === 0 ? (
                                <p className="text-gray-500 text-sm">No promoters found.</p>
                            ) : (
                                <div className="space-y-2">
                                    {promoters.map((user) => (
                                        <div key={user.id} className="flex items-center">
                                            <input
                                                id={`promoter-${user.id}`}
                                                name="promoterIds"
                                                type="checkbox"
                                                value={user.id}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded bg-gray-700 border-gray-600"
                                            />
                                            <label htmlFor={`promoter-${user.id}`} className="ml-2 block text-sm text-gray-300">
                                                {user.name} ({user.email})
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Select which promoters are assigned to this event.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link
                        href="/admin/events"
                        className="px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Create Event
                    </button>
                </div>
                {state?.message && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
            </form>
        </div>
    );
}
