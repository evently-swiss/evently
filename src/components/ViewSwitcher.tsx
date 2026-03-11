'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, DoorOpen, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

type ViewSwitcherProps = {
    userRole: string;
};

export function ViewSwitcher({ userRole }: ViewSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Only admins and promoters can see the switcher
    if (userRole !== 'ADMIN' && userRole !== 'PROMOTER') {
        return null;
    }

    // Determine current view
    let currentView = 'Admin';
    if (pathname.startsWith('/promoter')) currentView = 'Promoter';
    if (pathname.startsWith('/door')) currentView = 'Door';

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-1 sm:space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors border border-gray-700"
            >
                <span className="text-gray-400 hidden sm:inline">View:</span>
                <span>{currentView}</span>
                <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-800">
                    {userRole === 'ADMIN' && (
                        <Link
                            href="/admin"
                            className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center ${currentView === 'Admin' ? 'bg-gray-800 text-white' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Admin Dashboard
                        </Link>
                    )}
                    <Link
                        href="/promoter"
                        className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center ${currentView === 'Promoter' ? 'bg-gray-800 text-white' : ''}`}
                        onClick={() => setIsOpen(false)}
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Promoter View
                    </Link>
                    <Link
                        href="/door"
                        className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center ${currentView === 'Door' ? 'bg-gray-800 text-white' : ''}`}
                        onClick={() => setIsOpen(false)}
                    >
                        <DoorOpen className="h-4 w-4 mr-2" />
                        Door View
                    </Link>
                </div>
            )}
        </div>
    );
}
