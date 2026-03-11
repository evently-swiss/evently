'use client';

import { useActionState } from 'react';
import { updateEvent } from './actions';
import Link from 'next/link';
import { Select } from '@/components/ui/Select';
import { Event } from '@prisma/client';
import { format } from 'date-fns';

export function EditEventForm({ event }: { event: Event }) {
    const updateEventWithId = updateEvent.bind(null, event.id);
    const [state, dispatch] = useActionState(updateEventWithId, null);

    return (
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
                            defaultValue={event.name}
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
                            defaultValue={event.slug}
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
                            defaultValue={format(new Date(event.date), 'yyyy-MM-dd')}
                            className="block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                        />
                    </div>
                    {state?.errors?.date && <p className="text-red-500 text-sm mt-1">{state.errors.date}</p>}
                </div>

                <div className="sm:col-span-3">
                    <Select
                        label="Status"
                        id="status"
                        name="status"
                        defaultValue={event.status}
                    >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                    </Select>
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
                            defaultValue={event.startTime || ''}
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
                            defaultValue={event.endTime || ''}
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
                            defaultValue={event.venueName || ''}
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
                            defaultValue={event.capacity || ''}
                            className="block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Link
                    href={`/promoter/events/${event.id}`}
                    className="px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Save Changes
                </button>
            </div>
            {state?.message && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
        </form>
    );
}
