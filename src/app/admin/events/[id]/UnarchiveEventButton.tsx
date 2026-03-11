'use client';

export function UnarchiveEventButton({ unarchiveAction }: { unarchiveAction: () => Promise<void> }) {
    const handleAction = async (_formData: FormData) => {
        await unarchiveAction();
    };

    return (
        <form action={handleAction}>
            <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none"
            >
                Unarchive Event
            </button>
        </form>
    );
}
