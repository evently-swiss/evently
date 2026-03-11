'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { Plus, X } from 'lucide-react';
import { User, SignupLink } from '@prisma/client';
import { ActionState } from '@/lib/definitions';
import { Select } from '@/components/ui/Select';

type LinkModalProps = {
    mode: 'create' | 'edit';
    eventId: string;
    link?: SignupLink & { assignedPromoters?: User[] };
    promoters?: User[];
    userRole: 'ADMIN' | 'PROMOTER';
    createAction?: (eventId: string, prevState: any, formData: FormData) => Promise<ActionState>;
    updateAction?: (linkId: string, eventId: string, prevState: any, formData: FormData) => Promise<ActionState>;
    deleteAction?: (linkId: string, eventId: string) => Promise<ActionState>;
};

function LinkForm({ mode, eventId, link, promoters, userRole, createAction, updateAction, deleteAction, onSuccess }: LinkModalProps & { onSuccess: () => void }) {
    const action = mode === 'create'
        ? createAction!.bind(null, eventId)
        : updateAction!.bind(null, link!.id, eventId);

    const [state, dispatch] = useActionState<ActionState, FormData>(action, null);

    useEffect(() => {
        if (state?.success) {
            onSuccess();
        }
    }, [state, onSuccess]);

    const isAdmin = userRole === 'ADMIN';
    const showTypeSelect = isAdmin || (mode === 'create');
    const showPromoterSelect = true; // Show for both admins and promoters
    const showActiveCheckbox = mode === 'edit';

    const handleDelete = async () => {
        if (!deleteAction || !link) return;
        if (confirm('Are you sure you want to delete this link? This cannot be undone.')) {
            const result = await deleteAction(link.id, eventId);
            if (result?.success) {
                onSuccess();
            } else {
                alert(result?.message || 'Failed to delete link');
            }
        }
    };

    return (
        <form action={dispatch} className="space-y-4">
            <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-400">Slug</label>
                <input
                    type="text"
                    name="slug"
                    id="slug"
                    required
                    defaultValue={link?.slug || ''}
                    className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
                {state?.errors?.slug && <p className="text-red-500 text-xs mt-1">{state.errors.slug}</p>}
            </div>

            {showActiveCheckbox && (
                <div className="flex items-center">
                    <input
                        id="active"
                        name="active"
                        type="checkbox"
                        defaultChecked={link?.active}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-300">
                        Active
                    </label>
                </div>
            )}

            {showTypeSelect && (
                <div>
                    <Select label="Type" name="type" id="type" defaultValue={link?.type || (isAdmin ? 'GENERAL' : 'PROMOTER')}>
                        {isAdmin && <option value="GENERAL">General</option>}
                        <option value="PROMOTER">Promoter{isAdmin ? '' : ' (Standard)'}</option>
                        <option value="PERSONAL">Personal{isAdmin ? '' : ' (VIP/Specific)'}</option>
                    </Select>
                </div>
            )}

            {showPromoterSelect && promoters && (
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Assigned Promoters
                    </label>
                    <div className="bg-gray-800 rounded-md border border-gray-700 p-4 max-h-48 overflow-y-auto">
                        {promoters.length === 0 ? (
                            <p className="text-gray-500 text-sm">No promoters found.</p>
                        ) : (
                            <div className="space-y-2">
                                {promoters.map((user) => {
                                    const isAssigned = link?.assignedPromoters?.some((p: any) => p.id === user.id) || false;
                                    return (
                                        <div key={user.id} className="flex items-center">
                                            <input
                                                id={`promoter-${user.id}`}
                                                name="promoterIds"
                                                type="checkbox"
                                                value={user.id}
                                                defaultChecked={isAssigned}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded bg-gray-700 border-gray-600"
                                            />
                                            <label htmlFor={`promoter-${user.id}`} className="ml-2 block text-sm text-gray-300">
                                                {user.name} ({user.email})
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Select which promoters can manage this link.</p>
                </div>
            )}

            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-400">Title</label>
                <input type="text" name="title" id="title" defaultValue={link?.title || ''} className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="maxTotalGuests" className="block text-sm font-medium text-gray-400">Max Guests</label>
                    <input type="number" name="maxTotalGuests" id="maxTotalGuests" defaultValue={link?.maxTotalGuests || ''} className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                </div>
                <div>
                    <label htmlFor="maxPlusOnesPerSignup" className="block text-sm font-medium text-gray-400">Max +1s</label>
                    <input type="number" name="maxPlusOnesPerSignup" id="maxPlusOnesPerSignup" defaultValue={link?.maxPlusOnesPerSignup ?? 3} className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Select label="Email" name="emailMode" id="emailMode" defaultValue={link?.emailMode || 'REQUIRED'}>
                        <option value="REQUIRED">Required</option>
                        <option value="OPTIONAL">Optional</option>
                        <option value="HIDDEN">Hidden</option>
                    </Select>
                </div>
                <div>
                    <Select label="Phone" name="phoneMode" id="phoneMode" defaultValue={link?.phoneMode || 'OPTIONAL'}>
                        <option value="OPTIONAL">Optional</option>
                        <option value="REQUIRED">Required</option>
                        <option value="HIDDEN">Hidden</option>
                    </Select>
                </div>
            </div>

            <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white focus:outline-none order-3 sm:order-1"
                    onClick={onSuccess}
                >
                    Cancel
                </button>
                {mode === 'edit' && deleteAction && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex justify-center px-4 py-2 border border-red-900 text-sm font-medium rounded-md text-red-200 bg-red-900/20 hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 order-2 sm:order-2"
                    >
                        Delete
                    </button>
                )}
                <button
                    type="submit"
                    className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 order-1 sm:order-3"
                >
                    {mode === 'create' ? 'Create' : 'Save Changes'}
                </button>
            </div>
            {state?.message && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
        </form>
    );
}

export function LinkModal(props: LinkModalProps) {
    const { mode, link, userRole } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [version, setVersion] = useState(0);

    const handleOpen = () => {
        setVersion(v => v + 1);
        setIsOpen(true);
    };

    const title = mode === 'create'
        ? (userRole === 'ADMIN' ? 'Create Signup Link' : 'Create My Link')
        : 'Edit Signup Link';

    const TriggerButton = mode === 'create' ? (
        <button
            onClick={handleOpen}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            <Plus className="h-4 w-4 mr-2" />
            New Link
        </button>
    ) : (
        <button
            onClick={handleOpen}
            className="text-indigo-400 hover:text-indigo-300 text-sm mr-4"
        >
            Edit
        </button>
    );

    if (mode === 'create' && !isOpen) {
        return TriggerButton;
    }

    return (
        <>
            {mode === 'edit' && TriggerButton}

            {isOpen && (
                <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end sm:items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-900/80 transition-opacity" aria-hidden="true" onClick={() => setIsOpen(false)}></div>

                        <div className="relative inline-block align-bottom bg-gray-900 rounded-lg px-3 pt-5 pb-4 sm:px-4 md:px-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full sm:max-w-lg md:max-w-2xl sm:p-6 border border-gray-800">
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
                                    <h3 className="text-base sm:text-lg leading-6 font-medium text-white" id="modal-title">
                                        {title}
                                    </h3>
                                    <div className="mt-2">
                                        <LinkForm key={version} {...props} onSuccess={() => setIsOpen(false)} />
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
