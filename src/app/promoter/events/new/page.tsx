'use client';

import { useActionState } from 'react';
import { createPromoterEvent } from '../actions';
import Link from 'next/link';

export default function NewPromoterEventPage() {
    const [state, dispatch] = useActionState(createPromoterEvent, null);

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Create New Event</h2>

            <form action={dispatch} className="space-y-6 bg-gray-900 p-8 rounded-lg border border-gray-800">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400">Event Name</label>
                        <input type="text" name="name" id="name" required className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                        {state?.errors?.name && <p className="text-red-500 text-sm mt-1">{state.errors.name}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="slug" className="block text-sm font-medium text-gray-400">Slug (URL)</label>
                        <input type="text" name="slug" id="slug" required placeholder="my-event" className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                        {state?.errors?.slug && <p className="text-red-500 text-sm mt-1">{state.errors.slug}</p>}
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="date" className="block text-sm font-medium text-gray-400">Date</label>
                        <input type="date" name="date" id="date" required className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                        {state?.errors?.date && <p className="text-red-500 text-sm mt-1">{state.errors.date}</p>}
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="venueName" className="block text-sm font-medium text-gray-400">Venue</label>
                        <input type="text" name="venueName" id="venueName" className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-400">Start Time</label>
                        <input type="time" name="startTime" id="startTime" className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-400">End Time</label>
                        <input type="time" name="endTime" id="endTime" className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-400">Status</label>
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
                        <label htmlFor="capacity" className="block text-sm font-medium text-gray-400">Capacity (Optional)</label>
                        <input type="number" name="capacity" id="capacity" className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href="/promoter/events"
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
