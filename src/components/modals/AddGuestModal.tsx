'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { Plus, X } from 'lucide-react';
import { ActionState } from '@/lib/definitions';

type AddGuestModalProps = {
    eventId: string;
    addGuestAction: (eventId: string, prevState: any, formData: FormData) => Promise<ActionState>;
};

function AddGuestForm({ eventId, addGuestAction, onSuccess }: AddGuestModalProps & { onSuccess: () => void }) {
    const action = addGuestAction.bind(null, eventId);
    const [state, dispatch] = useActionState<ActionState, FormData>(action, null);

    useEffect(() => {
        if (state?.success) {
            onSuccess();
        }
    }, [state, onSuccess]);

    return (
        <form action={dispatch} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-400">First Name</label>
                    <input type="text" name="firstName" id="firstName" required className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                    {state?.errors?.firstName && <p className="text-red-500 text-xs mt-1">{state.errors.firstName}</p>}
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-400">Last Name</label>
                    <input type="text" name="lastName" id="lastName" required className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                    {state?.errors?.lastName && <p className="text-red-500 text-xs mt-1">{state.errors.lastName}</p>}
                </div>
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400">Email (Optional)</label>
                <input type="email" name="email" id="email" className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                {state?.errors?.email && <p className="text-red-500 text-xs mt-1">{state.errors.email}</p>}
            </div>

            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-400">Phone (Optional)</label>
                <input type="tel" name="phone" id="phone" className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                {state?.errors?.phone && <p className="text-red-500 text-xs mt-1">{state.errors.phone}</p>}
            </div>

            <div>
                <label htmlFor="plusOnes" className="block text-sm font-medium text-gray-400">+1s</label>
                <input type="number" name="plusOnes" id="plusOnes" defaultValue={0} min={0} className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                {state?.errors?.plusOnes && <p className="text-red-500 text-xs mt-1">{state.errors.plusOnes}</p>}
            </div>

            <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-400">Note (Optional)</label>
                <textarea name="note" id="note" rows={3} className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
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
                    Add Guest
                </button>
            </div>
            {state?.message && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
        </form>
    );
}

export function AddGuestModal(props: AddGuestModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [version, setVersion] = useState(0);

    const handleOpen = () => {
        setVersion(v => v + 1);
        setIsOpen(true);
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Guest
            </button>

            {isOpen && (
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
                                        Add Guest
                                    </h3>
                                    <div className="mt-2">
                                        <AddGuestForm key={version} {...props} onSuccess={() => setIsOpen(false)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
