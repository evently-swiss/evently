'use client';

import { useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { importGuests } from '@/app/promoter/events/actions';

type ImportGuestsModalProps = {
    eventId: string;
};

type CSVGuest = {
    id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    plusOnesCount?: string | number;
    note?: string;
};

export function ImportGuestsModal({ eventId }: ImportGuestsModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsedGuests, setParsedGuests] = useState<CSVGuest[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success?: boolean; message?: string } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const selectedFile = e.dataTransfer.files?.[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            processFile(selectedFile);
        } else if (selectedFile) {
            setErrors(['Please upload a valid CSV file.']);
        }
    };

    const processFile = (file: File) => {
        setFile(file);
        parseCSV(file);
    };

    const parseCSV = (file: File) => {
        setErrors([]);
        setParsedGuests([]);
        setImportResult(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => {
                // Normalize headers to camelCase and handle common variations
                const h = header.toLowerCase().trim();
                if (h === 'id') return 'id';
                if (h.includes('first') && h.includes('name')) return 'firstName';
                if (h.includes('last') && h.includes('name')) return 'lastName';
                if (h.includes('email')) return 'email';
                if (h.includes('phone')) return 'phone';
                if (h.includes('plus') || h === '+1') return 'plusOnesCount';
                if (h.includes('note')) return 'note';
                return header;
            },
            complete: (results) => {
                const guests: CSVGuest[] = [];
                const newErrors: string[] = [];

                if (results.errors.length > 0) {
                    newErrors.push(...results.errors.map(e => `Row ${e.row}: ${e.message}`));
                }

                results.data.forEach((row: any, index: number) => {
                    const lineNum = index + 2; // +1 for 0-index, +1 for header

                    // Basic validation
                    if (!row.firstName || !row.lastName) {
                        newErrors.push(`Row ${lineNum}: Missing first or last name`);
                        return;
                    }

                    guests.push({
                        id: row.id,
                        firstName: row.firstName,
                        lastName: row.lastName,
                        email: row.email,
                        phone: row.phone,
                        plusOnesCount: row.plusOnesCount ? parseInt(row.plusOnesCount) : 0,
                        note: row.note
                    });
                });

                setErrors(newErrors);
                setParsedGuests(guests);
            },
            error: (error) => {
                setErrors([`File error: ${error.message}`]);
            }
        });
    };

    const handleImport = async () => {
        if (parsedGuests.length === 0) return;

        setIsImporting(true);
        try {
            // We can't pass the action directly to a client event handler if it expects specific state arguments like useActionState
            // But we can call it directly if it's just an async function. 
            // The action is defined as (eventId, prevState, guests) -> ActionState
            // So we need to match that signature or wrap it.
            // Wait, I defined it as `export async function importGuests(eventId: string, prevState: ActionState, guests: any[])`
            // Server actions called directly from client code don't automatically provide prevState.

            const result = await importGuests(eventId, null, parsedGuests);
            setImportResult({ success: result?.success, message: result?.message || 'Done' });

            if (result?.success) {
                // Clear state after short delay or keep open to show success?
                // Let's keep it open to show success message, and user can close.
                setFile(null);
                setParsedGuests([]);
            }
        } catch (error) {
            setImportResult({ success: false, message: 'Failed to invoke import action.' });
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setFile(null);
        setParsedGuests([]);
        setErrors([]);
        setImportResult(null);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center px-3 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
            </button>

            {isOpen && (
                <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-900/80 transition-opacity" aria-hidden="true" onClick={handleClose}></div>

                        <div className="relative inline-block align-bottom bg-gray-900 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-800">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    className="bg-gray-900 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                    onClick={handleClose}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                                        Import Guests
                                    </h3>

                                    {!importResult?.success && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-400 mb-4">
                                                Upload a CSV file with columns: <code>FirstName, LastName, Email, Phone, +1s, Note</code>.
                                            </p>

                                            <label
                                                className={`flex flex-col items-center px-4 py-6 bg-gray-800 rounded-lg shadow-lg tracking-wide uppercase border border-dashed cursor-pointer hover:bg-gray-700 hover:text-white transition-colors duration-200 ${isDragging ? 'border-indigo-500 bg-gray-700' : 'border-gray-600 text-blue'}`}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                            >
                                                <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-400' : ''}`} />
                                                <span className="mt-2 text-base leading-normal">{isDragging ? 'Drop file here' : 'Select or Drop a file'}</span>
                                                <input type='file' className="hidden" accept=".csv" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                    )}

                                    {file && (
                                        <div className="mt-4 bg-gray-800 p-3 rounded-md">
                                            <div className="flex items-center mb-2">
                                                <FileText className="h-5 w-5 text-indigo-400 mr-2" />
                                                <span className="text-sm text-white truncate">{file.name}</span>
                                            </div>

                                            {errors.length > 0 ? (
                                                <div className="text-red-400 text-xs mt-2 space-y-1">
                                                    {errors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
                                                    {errors.length > 5 && <p>...and {errors.length - 5} more errors</p>}
                                                </div>
                                            ) : (
                                                <div className="text-green-400 text-xs mt-2 flex items-center">
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Found {parsedGuests.length} valid guests
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {importResult && (
                                        <div className={`mt-4 p-3 rounded-md flex items-start ${importResult.success ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                                            {importResult.success ? <CheckCircle className="h-5 w-5 mr-2 shrink-0" /> : <AlertCircle className="h-5 w-5 mr-2 shrink-0" />}
                                            <p className="text-sm">{importResult.message}</p>
                                        </div>
                                    )}

                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                        {!importResult?.success && (
                                            <button
                                                type="button"
                                                onClick={handleImport}
                                                disabled={!file || parsedGuests.length === 0 || isImporting}
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isImporting ? 'Importing...' : 'Import'}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-700 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
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
