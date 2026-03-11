'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { createPromoterLink } from './actions';
import { Plus, X } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { ActionState } from '@/lib/definitions';

function PromoterCreateLinkForm({ eventId, onSuccess }: { eventId: string, onSuccess: () => void }) {
    const createLinkWithId = createPromoterLink.bind(null, eventId);
    const [state, dispatch] = useActionState<ActionState, FormData>(createLinkWithId, null);

    useEffect(() => {
        if (state?.success) {
            onSuccess();
        }
    }, [state?.success, onSuccess]);

    return (
        <form action={dispatch} className="space-y-4">
            <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-400">Slug</label>
                <input type="text" name="slug" id="slug" required className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                {state?.errors?.slug && <p className="text-red-500 text-xs mt-1">{state.errors.slug}</p>}
            </div>

            <div>
                <Select label="Type" name="type" id="type">
                    <option value="PROMOTER">Promoter (Standard)</option>
                    <option value="PERSONAL">Personal (VIP/Specific)</option>
                </Select>
            </div>

            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-400">Title</label>
                <input type="text" name="title" id="title" className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="maxTotalGuests" className="block text-sm font-medium text-gray-400">Max Guests</label>
                    <input type="number" name="maxTotalGuests" id="maxTotalGuests" className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                </div>
                <div>
                    <label htmlFor="maxPlusOnesPerSignup" className="block text-sm font-medium text-gray-400">Max +1s</label>
                    <input type="number" name="maxPlusOnesPerSignup" id="maxPlusOnesPerSignup" defaultValue={3} className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Select label="Email" name="emailMode" id="emailMode">
                        <option value="REQUIRED">Required</option>
                        <option value="OPTIONAL">Optional</option>
                        <option value="HIDDEN">Hidden</option>
                    </Select>
                </div>
                <div>
                    <Select label="Phone" name="phoneMode" id="phoneMode">
                        <option value="OPTIONAL">Optional</option>
                        <option value="REQUIRED">Required</option>
                        <option value="HIDDEN">Hidden</option>
                    </Select>
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white focus:outline-none"
                    onClick={onSuccess}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Create
                </button>
            </div>
            {state?.message && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
        </form>
    );
}

export function PromoterCreateLinkModal({ eventId }: { eventId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [version, setVersion] = useState(0);

    const handleOpen = () => {
        setVersion(v => v + 1);
        setIsOpen(true);
    };

    if (!isOpen) {
        return (
            <button
                onClick={handleOpen}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <Plus className="h-4 w-4 mr-2" />
                New Link
            </button>
        );
    }

    return (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-900/80 transition-opacity" aria-hidden="true" onClick={() => setIsOpen(false)}></div>

                <div className="relative inline-block align-bottom bg-gray-900 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-800">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button
                            type="button"
                            className="bg-gray-900 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                                Create My Link
                            </h3>
                            <div className="mt-2">
                                <PromoterCreateLinkForm key={version} eventId={eventId} onSuccess={() => setIsOpen(false)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
