import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SignupForm from '@/components/SignupForm'; // We'll create this
import { format } from 'date-fns';



async function getLink(slug: string) {
    const link = await prisma.signupLink.findUnique({
        where: { slug },
        include: {
            event: true,
        },
    });

    if (!link) return { status: 'NOT_FOUND' as const };
    if (!link.active) return { status: 'EXPIRED' as const };
    if (link.event.status !== 'PUBLISHED') return { status: 'EVENT_NOT_PUBLISHED' as const };

    return { status: 'SUCCESS' as const, link };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const result = await getLink(slug);

    if (result.status !== 'SUCCESS') {
        return { title: 'Invalid Link' };
    }

    const { link } = result;
    const { event } = link;

    return {
        title: `${event.name} Signup`,
        description: event.description || `Sign up for ${event.name}`,
        openGraph: {
            title: `${event.name} - Guestlist`,
            description: event.description || `Sign up for ${event.name}`,
            images: event.heroImageUrl ? [event.heroImageUrl] : undefined,
        },
    };
}

export default async function SignupPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const result = await getLink(slug);

    if (result.status !== 'SUCCESS') {
        let title = 'Invalid Link';
        let message = 'This signup link is invalid.';

        switch (result.status) {
            case 'NOT_FOUND':
                title = 'Link Not Found';
                message = 'We could not find a signup link with that URL.';
                break;
            case 'EXPIRED':
                title = 'Link Expired';
                message = 'This signup link is no longer active.';
                break;
            case 'EVENT_NOT_PUBLISHED':
                title = 'Event Not Published';
                message = 'This event has not been published yet.';
                break;
        }

        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">{title}</h1>
                    <p className="text-gray-400">{message}</p>
                </div>
            </div>
        );
    }

    const { link } = result;
    const { event } = link;

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
            {/* Background Image with Blur */}
            <div className="absolute inset-0 z-0">
                {event.heroImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={event.heroImageUrl}
                        alt={event.name}
                        className="w-full h-full object-cover opacity-60 blur-xl scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-80" />
                )}
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Glassmorphic Card */}
            <div className="relative z-10 w-full max-w-md p-6 mx-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Event Header */}
                    <div className="p-8 text-center border-b border-white/10">
                        {link.title && (
                            <div className="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-wider text-indigo-200 uppercase bg-indigo-500/20 rounded-full border border-indigo-500/30">
                                {link.title}
                            </div>
                        )}
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{event.name}</h1>
                        <div className="flex flex-col items-center space-y-1 text-gray-300 text-sm">
                            <p className="font-medium text-white">
                                {format(new Date(event.date), 'dd.MM.yyyy')}
                                {event.startTime && <span className="mx-2"> • </span>}
                                {event.startTime}
                            </p>
                            {event.venueName && (
                                <p className="text-gray-400">{event.venueName}</p>
                            )}
                        </div>
                        {event.description && (
                            <p className="mt-4 text-gray-300 text-sm leading-relaxed">{event.description}</p>
                        )}
                    </div>

                    {/* Form Section */}
                    <div className="p-8 bg-black/20">
                        <SignupForm link={link} event={event} />
                    </div>
                </div>


            </div>
        </div>
    );
}
