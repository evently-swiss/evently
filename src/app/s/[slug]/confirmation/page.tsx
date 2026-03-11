import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function ConfirmationPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-md w-full space-y-6">
                <div className="flex justify-center">
                    <CheckCircle className="h-20 w-20 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold">You're on the list!</h1>
                <p className="text-gray-400">
                    Your name has been added to the guestlist. Please bring a valid ID to the event.
                </p>
                <div className="pt-8">
                    <p className="text-sm text-gray-500">
                        Need to make changes? Contact the promoter or event organizer.
                    </p>
                </div>
            </div>
        </div>
    );
}
