'use client';

import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import { useState } from 'react';
import { handleSignOut } from '@/app/promoter/actions';

export function PromoterNav({ session }: { session: any }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="border-b border-gray-800 bg-gray-900 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <button
                            type="button"
                            className="sm:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 mr-2"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <span className="sr-only">Open main menu</span>
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="h-6 w-6" aria-hidden="true" />
                            )}
                        </button>

                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/promoter/events" className="text-lg sm:text-xl font-bold text-indigo-500">GuestList</Link>
                        </div>

                        {/* Desktop navigation */}
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/promoter/events"
                                className="border-transparent text-gray-300 hover:border-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                My Events
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <ViewSwitcher userRole={session?.user?.role || ''} />
                        <form action={handleSignOut}>
                            <button
                                type="submit"
                                className="p-2 text-gray-400 hover:text-white focus:outline-none"
                                aria-label="Sign out"
                            >
                                <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`sm:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
                <div className="pt-2 pb-3 space-y-1 bg-gray-900 border-t border-gray-800">
                    <Link
                        href="/promoter/events"
                        className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-300 hover:bg-gray-800 hover:border-indigo-500 hover:text-white"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        My Events
                    </Link>
                </div>
            </div>
        </nav>
    );
}
