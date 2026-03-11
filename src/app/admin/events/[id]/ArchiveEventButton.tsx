'use client';

export function ArchiveEventButton({ archiveAction }: { archiveAction: () => Promise<unknown> }) {
    const handleAction = async (_formData: FormData) => {
        await archiveAction();
    };

    return (
        <form action={handleAction}>
            <button
                type="submit"
                onClick={(e) => {
                    if (!confirm('Archive this event? It will be hidden from all views.')) {
                        e.preventDefault();
                    }
                }}
                className="inline-flex items-center justify-center px-4 py-2 border border-red-800 rounded-md shadow-sm text-sm font-medium text-red-400 hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                Archive Event
            </button>
        </form>
    );
}
