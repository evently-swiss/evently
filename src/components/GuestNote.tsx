'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export function GuestNote({ note }: { note?: string | null }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!note) return null;

    return (
        <>
            <div
                className="max-w-[120px] sm:max-w-[300px] cursor-pointer group"
                onClick={() => setIsOpen(true)}
                title="Click to view full note"
            >
                <p className="truncate text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    {note}
                </p>
            </div>

            {isOpen && (
                <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900/80 transition-opacity" aria-hidden="true" onClick={() => setIsOpen(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="relative inline-block align-bottom bg-gray-900 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-gray-800 mx-4 sm:mx-0">
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
                                        Guest Note
                                    </h3>
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                            {note}
                                        </p>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Close
                                        </button>
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
