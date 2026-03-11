import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, containerClassName, children, label, error, ...props }, ref) => {
        return (
            <div className={cn("w-full", containerClassName)}>
                {label && (
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={cn(
                            "appearance-none block w-full px-4 py-3 rounded-lg",
                            "bg-gray-900 border border-gray-700 text-white placeholder-gray-500",
                            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                            "transition-all duration-200 ease-in-out",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "text-base sm:text-sm", // Prevent zoom on mobile
                            className
                        )}
                        {...props}
                    >
                        {children}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Select.displayName = "Select";

export { Select };
